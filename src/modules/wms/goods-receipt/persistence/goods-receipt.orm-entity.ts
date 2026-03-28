import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { GoodsReceiptStatus } from '../../shared/domain/wms.enums';
import { LocationOrmEntity } from '../../location/persistence/location.orm-entity';
import { WarehouseOrmEntity } from '../../warehouse/persistence/warehouse.orm-entity';
import { WmsUserOrmEntity } from '../../wms-user/persistence/wms-user.orm-entity';

@Entity({ name: 'goods_receipts' })
export class GoodsReceiptOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 64, unique: true })
  referenceCode!: string;

  @Column({ type: 'uuid' })
  warehouseId!: string;

  @ManyToOne(() => WarehouseOrmEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'warehouseId' })
  warehouse!: WarehouseOrmEntity;

  @Column({ type: 'uuid' })
  receivingLocationId!: string;

  @ManyToOne(() => LocationOrmEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'receivingLocationId' })
  receivingLocation!: LocationOrmEntity;

  @Column({ type: 'varchar', length: 32 })
  status!: GoodsReceiptStatus;

  @Column({ type: 'uuid' })
  createdByUserId!: string;

  @ManyToOne(() => WmsUserOrmEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'createdByUserId' })
  createdByUser!: WmsUserOrmEntity;

  @Column({ type: 'uuid', nullable: true })
  postedByUserId!: string | null;

  @ManyToOne(() => WmsUserOrmEntity, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'postedByUserId' })
  postedByUser!: WmsUserOrmEntity | null;

  @Column({ type: 'timestamptz', nullable: true })
  postedAt!: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
