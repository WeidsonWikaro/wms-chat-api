import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Product } from '../domain/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import type { IProductsRepository } from '../products.repository.interface';
import { PRODUCTS_REPOSITORY } from '../products.tokens';

@Injectable()
export class ProductsService {
  constructor(
    @Inject(PRODUCTS_REPOSITORY)
    private readonly productsRepository: IProductsRepository,
  ) {}

  async findAll(filters?: { q?: string }): Promise<Product[]> {
    if (filters?.q !== undefined && filters.q.trim().length > 0) {
      return this.productsRepository.searchByNameOrDescription(filters.q);
    }
    return this.productsRepository.findAll();
  }

  async findByBarcode(barcode: string): Promise<Product> {
    const product = await this.productsRepository.findByBarcode(barcode);
    if (!product) {
      throw new NotFoundException(
        'Produto com este código de barras não foi encontrado',
      );
    }
    return product;
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productsRepository.findById(id);
    if (!product) {
      throw new NotFoundException(`Product ${id} not found`);
    }
    return product;
  }

  async create(dto: CreateProductDto): Promise<Product> {
    return this.productsRepository.create({
      name: dto.name.trim(),
      barcode: dto.barcode.trim(),
      description: dto.description,
    });
  }

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    const updated = await this.productsRepository.update(id, {
      name: dto.name?.trim(),
      barcode: dto.barcode?.trim(),
      description: dto.description,
    });
    if (!updated) {
      throw new NotFoundException(`Product ${id} not found`);
    }
    return updated;
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.productsRepository.delete(id);
    if (!deleted) {
      throw new NotFoundException(`Product ${id} not found`);
    }
  }
}
