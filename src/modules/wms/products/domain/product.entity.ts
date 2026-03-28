/**
 * Domain shape for Product (persisted in PostgreSQL via TypeORM).
 */
export interface Product {
  readonly id: string;
  readonly name: string;
  readonly barcode: string;
  readonly description: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}
