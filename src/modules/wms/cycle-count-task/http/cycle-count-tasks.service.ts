import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { InventoryAdjustmentOrmEntity } from '../../inventory-adjustment/persistence/inventory-adjustment.orm-entity';
import { CycleCountLineOrmEntity } from '../persistence/cycle-count-line.orm-entity';
import { CycleCountTaskOrmEntity } from '../persistence/cycle-count-task.orm-entity';
import {
  CycleCountLineResponseDto,
  CycleCountTaskResponseDto,
  CreateCycleCountLineDto,
  CreateCycleCountTaskDto,
  PostCycleCountAdjustmentsDto,
  SubmitCycleCountsDto,
} from './dto/cycle-count-task.dto';
import { CycleCountTaskStatus } from '../../shared/domain/wms.enums';
import { InventoryStockService } from '../../shared/inventory-stock.service';
import { toIso } from '../../shared/http/date.util';
import { rethrowDbError } from '../../shared/http/query-failed.util';

@Injectable()
export class CycleCountTasksService {
  constructor(
    @InjectRepository(CycleCountTaskOrmEntity)
    private readonly tasks: Repository<CycleCountTaskOrmEntity>,
    @InjectRepository(CycleCountLineOrmEntity)
    private readonly lines: Repository<CycleCountLineOrmEntity>,
    private readonly dataSource: DataSource,
    private readonly inventoryStock: InventoryStockService,
  ) {}

  private mapTask(e: CycleCountTaskOrmEntity): CycleCountTaskResponseDto {
    return {
      id: e.id,
      warehouseId: e.warehouseId,
      zoneId: e.zoneId,
      status: e.status,
      createdByUserId: e.createdByUserId,
      createdAt: toIso(e.createdAt),
      updatedAt: toIso(e.updatedAt),
    };
  }

  private mapLine(e: CycleCountLineOrmEntity): CycleCountLineResponseDto {
    return {
      id: e.id,
      cycleCountTaskId: e.cycleCountTaskId,
      productId: e.productId,
      locationId: e.locationId,
      handlingUnitId: e.handlingUnitId,
      quantityExpected: e.quantityExpected,
      quantityCounted: e.quantityCounted,
      createdAt: toIso(e.createdAt),
      updatedAt: toIso(e.updatedAt),
    };
  }

  async findAll(warehouseId?: string): Promise<CycleCountTaskResponseDto[]> {
    const rows = await this.tasks.find({
      where: warehouseId ? { warehouseId } : {},
      order: { createdAt: 'DESC' },
    });
    return rows.map((r) => this.mapTask(r));
  }

  async findOne(id: string): Promise<CycleCountTaskResponseDto> {
    const row = await this.tasks.findOne({ where: { id } });
    if (!row) {
      throw new NotFoundException(`Tarefa de contagem ${id} não encontrada`);
    }
    return this.mapTask(row);
  }

  async findLines(taskId: string): Promise<CycleCountLineResponseDto[]> {
    const rows = await this.lines.find({
      where: { cycleCountTaskId: taskId },
      order: { createdAt: 'ASC' },
    });
    return rows.map((r) => this.mapLine(r));
  }

  async create(
    dto: CreateCycleCountTaskDto,
  ): Promise<CycleCountTaskResponseDto> {
    try {
      const row = this.tasks.create({
        warehouseId: dto.warehouseId,
        zoneId: dto.zoneId === undefined ? null : dto.zoneId,
        status: CycleCountTaskStatus.OPEN,
        createdByUserId: dto.createdByUserId,
      });
      const saved = await this.tasks.save(row);
      return this.mapTask(saved);
    } catch (err) {
      rethrowDbError(err);
    }
  }

