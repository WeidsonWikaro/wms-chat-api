import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryBalanceOrmEntity } from '../persistence/inventory-balance.orm-entity';
import { toIso } from '../../shared/http/date.util';
import {
  CreateInventoryBalanceDto,
  InventoryBalanceResponseDto,
  ProductInventorySummaryDto,
  UpdateInventoryBalanceDto,
} from './dto/inventory-balance.dto';
import { rethrowDbError } from '../../shared/http/query-failed.util';

@Injectable()
export class InventoryBalancesService {
  constructor(
    @InjectRepository(InventoryBalanceOrmEntity)
    private readonly repo: Repository<InventoryBalanceOrmEntity>,
  ) {}

  private map(e: InventoryBalanceOrmEntity): InventoryBalanceResponseDto {
    return {
      id: e.id,
      productId: e.productId,
      locationId: e.locationId,
      handlingUnitId: e.handlingUnitId,
      quantityOnHand: e.quantityOnHand,
      quantityReserved: e.quantityReserved,
      quantityAvailable: e.quantityOnHand - e.quantityReserved,
      updatedAt: toIso(e.updatedAt),
    };
  }

  async findProductSummary(
    productId: string,
  ): Promise<ProductInventorySummaryDto> {
    const rows = await this.repo.find({
      where: { productId },
      order: { updatedAt: 'DESC' },
    });
    let totalOnHand = 0;
    let totalReserved = 0;
    for (const r of rows) {
      totalOnHand += r.quantityOnHand;
      totalReserved += r.quantityReserved;
    }
    return {
      productId,
      totalQuantityAvailable: totalOnHand - totalReserved,
      totalQuantityOnHand: totalOnHand,
      totalQuantityReserved: totalReserved,
      balances: rows.map((row) => this.map(row)),
    };
  }

  async findAll(filters?: {
    productId?: string;
    locationId?: string;
  }): Promise<InventoryBalanceResponseDto[]> {
    const where: {
      productId?: string;
      locationId?: string;
    } = {};
    if (filters?.productId) {
      where.productId = filters.productId;
    }
    if (filters?.locationId) {
      where.locationId = filters.locationId;
    }
    const rows = await this.repo.find({
      where: Object.keys(where).length ? where : {},
      order: { updatedAt: 'DESC' },
    });
    return rows.map((r) => this.map(r));
  }

  async findOne(id: string): Promise<InventoryBalanceResponseDto> {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) {
      throw new NotFoundException(`Saldo de inventário ${id} não encontrado`);
    }
    return this.map(row);
  }

  async create(
    dto: CreateInventoryBalanceDto,
  ): Promise<InventoryBalanceResponseDto> {
    try {
      const row = this.repo.create({
        productId: dto.productId,
        locationId: dto.locationId,
        handlingUnitId:
          dto.handlingUnitId === undefined ? null : dto.handlingUnitId,
        quantityOnHand: dto.quantityOnHand ?? 0,
        quantityReserved: dto.quantityReserved ?? 0,
      });
      const saved = await this.repo.save(row);
      return this.map(saved);
    } catch (err) {
      rethrowDbError(err);
    }
  }

  async update(
    id: string,
    dto: UpdateInventoryBalanceDto,
  ): Promise<InventoryBalanceResponseDto> {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) {
      throw new NotFoundException(`Saldo de inventário ${id} não encontrado`);
    }
    if (dto.handlingUnitId !== undefined) {
      row.handlingUnitId = dto.handlingUnitId;
    }
    if (dto.quantityOnHand !== undefined) {
      row.quantityOnHand = dto.quantityOnHand;
    }
    if (dto.quantityReserved !== undefined) {
      row.quantityReserved = dto.quantityReserved;
    }
    try {
      const saved = await this.repo.save(row);
      return this.map(saved);
    } catch (err) {
      rethrowDbError(err);
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const r = await this.repo.delete(id);
      if ((r.affected ?? 0) === 0) {
        throw new NotFoundException(`Saldo de inventário ${id} não encontrado`);
      }
    } catch (err) {
      if (err instanceof NotFoundException) {
        throw err;
      }
      rethrowDbError(err);
    }
  }
}
