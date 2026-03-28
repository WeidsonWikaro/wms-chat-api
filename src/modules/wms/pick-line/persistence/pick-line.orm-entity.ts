import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { LocationOrmEntity } from '../../location/persistence/location.orm-entity';
import { PickOrderOrmEntity } from '../../pick-order/persistence/pick-order.orm-entity';
import { ProductOrmEntity } from '../../products/persistence/product.orm-entity';
import { PickLineStatus } from '../../shared/domain/wms.enums';
import { WmsUserOrmEntity } from '../../wms-user/persistence/wms-user.orm-entity';

@Entity({ name: 'pick_lines' })
export class PickLineOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  pickOrderId!: string;

  @ManyToOne(() => PickOrderOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pickOrderId' })
  pickOrder!: PickOrderOrmEntity;

  @Column({ type: 'uuid' })
  productId!: string;

  @ManyToOne(() => ProductOrmEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'productId' })
  product!: ProductOrmEntity;

  @Column({ type: 'int' })
  quantityOrdered!: number;

  @Column({ type: 'int', default: 0 })
  quantityPicked!: number;

  @Column({ type: 'uuid', nullable: true })
  sourceLocationId!: string | null;

  @ManyToOne(() => LocationOrmEntity, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'sourceLocationId' })
  sourceLocation!: LocationOrmEntity | null;

  @Column({ type: 'varchar', length: 32 })
  status!: PickLineStatus;

  @Column({ type: 'uuid', nullable: true })
  pickedByUserId!: string | null;

  @ManyToOne(() => WmsUserOrmEntity, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'pickedByUserId' })
  pickedByUser!: WmsUserOrmEntity | null;

  @Column({ type: 'timestamptz', nullable: true })
  pickedAt!: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
