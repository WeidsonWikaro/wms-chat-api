import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransferLineOrmEntity } from '../persistence/transfer-line.orm-entity';
import { TransferLineStatus } from '../../shared/domain/wms.enums';
import { toIso } from '../../shared/http/date.util';
import {
  CreateTransferLineDto,
  TransferLineResponseDto,
} from './dto/transfer-line.dto';
import { rethrowDbError } from '../../shared/http/query-failed.util';

@Injectable()
export class TransferLinesService {
  constructor(
    @InjectRepository(TransferLineOrmEntity)
    private readonly repo: Repository<TransferLineOrmEntity>,
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
}
