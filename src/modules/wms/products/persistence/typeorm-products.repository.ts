import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Product } from '../domain/product.entity';
import type {
  CreateProductPayload,
  IProductsRepository,
  UpdateProductPayload,
} from '../products.repository.interface';
import { ProductOrmEntity } from './product.orm-entity';

function toDomain(row: ProductOrmEntity): Product {
  return {
    id: row.id,
    name: row.name,
    barcode: row.barcode,
    description: row.description,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

@Injectable()
export class TypeormProductsRepository implements IProductsRepository {
  constructor(
    @InjectRepository(ProductOrmEntity)
    private readonly repo: Repository<ProductOrmEntity>,
  ) {}

  async findAll(): Promise<Product[]> {
    const rows = await this.repo.find({
      order: { createdAt: 'ASC' },
    });
    return rows.map(toDomain);
  }

  async findById(id: string): Promise<Product | null> {
    const row = await this.repo.findOne({ where: { id } });
    return row ? toDomain(row) : null;
  }

  async create(payload: CreateProductPayload): Promise<Product> {
    const description = payload.description?.trim().length
      ? payload.description.trim()
      : null;
    const entity = this.repo.create({
      name: payload.name,
      barcode: payload.barcode.trim(),
      description,
    });
    const saved = await this.repo.save(entity);
    return toDomain(saved);
  }

  async update(
    id: string,
    payload: UpdateProductPayload,
  ): Promise<Product | null> {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) {
      return null;
    }
    if (payload.name !== undefined) {
      row.name = payload.name;
    }
    if (payload.barcode !== undefined) {
      row.barcode = payload.barcode.trim();
    }
    if (payload.description !== undefined) {
      const trimmed = payload.description.trim();
      row.description = trimmed.length > 0 ? trimmed : null;
    }
    const saved = await this.repo.save(row);
    return toDomain(saved);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repo.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
