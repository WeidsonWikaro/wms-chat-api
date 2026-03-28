import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransferOrderOrmEntity } from '../persistence/transfer-order.orm-entity';
import { TransferOrderStatus } from '../../shared/domain/wms.enums';
import { toIso } from '../../shared/http/date.util';
import {
  CreateTransferOrderDto,
  TransferOrderResponseDto,
} from './dto/transfer-order.dto';
import { rethrowDbError } from '../../shared/http/query-failed.util';

@Injectable()
export class TransferOrdersService {
  constructor(
    @InjectRepository(TransferOrderOrmEntity)
    private readonly repo: Repository<TransferOrderOrmEntity>,
  ) {}

  private map(e: TransferOrderOrmEntity): TransferOrderResponseDto {
    return {
      id: e.id,
      referenceCode: e.referenceCode,
      warehouseId: e.warehouseId,
      status: e.status,
      createdByUserId: e.createdByUserId,
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
        completedByUserId: null,
        completedAt: null,
      });
      const saved = await this.repo.save(row);
      return this.map(saved);
    } catch (err) {
      rethrowDbError(err);
    }
  }
}
