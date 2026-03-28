import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PickWaveStatus } from '../../shared/domain/wms.enums';
import { WarehouseOrmEntity } from '../../warehouse/persistence/warehouse.orm-entity';

@Entity({ name: 'pick_waves' })
export class PickWaveOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  warehouseId!: string;

  @ManyToOne(() => WarehouseOrmEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'warehouseId' })
  warehouse!: WarehouseOrmEntity;

  @Column({ type: 'varchar', length: 64, unique: true })
  code!: string;

  @Column({ type: 'int', default: 0 })
  priority!: number;

  @Column({ type: 'varchar', length: 32 })
  status!: PickWaveStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
