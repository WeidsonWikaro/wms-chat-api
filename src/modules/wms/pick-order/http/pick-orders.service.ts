import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PickLineOrmEntity } from '../../pick-line/persistence/pick-line.orm-entity';
import { PickOrderOrmEntity } from '../persistence/pick-order.orm-entity';
import { PickOrderStatus } from '../../shared/domain/wms.enums';
import { InventoryStockService } from '../../shared/inventory-stock.service';
import { toIso } from '../../shared/http/date.util';
import {
  CancelPickOrderDto,
  CreatePickOrderDto,
  PickOrderResponseDto,
  ReleasePickOrderDto,
} from './dto/pick-order.dto';
import { rethrowDbError } from '../../shared/http/query-failed.util';

@Injectable()
export class PickOrdersService {
  constructor(
    @InjectRepository(PickOrderOrmEntity)
    private readonly repo: Repository<PickOrderOrmEntity>,
    @InjectRepository(PickLineOrmEntity)
    private readonly pickLines: Repository<PickLineOrmEntity>,
    private readonly dataSource: DataSource,
    private readonly inventoryStock: InventoryStockService,
  ) {}

  private map(e: PickOrderOrmEntity): PickOrderResponseDto {
    return {
      id: e.id,
      orderNumber: e.orderNumber,
      warehouseId: e.warehouseId,
      status: e.status,
      priority: e.priority,
      createdByUserId: e.createdByUserId,
      releasedByUserId: e.releasedByUserId,
      releasedAt: e.releasedAt ? toIso(e.releasedAt) : null,
      completedByUserId: e.completedByUserId,
      completedAt: e.completedAt ? toIso(e.completedAt) : null,
      createdAt: toIso(e.createdAt),
      updatedAt: toIso(e.updatedAt),
    };
  }

  async findAll(warehouseId?: string): Promise<PickOrderResponseDto[]> {
    const rows = await this.repo.find({
      where: warehouseId ? { warehouseId } : {},
      order: { createdAt: 'DESC' },
    });
    return rows.map((r) => this.map(r));
  }

  async findOne(id: string): Promise<PickOrderResponseDto> {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) {
      throw new NotFoundException(`Ordem de picking ${id} não encontrada`);
    }
    return this.map(row);
  }

  async create(dto: CreatePickOrderDto): Promise<PickOrderResponseDto> {
    try {
      const row = this.repo.create({
        orderNumber: dto.orderNumber.trim(),
        warehouseId: dto.warehouseId,
        status: dto.status ?? PickOrderStatus.DRAFT,
        priority: dto.priority !== undefined ? dto.priority : null,
        createdByUserId: dto.createdByUserId,
        releasedByUserId: null,
        releasedAt: null,
        completedByUserId: null,
        completedAt: null,
      });
      const saved = await this.repo.save(row);
      return this.map(saved);
    } catch (err) {
      rethrowDbError(err);
    }
  }

  async releasePickOrder(
    id: string,
    dto: ReleasePickOrderDto,
  ): Promise<PickOrderResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const order = await queryRunner.manager.findOne(PickOrderOrmEntity, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!order) {
        throw new NotFoundException(`Ordem de picking ${id} não encontrada`);
      }
      if (order.status !== PickOrderStatus.DRAFT) {
        throw new BadRequestException(
          'Apenas ordens em rascunho podem ser liberadas.',
        );
      }
      const lines = await queryRunner.manager.find(PickLineOrmEntity, {
        where: { pickOrderId: id },
      });
      if (lines.length === 0) {
        throw new BadRequestException(
          'Ordem sem linhas não pode ser liberada para reserva.',
        );
      }
      for (const line of lines) {
        if (!line.sourceLocationId) {
          throw new BadRequestException(
            `Linha ${line.id} sem local de origem; defina sourceLocationId antes de liberar.`,
          );
        }
        const balance = await this.inventoryStock.resolveBalanceForSource(
          queryRunner.manager,
          line.productId,
          line.sourceLocationId,
          line.sourceHandlingUnitId,
          true,
        );
        this.inventoryStock.reserve(balance, line.quantityOrdered);
        await queryRunner.manager.save(balance);
      }
      order.status = PickOrderStatus.RELEASED;
      order.releasedByUserId = dto.releasedByUserId;
      order.releasedAt = new Date();
      await queryRunner.manager.save(order);
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
    return this.findOne(id);
  }

  async cancelPickOrder(
    id: string,
    dto: CancelPickOrderDto,
  ): Promise<PickOrderResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const order = await queryRunner.manager.findOne(PickOrderOrmEntity, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!order) {
        throw new NotFoundException(`Ordem de picking ${id} não encontrada`);
      }
      if (order.status === PickOrderStatus.CANCELLED) {
        throw new BadRequestException('Ordem já está cancelada.');
      }
      if (order.status === PickOrderStatus.PICKED) {
        throw new BadRequestException(
          'Não é possível cancelar ordem já concluída.',
        );
      }
      if (
        order.status === PickOrderStatus.RELEASED ||
        order.status === PickOrderStatus.PICKING
      ) {
        const lines = await queryRunner.manager.find(PickLineOrmEntity, {
          where: { pickOrderId: id },
        });
        const aggregate = new Map<string, number>();
        for (const line of lines) {
          const remaining = line.quantityOrdered - line.quantityPicked;
          if (remaining <= 0 || !line.sourceLocationId) {
            continue;
          }
          const huKey = line.sourceHandlingUnitId ?? '';
          const key = `${line.productId}|${line.sourceLocationId}|${huKey}`;
          aggregate.set(key, (aggregate.get(key) ?? 0) + remaining);
        }
        for (const [key, qty] of aggregate) {
          const [productId, locationId, huPart] = key.split('|');
          const hu = huPart === '' || huPart === undefined ? null : huPart;
          const balance = await this.inventoryStock.resolveBalanceForSource(
            queryRunner.manager,
            productId,
            locationId,
            hu,
            true,
          );
          this.inventoryStock.releaseReserved(balance, qty);
          await queryRunner.manager.save(balance);
        }
      }
      order.status = PickOrderStatus.CANCELLED;
      if (dto.cancelledByUserId) {
        order.completedByUserId = dto.cancelledByUserId;
        order.completedAt = new Date();
      }
      await queryRunner.manager.save(order);
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
    return this.findOne(id);
  }
}
