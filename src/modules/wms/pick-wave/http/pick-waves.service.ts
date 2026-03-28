import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PickOrderOrmEntity } from '../../pick-order/persistence/pick-order.orm-entity';
import { PickWavePickOrderOrmEntity } from '../persistence/pick-wave-order.orm-entity';
import { PickWaveOrmEntity } from '../persistence/pick-wave.orm-entity';
import {
  AddPickOrderToWaveDto,
  CreatePickWaveDto,
  PickWaveOrderResponseDto,
  PickWaveResponseDto,
} from './dto/pick-wave.dto';
import { PickWaveStatus } from '../../shared/domain/wms.enums';
import { toIso } from '../../shared/http/date.util';
import { rethrowDbError } from '../../shared/http/query-failed.util';

@Injectable()
export class PickWavesService {
  constructor(
    @InjectRepository(PickWaveOrmEntity)
    private readonly waves: Repository<PickWaveOrmEntity>,
    @InjectRepository(PickWavePickOrderOrmEntity)
    private readonly waveOrders: Repository<PickWavePickOrderOrmEntity>,
    @InjectRepository(PickOrderOrmEntity)
    private readonly pickOrders: Repository<PickOrderOrmEntity>,
  ) {}

  private mapWave(e: PickWaveOrmEntity): PickWaveResponseDto {
    return {
      id: e.id,
      warehouseId: e.warehouseId,
      code: e.code,
      priority: e.priority,
      status: e.status,
      createdAt: toIso(e.createdAt),
      updatedAt: toIso(e.updatedAt),
    };
  }

  private mapWaveOrder(
    e: PickWavePickOrderOrmEntity,
  ): PickWaveOrderResponseDto {
    return {
      id: e.id,
      pickWaveId: e.pickWaveId,
      pickOrderId: e.pickOrderId,
      sortOrder: e.sortOrder,
    };
  }

  async findAll(warehouseId?: string): Promise<PickWaveResponseDto[]> {
    const rows = await this.waves.find({
      where: warehouseId ? { warehouseId } : {},
      order: { priority: 'ASC', createdAt: 'DESC' },
    });
    return rows.map((r) => this.mapWave(r));
  }

  async findOne(id: string): Promise<PickWaveResponseDto> {
    const row = await this.waves.findOne({ where: { id } });
    if (!row) {
      throw new NotFoundException(`Onda ${id} não encontrada`);
    }
    return this.mapWave(row);
  }

  async listOrders(waveId: string): Promise<PickWaveOrderResponseDto[]> {
    const rows = await this.waveOrders.find({
      where: { pickWaveId: waveId },
      order: { sortOrder: 'ASC', id: 'ASC' },
    });
    return rows.map((r) => this.mapWaveOrder(r));
  }

  async create(dto: CreatePickWaveDto): Promise<PickWaveResponseDto> {
    try {
      const row = this.waves.create({
        warehouseId: dto.warehouseId,
        code: dto.code.trim(),
        priority: dto.priority ?? 0,
        status: PickWaveStatus.DRAFT,
      });
      const saved = await this.waves.save(row);
      return this.mapWave(saved);
    } catch (err) {
      rethrowDbError(err);
    }
  }

  async addPickOrder(
    waveId: string,
    dto: AddPickOrderToWaveDto,
  ): Promise<PickWaveOrderResponseDto> {
    const wave = await this.waves.findOne({ where: { id: waveId } });
    if (!wave) {
      throw new NotFoundException(`Onda ${waveId} não encontrada`);
    }
    if (wave.status !== PickWaveStatus.DRAFT) {
      throw new BadRequestException('Só é possível alterar ondas em rascunho.');
    }
    const order = await this.pickOrders.findOne({
      where: { id: dto.pickOrderId },
    });
    if (!order) {
      throw new NotFoundException(
        `Ordem de picking ${dto.pickOrderId} não encontrada`,
      );
    }
    if (order.warehouseId !== wave.warehouseId) {
      throw new BadRequestException(
        'A ordem de picking pertence a outro armazém que a onda.',
      );
    }
    try {
      const row = this.waveOrders.create({
        pickWaveId: waveId,
        pickOrderId: dto.pickOrderId,
        sortOrder: dto.sortOrder ?? 0,
      });
      const saved = await this.waveOrders.save(row);
      return this.mapWaveOrder(saved);
    } catch (err) {
      rethrowDbError(err);
    }
  }

  async releaseWave(id: string): Promise<PickWaveResponseDto> {
    const wave = await this.waves.findOne({ where: { id } });
    if (!wave) {
      throw new NotFoundException(`Onda ${id} não encontrada`);
    }
    if (wave.status !== PickWaveStatus.DRAFT) {
      throw new BadRequestException('Onda já liberada ou inválida.');
    }
    const links = await this.waveOrders.find({ where: { pickWaveId: id } });
    if (links.length === 0) {
      throw new BadRequestException('Onda sem ordens de picking associadas.');
    }
    const sorted = [...links].sort((a, b) => a.sortOrder - b.sortOrder);
    let p = wave.priority;
    for (const link of sorted) {
      const order = await this.pickOrders.findOne({
        where: { id: link.pickOrderId },
      });
      if (order) {
        order.priority = p;
        p += 1;
        await this.pickOrders.save(order);
      }
    }
    wave.status = PickWaveStatus.RELEASED;
    await this.waves.save(wave);
    return this.mapWave(wave);
  }
}
