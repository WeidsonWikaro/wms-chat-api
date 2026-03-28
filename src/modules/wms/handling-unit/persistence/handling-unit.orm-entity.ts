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
import {
  HandlingUnitStatus,
  HandlingUnitType,
} from '../../shared/domain/wms.enums';

@Entity({ name: 'handling_units' })
export class HandlingUnitOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 128, unique: true })
  code!: string;

  @Column({ type: 'varchar', length: 32 })
  type!: HandlingUnitType;

  @Column({ type: 'uuid', nullable: true })
  currentLocationId!: string | null;

  @ManyToOne(() => LocationOrmEntity, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'currentLocationId' })
  currentLocation!: LocationOrmEntity | null;

  @Column({ type: 'varchar', length: 32 })
  status!: HandlingUnitStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
