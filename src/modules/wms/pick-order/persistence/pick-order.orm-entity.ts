import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PickOrderStatus } from '../../shared/domain/wms.enums';
import { WarehouseOrmEntity } from '../../warehouse/persistence/warehouse.orm-entity';
import { WmsUserOrmEntity } from '../../wms-user/persistence/wms-user.orm-entity';

@Entity({ name: 'pick_orders' })
export class PickOrderOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 64, unique: true })
  orderNumber!: string;

  @Column({ type: 'uuid' })
  warehouseId!: string;

  @ManyToOne(() => WarehouseOrmEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'warehouseId' })
  warehouse!: WarehouseOrmEntity;

  @Column({ type: 'varchar', length: 32 })
  status!: PickOrderStatus;

  @Column({ type: 'int', nullable: true })
  priority!: number | null;

  @Column({ type: 'uuid' })
  createdByUserId!: string;

  @ManyToOne(() => WmsUserOrmEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'createdByUserId' })
  createdByUser!: WmsUserOrmEntity;

  @Column({ type: 'uuid', nullable: true })
  releasedByUserId!: string | null;

  @ManyToOne(() => WmsUserOrmEntity, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'releasedByUserId' })
  releasedByUser!: WmsUserOrmEntity | null;

  @Column({ type: 'timestamptz', nullable: true })
  releasedAt!: Date | null;

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
