import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TransferOrderStatus } from '../../shared/domain/wms.enums';
import { WarehouseOrmEntity } from '../../warehouse/persistence/warehouse.orm-entity';
import { WmsUserOrmEntity } from '../../wms-user/persistence/wms-user.orm-entity';

@Entity({ name: 'transfer_orders' })
export class TransferOrderOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 64, unique: true })
  referenceCode!: string;

  @Column({ type: 'uuid', nullable: true })
  warehouseId!: string | null;

  @ManyToOne(() => WarehouseOrmEntity, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'warehouseId' })
  warehouse!: WarehouseOrmEntity | null;

  @Column({ type: 'varchar', length: 32 })
  status!: TransferOrderStatus;

  @Column({ type: 'uuid' })
  createdByUserId!: string;

  @ManyToOne(() => WmsUserOrmEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'createdByUserId' })
  createdByUser!: WmsUserOrmEntity;

  @Column({ type: 'uuid', nullable: true })
  completedByUserId!: string | null;

  @ManyToOne(() => WmsUserOrmEntity, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'completedByUserId' })
  completedByUser!: WmsUserOrmEntity | null;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt!: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
