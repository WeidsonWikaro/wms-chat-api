import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CycleCountTaskStatus } from '../../shared/domain/wms.enums';
import { WarehouseOrmEntity } from '../../warehouse/persistence/warehouse.orm-entity';
import { WmsUserOrmEntity } from '../../wms-user/persistence/wms-user.orm-entity';
import { ZoneOrmEntity } from '../../zone/persistence/zone.orm-entity';

@Entity({ name: 'cycle_count_tasks' })
export class CycleCountTaskOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  warehouseId!: string;

  @ManyToOne(() => WarehouseOrmEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'warehouseId' })
  warehouse!: WarehouseOrmEntity;

  @Column({ type: 'uuid', nullable: true })
  zoneId!: string | null;

  @ManyToOne(() => ZoneOrmEntity, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'zoneId' })
  zone!: ZoneOrmEntity | null;

  @Column({ type: 'varchar', length: 32 })
  status!: CycleCountTaskStatus;

  @Column({ type: 'uuid' })
  createdByUserId!: string;

  @ManyToOne(() => WmsUserOrmEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'createdByUserId' })
  createdByUser!: WmsUserOrmEntity;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
