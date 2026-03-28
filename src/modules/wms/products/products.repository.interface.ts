import type { Product } from './domain/product.entity';

export interface CreateProductPayload {
  readonly name: string;
  readonly barcode: string;
  readonly description?: string;
}

export interface UpdateProductPayload {
  readonly name?: string;
  readonly barcode?: string;
  readonly description?: string;
}

export interface IProductsRepository {
  findAll(): Promise<Product[]>;
  findById(id: string): Promise<Product | null>;
  create(payload: CreateProductPayload): Promise<Product>;
  update(id: string, payload: UpdateProductPayload): Promise<Product | null>;
  delete(id: string): Promise<boolean>;
}
