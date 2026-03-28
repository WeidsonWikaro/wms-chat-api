import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { PickOrderOrmEntity } from '../../pick-order/persistence/pick-order.orm-entity';
import { PickWaveOrmEntity } from './pick-wave.orm-entity';

@Entity({ name: 'pick_wave_orders' })
@Unique(['pickWaveId', 'pickOrderId'])
export class PickWavePickOrderOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  pickWaveId!: string;

  @ManyToOne(() => PickWaveOrmEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'pickWaveId' })
  pickWave!: PickWaveOrmEntity;

  @Column({ type: 'uuid', unique: true })
  pickOrderId!: string;

  @ManyToOne(() => PickOrderOrmEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'pickOrderId' })
  pickOrder!: PickOrderOrmEntity;

  @Column({ type: 'int', default: 0 })
  sortOrder!: number;
}
