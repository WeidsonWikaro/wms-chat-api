import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { InventoryAdjustmentOrmEntity } from '../persistence/inventory-adjustment.orm-entity';
import { InventoryStockService } from '../../shared/inventory-stock.service';
import { toIso } from '../../shared/http/date.util';
import {
  CreateInventoryAdjustmentDto,
  InventoryAdjustmentResponseDto,
} from './dto/inventory-adjustment.dto';
import { rethrowDbError } from '../../shared/http/query-failed.util';

@Injectable()
export class InventoryAdjustmentsService {
  constructor(
    @InjectRepository(InventoryAdjustmentOrmEntity)
    private readonly repo: Repository<InventoryAdjustmentOrmEntity>,
    private readonly dataSource: DataSource,
    private readonly inventoryStock: InventoryStockService,
  ) {}

  private map(e: InventoryAdjustmentOrmEntity): InventoryAdjustmentResponseDto {
    return {
      id: e.id,
      productId: e.productId,
      locationId: e.locationId,
      handlingUnitId: e.handlingUnitId,
      quantityDelta: e.quantityDelta,
      reason: e.reason,
      createdByUserId: e.createdByUserId,
      createdAt: toIso(e.createdAt),
    };
  }

  async findAll(): Promise<InventoryAdjustmentResponseDto[]> {
    const rows = await this.repo.find({ order: { createdAt: 'DESC' } });
    return rows.map((r) => this.map(r));
  }

  async findOne(id: string): Promise<InventoryAdjustmentResponseDto> {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) {
      throw new NotFoundException(`Ajuste de inventário ${id} não encontrado`);
    }
    return this.map(row);
  }

  async create(
    dto: CreateInventoryAdjustmentDto,
  ): Promise<InventoryAdjustmentResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    let saved: InventoryAdjustmentOrmEntity;
    try {
      const hu = dto.handlingUnitId === undefined ? null : dto.handlingUnitId;
      await this.inventoryStock.applyAdjustmentDelta(
        queryRunner.manager,
        dto.productId,
        dto.locationId,
        hu,
        dto.quantityDelta,
      );
      const row = queryRunner.manager.create(InventoryAdjustmentOrmEntity, {
        productId: dto.productId,
        locationId: dto.locationId,
        handlingUnitId: hu,
        quantityDelta: dto.quantityDelta,
        reason: dto.reason.trim(),
        createdByUserId: dto.createdByUserId,
      });
      saved = await queryRunner.manager.save(row);
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      rethrowDbError(err);
    } finally {
      await queryRunner.release();
    }
    return this.map(saved!);
  }
}
