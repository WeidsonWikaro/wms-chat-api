import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ZoneOrmEntity } from '../persistence/zone.orm-entity';
import { toIso } from '../../shared/http/date.util';
import { CreateZoneDto, UpdateZoneDto, ZoneResponseDto } from './dto/zone.dto';
import { rethrowDbError } from '../../shared/http/query-failed.util';

@Injectable()
export class ZonesService {
  constructor(
    @InjectRepository(ZoneOrmEntity)
    private readonly repo: Repository<ZoneOrmEntity>,
  ) {}

  private map(e: ZoneOrmEntity): ZoneResponseDto {
    return {
      id: e.id,
      warehouseId: e.warehouseId,
      code: e.code,
      name: e.name,
      zoneType: e.zoneType,
      createdAt: toIso(e.createdAt),
      updatedAt: toIso(e.updatedAt),
    };
  }

  async findAll(warehouseId?: string): Promise<ZoneResponseDto[]> {
    const rows = await this.repo.find({
      where: warehouseId ? { warehouseId } : {},
      order: { code: 'ASC' },
    });
    return rows.map((r) => this.map(r));
  }

  async findOne(id: string): Promise<ZoneResponseDto> {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) {
      throw new NotFoundException(`Zona ${id} não encontrada`);
    }
    return this.map(row);
  }

  async create(dto: CreateZoneDto): Promise<ZoneResponseDto> {
    try {
      const row = this.repo.create({
        warehouseId: dto.warehouseId,
        code: dto.code.trim(),
        name: dto.name.trim(),
        zoneType: dto.zoneType,
      });
      const saved = await this.repo.save(row);
      return this.map(saved);
    } catch (err) {
      rethrowDbError(err);
    }
  }

  async update(id: string, dto: UpdateZoneDto): Promise<ZoneResponseDto> {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) {
      throw new NotFoundException(`Zona ${id} não encontrada`);
    }
    if (dto.warehouseId !== undefined) {
      row.warehouseId = dto.warehouseId;
    }
    if (dto.code !== undefined) {
      row.code = dto.code.trim();
    }
    if (dto.name !== undefined) {
      row.name = dto.name.trim();
    }
    if (dto.zoneType !== undefined) {
      row.zoneType = dto.zoneType;
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
        throw new NotFoundException(`Zona ${id} não encontrada`);
      }
    } catch (err) {
      if (err instanceof NotFoundException) {
        throw err;
      }
      rethrowDbError(err);
    }
  }
}
