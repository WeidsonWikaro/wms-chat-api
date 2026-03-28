import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WmsUserOrmEntity } from '../persistence/wms-user.orm-entity';
import { toIso } from '../../shared/http/date.util';
import {
  CreateWmsUserDto,
  UpdateWmsUserDto,
  WmsUserResponseDto,
} from './dto/wms-user.dto';
import { rethrowDbError } from '../../shared/http/query-failed.util';

@Injectable()
export class WmsUsersService {
  constructor(
    @InjectRepository(WmsUserOrmEntity)
    private readonly repo: Repository<WmsUserOrmEntity>,
  ) {}

  private map(e: WmsUserOrmEntity): WmsUserResponseDto {
    return {
      id: e.id,
      code: e.code,
      displayName: e.displayName,
      active: e.active,
      createdAt: toIso(e.createdAt),
      updatedAt: toIso(e.updatedAt),
    };
  }

  async findAll(): Promise<WmsUserResponseDto[]> {
    const rows = await this.repo.find({ order: { code: 'ASC' } });
    return rows.map((r) => this.map(r));
  }

  async findOne(id: string): Promise<WmsUserResponseDto> {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) {
      throw new NotFoundException(`Utilizador WMS ${id} não encontrado`);
    }
    return this.map(row);
  }

  async create(dto: CreateWmsUserDto): Promise<WmsUserResponseDto> {
    try {
      const row = this.repo.create({
        code: dto.code.trim(),
        displayName: dto.displayName.trim(),
        active: dto.active ?? true,
      });
      const saved = await this.repo.save(row);
      return this.map(saved);
    } catch (err) {
      rethrowDbError(err);
    }
  }

  async update(id: string, dto: UpdateWmsUserDto): Promise<WmsUserResponseDto> {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) {
      throw new NotFoundException(`Utilizador WMS ${id} não encontrado`);
    }
    if (dto.code !== undefined) {
      row.code = dto.code.trim();
    }
    if (dto.displayName !== undefined) {
      row.displayName = dto.displayName.trim();
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
        throw new NotFoundException(`Utilizador WMS ${id} não encontrado`);
      }
    } catch (err) {
      if (err instanceof NotFoundException) {
        throw err;
      }
      rethrowDbError(err);
    }
  }
}
