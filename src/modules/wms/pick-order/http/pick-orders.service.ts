import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PickOrderOrmEntity } from '../persistence/pick-order.orm-entity';
import { PickOrderStatus } from '../../shared/domain/wms.enums';
import { toIso } from '../../shared/http/date.util';
import { CreatePickOrderDto, PickOrderResponseDto } from './dto/pick-order.dto';
import { rethrowDbError } from '../../shared/http/query-failed.util';

@Injectable()
export class PickOrdersService {
  constructor(
    @InjectRepository(PickOrderOrmEntity)
    private readonly repo: Repository<PickOrderOrmEntity>,
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
}
