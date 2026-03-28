import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { TransferLineOrmEntity } from '../../transfer-line/persistence/transfer-line.orm-entity';
import { TransferOrderOrmEntity } from '../persistence/transfer-order.orm-entity';
import {
  TransferLineStatus,
  TransferOrderStatus,
} from '../../shared/domain/wms.enums';
import { InventoryStockService } from '../../shared/inventory-stock.service';
import { toIso } from '../../shared/http/date.util';
import {
  CancelTransferOrderDto,
  CreateTransferOrderDto,
  ReleaseTransferOrderDto,
  TransferOrderResponseDto,
} from './dto/transfer-order.dto';
import { rethrowDbError } from '../../shared/http/query-failed.util';

@Injectable()
export class TransferOrdersService {
  constructor(
    @InjectRepository(TransferOrderOrmEntity)
    private readonly repo: Repository<TransferOrderOrmEntity>,
    @InjectRepository(TransferLineOrmEntity)
    private readonly transferLines: Repository<TransferLineOrmEntity>,
    private readonly dataSource: DataSource,
    private readonly inventoryStock: InventoryStockService,
  ) {}

  private map(e: TransferOrderOrmEntity): TransferOrderResponseDto {
    return {
      id: e.id,
      referenceCode: e.referenceCode,
      warehouseId: e.warehouseId,
      status: e.status,
      createdByUserId: e.createdByUserId,
      releasedByUserId: e.releasedByUserId,
      releasedAt: e.releasedAt ? toIso(e.releasedAt) : null,
      completedByUserId: e.completedByUserId,
      completedAt: e.completedAt ? toIso(e.completedAt) : null,
      createdAt: toIso(e.createdAt),
      updatedAt: toIso(e.updatedAt),
    };
  }

  async findAll(warehouseId?: string): Promise<TransferOrderResponseDto[]> {
    const rows = await this.repo.find({
      where: warehouseId ? { warehouseId } : {},
      order: { createdAt: 'DESC' },
    });
    return rows.map((r) => this.map(r));
  }

  async findOne(id: string): Promise<TransferOrderResponseDto> {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) {
      throw new NotFoundException(
        `Ordem de transferência ${id} não encontrada`,
      );
    }
    return this.map(row);
  }

  async create(dto: CreateTransferOrderDto): Promise<TransferOrderResponseDto> {
    try {
      const row = this.repo.create({
        referenceCode: dto.referenceCode.trim(),
        warehouseId: dto.warehouseId === undefined ? null : dto.warehouseId,
        status: dto.status ?? TransferOrderStatus.DRAFT,
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

  async releaseTransferOrder(
    id: string,
    dto: ReleaseTransferOrderDto,
  ): Promise<TransferOrderResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const order = await queryRunner.manager.findOne(TransferOrderOrmEntity, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!order) {
        throw new NotFoundException(
          `Ordem de transferência ${id} não encontrada`,
        );
      }
      if (order.status !== TransferOrderStatus.DRAFT) {
        throw new BadRequestException(
          'Apenas transferências em rascunho podem ser liberadas.',
        );
      }
      const lines = await queryRunner.manager.find(TransferLineOrmEntity, {
        where: { transferOrderId: id },
      });
      if (lines.length === 0) {
        throw new BadRequestException(
          'Transferência sem linhas não pode ser liberada.',
        );
      }
      for (const line of lines) {
        if (line.status === TransferLineStatus.DONE) {
          continue;
        }
        const balance = await this.inventoryStock.resolveBalanceForSource(
          queryRunner.manager,
          line.productId,
          line.fromLocationId,
          line.fromHandlingUnitId,
          true,
        );
        this.inventoryStock.reserve(balance, line.quantity);
        await queryRunner.manager.save(balance);
      }
      order.status = TransferOrderStatus.RELEASED;
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

  async cancelTransferOrder(
    id: string,
    dto: CancelTransferOrderDto,
  ): Promise<TransferOrderResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const order = await queryRunner.manager.findOne(TransferOrderOrmEntity, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!order) {
        throw new NotFoundException(
          `Ordem de transferência ${id} não encontrada`,
        );
      }
      if (order.status === TransferOrderStatus.CANCELLED) {
        throw new BadRequestException('Transferência já está cancelada.');
      }
      if (order.status === TransferOrderStatus.COMPLETED) {
        throw new BadRequestException(
          'Não é possível cancelar transferência concluída.',
        );
      }
      if (order.status === TransferOrderStatus.IN_PROGRESS) {
        throw new BadRequestException(
          'Não é possível cancelar transferência em andamento com linhas já executadas; estorno não está implementado.',
        );
      }
      if (order.status === TransferOrderStatus.RELEASED) {
        const lines = await queryRunner.manager.find(TransferLineOrmEntity, {
          where: { transferOrderId: id },
        });
        for (const line of lines) {
          if (line.status !== TransferLineStatus.OPEN) {
            continue;
          }
          const balance = await this.inventoryStock.resolveBalanceForSource(
            queryRunner.manager,
            line.productId,
            line.fromLocationId,
            line.fromHandlingUnitId,
            true,
          );
          this.inventoryStock.releaseReserved(balance, line.quantity);
          await queryRunner.manager.save(balance);
        }
      }
      order.status = TransferOrderStatus.CANCELLED;
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
