import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HandlingUnitOrmEntity } from '../persistence/handling-unit.orm-entity';
import { toIso } from '../../shared/http/date.util';
import {
  CreateHandlingUnitDto,
  HandlingUnitResponseDto,
  UpdateHandlingUnitDto,
} from './dto/handling-unit.dto';
import { rethrowDbError } from '../../shared/http/query-failed.util';

@Injectable()
export class HandlingUnitsService {
  constructor(
    @InjectRepository(HandlingUnitOrmEntity)
    private readonly repo: Repository<HandlingUnitOrmEntity>,
  ) {}

  private map(e: HandlingUnitOrmEntity): HandlingUnitResponseDto {
    return {
      id: e.id,
      code: e.code,
      type: e.type,
      currentLocationId: e.currentLocationId,
      status: e.status,
      createdAt: toIso(e.createdAt),
      updatedAt: toIso(e.updatedAt),
    };
  }

  async findAll(): Promise<HandlingUnitResponseDto[]> {
    const rows = await this.repo.find({ order: { code: 'ASC' } });
    return rows.map((r) => this.map(r));
  }

  async findOne(id: string): Promise<HandlingUnitResponseDto> {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) {
      throw new NotFoundException(`Unidade de manuseio ${id} não encontrada`);
    }
    return this.map(row);
  }

  async create(dto: CreateHandlingUnitDto): Promise<HandlingUnitResponseDto> {
    try {
      const row = this.repo.create({
        code: dto.code.trim(),
        type: dto.type,
        currentLocationId: dto.currentLocationId ?? null,
        status: dto.status,
      });
      const saved = await this.repo.save(row);
      return this.map(saved);
    } catch (err) {
      rethrowDbError(err);
    }
  }

  async update(
    id: string,
    dto: UpdateHandlingUnitDto,
  ): Promise<HandlingUnitResponseDto> {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) {
      throw new NotFoundException(`Unidade de manuseio ${id} não encontrada`);
    }
    if (dto.code !== undefined) {
      row.code = dto.code.trim();
    }
    if (dto.type !== undefined) {
      row.type = dto.type;
    }
    if (dto.currentLocationId !== undefined) {
      row.currentLocationId = dto.currentLocationId;
    }
    if (dto.status !== undefined) {
      row.status = dto.status;
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
        throw new NotFoundException(`Unidade de manuseio ${id} não encontrada`);
      }
    } catch (err) {
      if (err instanceof NotFoundException) {
        throw err;
      }
      rethrowDbError(err);
    }
  }
}
