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
import { ZoneOrmEntity } from '../../zone/persistence/zone.orm-entity';

@Entity({ name: 'locations' })
@Unique(['zoneId', 'code'])
@Index(['zoneId'])
export class LocationOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  zoneId!: string;

  @ManyToOne(() => ZoneOrmEntity, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'zoneId' })
  zone!: ZoneOrmEntity;

  @Column({ type: 'varchar', length: 64 })
  code!: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  aisle!: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  bay!: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  level!: string | null;

  @Column({ type: 'boolean', default: true })
  active!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
