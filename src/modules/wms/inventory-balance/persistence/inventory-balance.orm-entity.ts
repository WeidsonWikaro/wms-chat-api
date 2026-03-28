import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { HandlingUnitOrmEntity } from '../../handling-unit/persistence/handling-unit.orm-entity';
import { LocationOrmEntity } from '../../location/persistence/location.orm-entity';
import { ProductOrmEntity } from '../../products/persistence/product.orm-entity';

/**
 * Uniqueness for (product, location, handlingUnit) with nullable HU:
 * PostgreSQL treats NULL as distinct in UNIQUE — avoid duplicate "no HU" rows in app or add a partial unique index later.
 */
@Entity({ name: 'inventory_balances' })
@Unique(['productId', 'locationId', 'handlingUnitId'])
export class InventoryBalanceOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  productId!: string;

  @ManyToOne(() => ProductOrmEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'productId' })
  product!: ProductOrmEntity;

  @Column({ type: 'uuid' })
  locationId!: string;

  @ManyToOne(() => LocationOrmEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'locationId' })
  location!: LocationOrmEntity;

  @Column({ type: 'uuid', nullable: true })
  handlingUnitId!: string | null;

  @ManyToOne(() => HandlingUnitOrmEntity, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'handlingUnitId' })
  handlingUnit!: HandlingUnitOrmEntity | null;

  @Column({ type: 'int', default: 0 })
  quantityOnHand!: number;

  @Column({ type: 'int', default: 0 })
  quantityReserved!: number;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
