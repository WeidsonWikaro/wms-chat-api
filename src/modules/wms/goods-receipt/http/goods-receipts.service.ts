import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { GoodsReceiptLineOrmEntity } from '../persistence/goods-receipt-line.orm-entity';
import { GoodsReceiptOrmEntity } from '../persistence/goods-receipt.orm-entity';
import { GoodsReceiptStatus } from '../../shared/domain/wms.enums';
import { InventoryStockService } from '../../shared/inventory-stock.service';
import { toIso } from '../../shared/http/date.util';
import {
  CreateGoodsReceiptDto,
  CreateGoodsReceiptLineDto,
  GoodsReceiptLineResponseDto,
  GoodsReceiptResponseDto,
  PostGoodsReceiptDto,
} from './dto/goods-receipt.dto';
import { rethrowDbError } from '../../shared/http/query-failed.util';

@Injectable()
export class GoodsReceiptsService {
  constructor(
    @InjectRepository(GoodsReceiptOrmEntity)
    private readonly receipts: Repository<GoodsReceiptOrmEntity>,
    @InjectRepository(GoodsReceiptLineOrmEntity)
    private readonly lines: Repository<GoodsReceiptLineOrmEntity>,
    private readonly dataSource: DataSource,
    private readonly inventoryStock: InventoryStockService,
  ) {}

  private mapReceipt(e: GoodsReceiptOrmEntity): GoodsReceiptResponseDto {
    return {
      id: e.id,
      referenceCode: e.referenceCode,
      warehouseId: e.warehouseId,
      receivingLocationId: e.receivingLocationId,
      status: e.status,
      createdByUserId: e.createdByUserId,
      postedByUserId: e.postedByUserId,
      postedAt: e.postedAt ? toIso(e.postedAt) : null,
      createdAt: toIso(e.createdAt),
      updatedAt: toIso(e.updatedAt),
    };
  }

  private mapLine(e: GoodsReceiptLineOrmEntity): GoodsReceiptLineResponseDto {
    return {
      id: e.id,
      goodsReceiptId: e.goodsReceiptId,
      productId: e.productId,
      quantity: e.quantity,
      createdAt: toIso(e.createdAt),
    };
  }

  async findAll(warehouseId?: string): Promise<GoodsReceiptResponseDto[]> {
    const rows = await this.receipts.find({
      where: warehouseId ? { warehouseId } : {},
      order: { createdAt: 'DESC' },
    });
    return rows.map((r) => this.mapReceipt(r));
  }

  async findOne(id: string): Promise<GoodsReceiptResponseDto> {
    const row = await this.receipts.findOne({ where: { id } });
    if (!row) {
      throw new NotFoundException(`Recebimento ${id} não encontrado`);
    }
    return this.mapReceipt(row);
  }

  async findLines(
    goodsReceiptId: string,
  ): Promise<GoodsReceiptLineResponseDto[]> {
    const rows = await this.lines.find({
      where: { goodsReceiptId },
      order: { createdAt: 'ASC' },
    });
    return rows.map((r) => this.mapLine(r));
  }

  async create(dto: CreateGoodsReceiptDto): Promise<GoodsReceiptResponseDto> {
    try {
      const row = this.receipts.create({
        referenceCode: dto.referenceCode.trim(),
        warehouseId: dto.warehouseId,
        receivingLocationId: dto.receivingLocationId,
        status: GoodsReceiptStatus.DRAFT,
        createdByUserId: dto.createdByUserId,
        postedByUserId: null,
        postedAt: null,
      });
      const saved = await this.receipts.save(row);
      return this.mapReceipt(saved);
    } catch (err) {
      rethrowDbError(err);
    }
  }

  async addLine(
    goodsReceiptId: string,
    dto: CreateGoodsReceiptLineDto,
  ): Promise<GoodsReceiptLineResponseDto> {
    const header = await this.receipts.findOne({
      where: { id: goodsReceiptId },
    });
    if (!header) {
      throw new NotFoundException(
        `Recebimento ${goodsReceiptId} não encontrado`,
      );
    }
    if (header.status !== GoodsReceiptStatus.DRAFT) {
      throw new BadRequestException(
        'Linhas só podem ser adicionadas em recebimento em rascunho.',
      );
    }
    try {
      const row = this.lines.create({
        goodsReceiptId,
        productId: dto.productId,
        quantity: dto.quantity,
      });
      const saved = await this.lines.save(row);
      return this.mapLine(saved);
    } catch (err) {
      rethrowDbError(err);
    }
  }

  async postReceipt(
    id: string,
    dto: PostGoodsReceiptDto,
  ): Promise<GoodsReceiptResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const header = await queryRunner.manager.findOne(GoodsReceiptOrmEntity, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!header) {
        throw new NotFoundException(`Recebimento ${id} não encontrado`);
      }
      if (header.status !== GoodsReceiptStatus.DRAFT) {
        throw new BadRequestException(
          'Recebimento já está lançado ou cancelado.',
        );
      }
      const lineRows = await queryRunner.manager.find(
        GoodsReceiptLineOrmEntity,
        {
          where: { goodsReceiptId: id },
        },
      );
      if (lineRows.length === 0) {
        throw new BadRequestException(
          'Recebimento sem linhas não pode ser lançado.',
        );
      }
      for (const line of lineRows) {
        await this.inventoryStock.applyAdjustmentDelta(
          queryRunner.manager,
          line.productId,
          header.receivingLocationId,
          null,
          line.quantity,
        );
      }
      header.status = GoodsReceiptStatus.POSTED;
      header.postedByUserId = dto.postedByUserId;
      header.postedAt = new Date();
      await queryRunner.manager.save(header);
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
    return this.findOne(id);
  }
}
