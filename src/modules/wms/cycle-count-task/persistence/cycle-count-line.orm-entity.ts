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
import { CycleCountTaskOrmEntity } from './cycle-count-task.orm-entity';

@Entity({ name: 'cycle_count_lines' })
export class CycleCountLineOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  cycleCountTaskId!: string;

  @ManyToOne(() => CycleCountTaskOrmEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'cycleCountTaskId' })
  cycleCountTask!: CycleCountTaskOrmEntity;

  @Column({ type: 'uuid' })
  productId!: string;

  @ManyToOne(() => ProductOrmEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'productId' })
  product!: ProductOrmEntity;

  @Column({ type: 'uuid' })
  locationId!: string;

  @ManyToOne(() => LocationOrmEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'locationId' })
  location!: LocationOrmEntity;

  @Column({ type: 'uuid', nullable: true })
  handlingUnitId!: string | null;

  @ManyToOne(() => HandlingUnitOrmEntity, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'handlingUnitId' })
  handlingUnit!: HandlingUnitOrmEntity | null;

  @Column({ type: 'int' })
  quantityExpected!: number;

  @Column({ type: 'int', nullable: true })
  quantityCounted!: number | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
