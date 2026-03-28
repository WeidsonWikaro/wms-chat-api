import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PickOrderOrmEntity } from '../../pick-order/persistence/pick-order.orm-entity';
import { PickLineOrmEntity } from '../persistence/pick-line.orm-entity';
import { PickLineStatus, PickOrderStatus } from '../../shared/domain/wms.enums';
import { InventoryStockService } from '../../shared/inventory-stock.service';
import { toIso } from '../../shared/http/date.util';
import {
  ConfirmPickLineDto,
  CreatePickLineDto,
  PickLineResponseDto,
} from './dto/pick-line.dto';
import { rethrowDbError } from '../../shared/http/query-failed.util';

@Injectable()
export class PickLinesService {
  constructor(
    @InjectRepository(PickLineOrmEntity)
    private readonly repo: Repository<PickLineOrmEntity>,
    @InjectRepository(PickOrderOrmEntity)
    private readonly pickOrders: Repository<PickOrderOrmEntity>,
    private readonly dataSource: DataSource,
    private readonly inventoryStock: InventoryStockService,
  ) {}

  private map(e: PickLineOrmEntity): PickLineResponseDto {
    return {
      id: e.id,
      pickOrderId: e.pickOrderId,
      productId: e.productId,
      quantityOrdered: e.quantityOrdered,
      quantityPicked: e.quantityPicked,
      sourceLocationId: e.sourceLocationId,
      sourceHandlingUnitId: e.sourceHandlingUnitId,
      status: e.status,
      pickedByUserId: e.pickedByUserId,
      pickedAt: e.pickedAt ? toIso(e.pickedAt) : null,
      createdAt: toIso(e.createdAt),
      updatedAt: toIso(e.updatedAt),
    };
  }

  async findAll(pickOrderId?: string): Promise<PickLineResponseDto[]> {
    const rows = await this.repo.find({
      where: pickOrderId ? { pickOrderId } : {},
      order: { createdAt: 'ASC' },
    });
    return rows.map((r) => this.map(r));
  }

  async findOne(id: string): Promise<PickLineResponseDto> {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) {
      throw new NotFoundException(`Linha de picking ${id} não encontrada`);
    }
    return this.map(row);
  }

  async create(dto: CreatePickLineDto): Promise<PickLineResponseDto> {
    try {
      const row = this.repo.create({
        pickOrderId: dto.pickOrderId,
        productId: dto.productId,
        quantityOrdered: dto.quantityOrdered,
        quantityPicked: 0,
        sourceLocationId: dto.sourceLocationId ?? null,
        sourceHandlingUnitId:
          dto.sourceHandlingUnitId === undefined
            ? null
            : dto.sourceHandlingUnitId,
        status: dto.status ?? PickLineStatus.OPEN,
        pickedByUserId: null,
        pickedAt: null,
      });
      const saved = await this.repo.save(row);
      return this.map(saved);
    } catch (err) {
      rethrowDbError(err);
    }
  }

  async confirmPick(
    id: string,
    dto: ConfirmPickLineDto,
  ): Promise<PickLineResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    let savedLine: PickLineOrmEntity;
    try {
      const line = await queryRunner.manager.findOne(PickLineOrmEntity, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!line) {
        throw new NotFoundException(`Linha de picking ${id} não encontrada`);
      }
      const order = await queryRunner.manager.findOne(PickOrderOrmEntity, {
        where: { id: line.pickOrderId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!order) {
        throw new NotFoundException(
          `Ordem de picking ${line.pickOrderId} não encontrada`,
        );
      }
      if (
        order.status !== PickOrderStatus.RELEASED &&
        order.status !== PickOrderStatus.PICKING
      ) {
        throw new BadRequestException(
          'Confirmação de picking só é permitida para ordens liberadas ou em separação.',
        );
      }
      if (
        line.status !== PickLineStatus.OPEN &&
        line.status !== PickLineStatus.PARTIAL
      ) {
        throw new BadRequestException(
          'Linha não está aberta para confirmação de picking.',
        );
      }
      if (!line.sourceLocationId) {
        throw new BadRequestException(
          'Linha sem local de origem; não é possível confirmar picking.',
        );
      }
      const newPicked = Math.min(
        line.quantityPicked + dto.quantityDelta,
        line.quantityOrdered,
      );
      const actualDelta = newPicked - line.quantityPicked;
      if (actualDelta <= 0) {
        throw new BadRequestException(
          'Nada a confirmar: a quantidade já foi atingida ou o incremento é inválido.',
        );
      }
      const balance = await this.inventoryStock.resolveBalanceForSource(
        queryRunner.manager,
        line.productId,
        line.sourceLocationId,
        line.sourceHandlingUnitId,
        true,
      );
      this.inventoryStock.consumeFromBalance(balance, actualDelta);
      await queryRunner.manager.save(balance);
      line.quantityPicked = newPicked;
      line.pickedByUserId = dto.pickedByUserId;
      line.pickedAt = new Date();
      if (line.quantityPicked >= line.quantityOrdered) {
        line.status = PickLineStatus.DONE;
      } else {
        line.status = PickLineStatus.PARTIAL;
      }
      savedLine = await queryRunner.manager.save(line);
      if (order.status === PickOrderStatus.RELEASED) {
        order.status = PickOrderStatus.PICKING;
        await queryRunner.manager.save(order);
      }
      const allLines = await queryRunner.manager.find(PickLineOrmEntity, {
        where: { pickOrderId: order.id },
      });
      const allDone = allLines.every((l) => l.status === PickLineStatus.DONE);
      if (allDone) {
        order.status = PickOrderStatus.PICKED;
        order.completedByUserId = dto.pickedByUserId;
        order.completedAt = new Date();
        await queryRunner.manager.save(order);
      }
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      if (
        err instanceof NotFoundException ||
        err instanceof BadRequestException
      ) {
        throw err;
      }
      rethrowDbError(err);
    } finally {
      await queryRunner.release();
    }
    return this.map(savedLine!);
  }
}
