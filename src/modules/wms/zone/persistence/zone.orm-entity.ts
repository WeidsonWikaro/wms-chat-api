import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { ZoneType } from '../../shared/domain/wms.enums';
import { WarehouseOrmEntity } from '../../warehouse/persistence/warehouse.orm-entity';

@Entity({ name: 'zones' })
@Unique(['warehouseId', 'code'])
@Index(['warehouseId'])
export class ZoneOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  warehouseId!: string;

  @ManyToOne(() => WarehouseOrmEntity, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'warehouseId' })
  warehouse!: WarehouseOrmEntity;

  @Column({ type: 'varchar', length: 64 })
  code!: string;

  @Column({ type: 'varchar', length: 200 })
  name!: string;

  @Column({ type: 'varchar', length: 32 })
  zoneType!: ZoneType;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
