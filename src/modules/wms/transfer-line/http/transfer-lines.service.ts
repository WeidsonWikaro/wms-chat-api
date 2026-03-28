import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { HandlingUnitOrmEntity } from '../../handling-unit/persistence/handling-unit.orm-entity';
import { TransferOrderOrmEntity } from '../../transfer-order/persistence/transfer-order.orm-entity';
import { TransferLineOrmEntity } from '../persistence/transfer-line.orm-entity';
import {
  TransferLineStatus,
  TransferOrderStatus,
} from '../../shared/domain/wms.enums';
import { InventoryStockService } from '../../shared/inventory-stock.service';
import { toIso } from '../../shared/http/date.util';
import {
  ConfirmTransferLineDto,
  CreateTransferLineDto,
  TransferLineResponseDto,
} from './dto/transfer-line.dto';
import { rethrowDbError } from '../../shared/http/query-failed.util';

@Injectable()
export class TransferLinesService {
  constructor(
    @InjectRepository(TransferLineOrmEntity)
    private readonly repo: Repository<TransferLineOrmEntity>,
    private readonly dataSource: DataSource,
    private readonly inventoryStock: InventoryStockService,
  ) {}

  private map(e: TransferLineOrmEntity): TransferLineResponseDto {
    return {
      id: e.id,
      transferOrderId: e.transferOrderId,
      productId: e.productId,
      quantity: e.quantity,
      fromLocationId: e.fromLocationId,
      toLocationId: e.toLocationId,
      fromHandlingUnitId: e.fromHandlingUnitId,
      toHandlingUnitId: e.toHandlingUnitId,
      status: e.status,
      createdAt: toIso(e.createdAt),
      updatedAt: toIso(e.updatedAt),
    };
  }

  async findAll(transferOrderId?: string): Promise<TransferLineResponseDto[]> {
    const rows = await this.repo.find({
      where: transferOrderId ? { transferOrderId } : {},
      order: { createdAt: 'ASC' },
    });
    return rows.map((r) => this.map(r));
  }

  async findOne(id: string): Promise<TransferLineResponseDto> {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) {
      throw new NotFoundException(
        `Linha de transferência ${id} não encontrada`,
      );
    }
    return this.map(row);
  }

  async create(dto: CreateTransferLineDto): Promise<TransferLineResponseDto> {
    try {
      const row = this.repo.create({
        transferOrderId: dto.transferOrderId,
        productId: dto.productId,
        quantity: dto.quantity,
        fromLocationId: dto.fromLocationId,
        toLocationId: dto.toLocationId,
        fromHandlingUnitId: dto.fromHandlingUnitId ?? null,
        toHandlingUnitId: dto.toHandlingUnitId ?? null,
        status: dto.status ?? TransferLineStatus.OPEN,
      });
      const saved = await this.repo.save(row);
      return this.map(saved);
    } catch (err) {
      rethrowDbError(err);
    }
  }

  async confirmTransferLine(
    id: string,
    dto: ConfirmTransferLineDto,
  ): Promise<TransferLineResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    let savedLine: TransferLineOrmEntity;
    try {
      const line = await queryRunner.manager.findOne(TransferLineOrmEntity, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!line) {
        throw new NotFoundException(
          `Linha de transferência ${id} não encontrada`,
        );
      }
      const order = await queryRunner.manager.findOne(TransferOrderOrmEntity, {
        where: { id: line.transferOrderId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!order) {
        throw new NotFoundException(
          `Ordem de transferência ${line.transferOrderId} não encontrada`,
        );
      }
      if (
        order.status !== TransferOrderStatus.RELEASED &&
        order.status !== TransferOrderStatus.IN_PROGRESS
      ) {
        throw new BadRequestException(
          'Execução só é permitida para transferências liberadas ou em andamento.',
        );
      }
      if (line.status !== TransferLineStatus.OPEN) {
        throw new BadRequestException(
          'Linha de transferência já foi executada ou está inválida.',
        );
      }
      const fromBalance = await this.inventoryStock.resolveBalanceForSource(
        queryRunner.manager,
        line.productId,
        line.fromLocationId,
        line.fromHandlingUnitId,
        true,
      );
      const toBalance = await this.inventoryStock.ensureDestinationBalance(
        queryRunner.manager,
        line.productId,
        line.toLocationId,
        line.toHandlingUnitId ?? null,
        true,
      );
      this.inventoryStock.transferOutToDestination(
        fromBalance,
        toBalance,
        line.quantity,
      );
      await queryRunner.manager.save(fromBalance);
      await queryRunner.manager.save(toBalance);
      if (line.toHandlingUnitId) {
        const hu = await queryRunner.manager.findOne(HandlingUnitOrmEntity, {
          where: { id: line.toHandlingUnitId },
          lock: { mode: 'pessimistic_write' },
        });
        if (!hu) {
          throw new BadRequestException(
            'Unidade de manuseio de destino não encontrada.',
          );
        }
        hu.currentLocationId = line.toLocationId;
        await queryRunner.manager.save(hu);
      }
      line.status = TransferLineStatus.DONE;
      savedLine = await queryRunner.manager.save(line);
      if (order.status === TransferOrderStatus.RELEASED) {
        order.status = TransferOrderStatus.IN_PROGRESS;
        await queryRunner.manager.save(order);
      }
      const allLines = await queryRunner.manager.find(TransferLineOrmEntity, {
        where: { transferOrderId: order.id },
      });
      const allDone = allLines.every(
        (l) => l.status === TransferLineStatus.DONE,
      );
      if (allDone) {
        order.status = TransferOrderStatus.COMPLETED;
        order.completedByUserId = dto.executedByUserId;
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
