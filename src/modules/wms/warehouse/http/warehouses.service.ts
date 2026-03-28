import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WarehouseOrmEntity } from '../persistence/warehouse.orm-entity';
import { toIso } from '../../shared/http/date.util';
import {
  CreateWarehouseDto,
  UpdateWarehouseDto,
  WarehouseResponseDto,
} from './dto/warehouse.dto';
import { rethrowDbError } from '../../shared/http/query-failed.util';

@Injectable()
export class WarehousesService {
  constructor(
    @InjectRepository(WarehouseOrmEntity)
    private readonly repo: Repository<WarehouseOrmEntity>,
  ) {}

  private map(e: WarehouseOrmEntity): WarehouseResponseDto {
    return {
      id: e.id,
      code: e.code,
      name: e.name,
      active: e.active,
      createdAt: toIso(e.createdAt),
      updatedAt: toIso(e.updatedAt),
    };
  }

  async findAll(): Promise<WarehouseResponseDto[]> {
    const rows = await this.repo.find({ order: { code: 'ASC' } });
    return rows.map((r) => this.map(r));
  }

  async findOne(id: string): Promise<WarehouseResponseDto> {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) {
      throw new NotFoundException(`Armazém ${id} não encontrado`);
    }
    return this.map(row);
  }

  async create(dto: CreateWarehouseDto): Promise<WarehouseResponseDto> {
    try {
      const row = this.repo.create({
        code: dto.code.trim(),
        name: dto.name.trim(),
        active: dto.active ?? true,
      });
      const saved = await this.repo.save(row);
      return this.map(saved);
    } catch (err) {
      rethrowDbError(err);
    }
  }

  async update(
    id: string,
    dto: UpdateWarehouseDto,
  ): Promise<WarehouseResponseDto> {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) {
      throw new NotFoundException(`Armazém ${id} não encontrado`);
    }
    if (dto.code !== undefined) {
      row.code = dto.code.trim();
    }
    if (dto.name !== undefined) {
      row.name = dto.name.trim();
    }
    if (dto.active !== undefined) {
      row.active = dto.active;
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
        throw new NotFoundException(`Armazém ${id} não encontrado`);
      }
    } catch (err) {
      if (err instanceof NotFoundException) {
        throw err;
      }
      rethrowDbError(err);
    }
  }
}
