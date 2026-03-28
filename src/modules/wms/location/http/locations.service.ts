import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LocationOrmEntity } from '../persistence/location.orm-entity';
import { toIso } from '../../shared/http/date.util';
import {
  CreateLocationDto,
  LocationResponseDto,
  UpdateLocationDto,
} from './dto/location.dto';
import { rethrowDbError } from '../../shared/http/query-failed.util';

@Injectable()
export class LocationsService {
  constructor(
    @InjectRepository(LocationOrmEntity)
    private readonly repo: Repository<LocationOrmEntity>,
  ) {}

  private map(e: LocationOrmEntity): LocationResponseDto {
    return {
      id: e.id,
      zoneId: e.zoneId,
      code: e.code,
      aisle: e.aisle,
      bay: e.bay,
      level: e.level,
      active: e.active,
      createdAt: toIso(e.createdAt),
      updatedAt: toIso(e.updatedAt),
    };
  }

  async findAll(zoneId?: string): Promise<LocationResponseDto[]> {
    const rows = await this.repo.find({
      where: zoneId ? { zoneId } : {},
      order: { code: 'ASC' },
    });
    return rows.map((r) => this.map(r));
  }

  async findOne(id: string): Promise<LocationResponseDto> {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) {
      throw new NotFoundException(`Localização ${id} não encontrada`);
    }
    return this.map(row);
  }

  async create(dto: CreateLocationDto): Promise<LocationResponseDto> {
    try {
      const row = this.repo.create({
        zoneId: dto.zoneId,
        code: dto.code.trim(),
        aisle: dto.aisle ?? null,
        bay: dto.bay ?? null,
        level: dto.level ?? null,
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
    dto: UpdateLocationDto,
  ): Promise<LocationResponseDto> {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) {
      throw new NotFoundException(`Localização ${id} não encontrada`);
    }
    if (dto.zoneId !== undefined) {
      row.zoneId = dto.zoneId;
    }
    if (dto.code !== undefined) {
      row.code = dto.code.trim();
    }
    if (dto.aisle !== undefined) {
      row.aisle = dto.aisle;
    }
    if (dto.bay !== undefined) {
      row.bay = dto.bay;
    }
    if (dto.level !== undefined) {
      row.level = dto.level;
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
        throw new NotFoundException(`Localização ${id} não encontrada`);
      }
    } catch (err) {
      if (err instanceof NotFoundException) {
        throw err;
      }
      rethrowDbError(err);
    }
  }
}