  async addLine(
    taskId: string,
    dto: CreateCycleCountLineDto,
  ): Promise<CycleCountLineResponseDto> {
    const task = await this.tasks.findOne({ where: { id: taskId } });
    if (!task) {
      throw new NotFoundException(
        `Tarefa de contagem ${taskId} não encontrada`,
      );
    }
    if (
      task.status !== CycleCountTaskStatus.OPEN &&
      task.status !== CycleCountTaskStatus.COUNTING
    ) {
      throw new BadRequestException(
        'Linhas só podem ser adicionadas em tarefa aberta ou em contagem.',
      );
    }
    const manager = this.dataSource.manager;
    const balance = await this.inventoryStock.resolveBalanceForSource(
      manager,
      dto.productId,
      dto.locationId,
      dto.handlingUnitId,
      false,
    );
    try {
      const row = this.lines.create({
        cycleCountTaskId: taskId,
        productId: dto.productId,
        locationId: dto.locationId,
        handlingUnitId:
          dto.handlingUnitId === undefined ? null : dto.handlingUnitId,
        quantityExpected: balance.quantityOnHand,
        quantityCounted: null,
      });
      const saved = await this.lines.save(row);
      return this.mapLine(saved);
    } catch (err) {
      rethrowDbError(err);
    }
  }

  async submitCounts(
    taskId: string,
    dto: SubmitCycleCountsDto,
  ): Promise<CycleCountLineResponseDto[]> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    const updated: CycleCountLineOrmEntity[] = [];
    try {
      const task = await queryRunner.manager.findOne(CycleCountTaskOrmEntity, {
        where: { id: taskId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!task) {
        throw new NotFoundException(
          `Tarefa de contagem ${taskId} não encontrada`,
        );
      }
      if (task.status === CycleCountTaskStatus.COMPLETED) {
        throw new BadRequestException('Tarefa já concluída.');
      }
      if (task.status === CycleCountTaskStatus.CANCELLED) {
        throw new BadRequestException('Tarefa cancelada.');
      }
      for (const entry of dto.entries) {
        const line = await queryRunner.manager.findOne(
          CycleCountLineOrmEntity,
          {
            where: { id: entry.lineId, cycleCountTaskId: taskId },
            lock: { mode: 'pessimistic_write' },
          },
        );
        if (!line) {
          throw new BadRequestException(
            `Linha ${entry.lineId} não pertence à tarefa.`,
          );
        }
        line.quantityCounted = entry.quantityCounted;
        updated.push(await queryRunner.manager.save(line));
      }
      task.status = CycleCountTaskStatus.COUNTING;
      await queryRunner.manager.save(task);
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      if (
        err instanceof NotFoundException ||
        err instanceof BadRequestException
      ) {
        throw err;
      }
      rethrowDbError(err);
    } finally {
      await queryRunner.release();
    }
    return updated.map((e) => this.mapLine(e));
  }

  async postAdjustments(
    taskId: string,
    dto: PostCycleCountAdjustmentsDto,
  ): Promise<CycleCountTaskResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const task = await queryRunner.manager.findOne(CycleCountTaskOrmEntity, {
        where: { id: taskId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!task) {
        throw new NotFoundException(
          `Tarefa de contagem ${taskId} não encontrada`,
        );
      }
      if (task.status !== CycleCountTaskStatus.COUNTING) {
        throw new BadRequestException(
          'Envie contagens antes de gerar ajustes (status COUNTING).',
        );
      }
      const lineRows = await queryRunner.manager.find(CycleCountLineOrmEntity, {
        where: { cycleCountTaskId: taskId },
      });
      if (lineRows.length === 0) {
        throw new BadRequestException('Tarefa sem linhas.');
      }
      for (const line of lineRows) {
        if (line.quantityCounted === null) {
          throw new BadRequestException(
            `Linha ${line.id} sem quantidade contada.`,
          );
        }
        const delta = line.quantityCounted - line.quantityExpected;
        if (delta === 0) {
          continue;
        }
        await this.inventoryStock.applyAdjustmentDelta(
          queryRunner.manager,
          line.productId,
          line.locationId,
          line.handlingUnitId,
          delta,
        );
        const adj = queryRunner.manager.create(InventoryAdjustmentOrmEntity, {
          productId: line.productId,
          locationId: line.locationId,
          handlingUnitId: line.handlingUnitId,
          quantityDelta: delta,
          reason: `Contagem cíclica (tarefa ${taskId})`,
          createdByUserId: dto.postedByUserId,
        });
        await queryRunner.manager.save(adj);
      }
      task.status = CycleCountTaskStatus.COMPLETED;
      await queryRunner.manager.save(task);
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      if (
        err instanceof NotFoundException ||
        err instanceof BadRequestException
      ) {
        throw err;
      }
      rethrowDbError(err);
    } finally {
      await queryRunner.release();
    }
    return this.findOne(taskId);
  }
}
