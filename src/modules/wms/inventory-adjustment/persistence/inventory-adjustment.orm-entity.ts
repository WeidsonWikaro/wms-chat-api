import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { HandlingUnitOrmEntity } from '../../handling-unit/persistence/handling-unit.orm-entity';
import { LocationOrmEntity } from '../../location/persistence/location.orm-entity';
import { ProductOrmEntity } from '../../products/persistence/product.orm-entity';
import { WmsUserOrmEntity } from '../../wms-user/persistence/wms-user.orm-entity';

@Entity({ name: 'inventory_adjustments' })
export class InventoryAdjustmentOrmEntity {
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

  @Column({ type: 'int' })
  quantityDelta!: number;

  @Column({ type: 'varchar', length: 500 })
  reason!: string;

  @Column({ type: 'uuid' })
  createdByUserId!: string;

  @ManyToOne(() => WmsUserOrmEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'createdByUserId' })
  createdByUser!: WmsUserOrmEntity;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
