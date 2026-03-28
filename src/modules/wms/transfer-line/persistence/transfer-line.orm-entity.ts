import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { HandlingUnitOrmEntity } from '../../handling-unit/persistence/handling-unit.orm-entity';
import { LocationOrmEntity } from '../../location/persistence/location.orm-entity';
import { ProductOrmEntity } from '../../products/persistence/product.orm-entity';
import { TransferLineStatus } from '../../shared/domain/wms.enums';
import { TransferOrderOrmEntity } from '../../transfer-order/persistence/transfer-order.orm-entity';

@Entity({ name: 'transfer_lines' })
export class TransferLineOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  transferOrderId!: string;

  @ManyToOne(() => TransferOrderOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'transferOrderId' })
  transferOrder!: TransferOrderOrmEntity;

  @Column({ type: 'uuid' })
  productId!: string;

  @ManyToOne(() => ProductOrmEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'productId' })
  product!: ProductOrmEntity;

  @Column({ type: 'int' })
  quantity!: number;

  @Column({ type: 'uuid' })
  fromLocationId!: string;

  @ManyToOne(() => LocationOrmEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'fromLocationId' })
  fromLocation!: LocationOrmEntity;

  @Column({ type: 'uuid' })
  toLocationId!: string;

  @ManyToOne(() => LocationOrmEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'toLocationId' })
  toLocation!: LocationOrmEntity;

  @Column({ type: 'uuid', nullable: true })
  fromHandlingUnitId!: string | null;

  @ManyToOne(() => HandlingUnitOrmEntity, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'fromHandlingUnitId' })
  fromHandlingUnit!: HandlingUnitOrmEntity | null;

  @Column({ type: 'uuid', nullable: true })
  toHandlingUnitId!: string | null;

  @ManyToOne(() => HandlingUnitOrmEntity, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'toHandlingUnitId' })
  toHandlingUnit!: HandlingUnitOrmEntity | null;

  @Column({ type: 'varchar', length: 32, default: TransferLineStatus.OPEN })
  status!: TransferLineStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
