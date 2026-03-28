import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PickLineOrmEntity } from '../persistence/pick-line.orm-entity';
import { PickLineStatus } from '../../shared/domain/wms.enums';
import { toIso } from '../../shared/http/date.util';
import { CreatePickLineDto, PickLineResponseDto } from './dto/pick-line.dto';
import { rethrowDbError } from '../../shared/http/query-failed.util';

@Injectable()
export class PickLinesService {
  constructor(
    @InjectRepository(PickLineOrmEntity)
    private readonly repo: Repository<PickLineOrmEntity>,
  ) {}

  private map(e: PickLineOrmEntity): PickLineResponseDto {
    return {
      id: e.id,
      pickOrderId: e.pickOrderId,
      productId: e.productId,
      quantityOrdered: e.quantityOrdered,
      quantityPicked: e.quantityPicked,
      sourceLocationId: e.sourceLocationId,
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
}
