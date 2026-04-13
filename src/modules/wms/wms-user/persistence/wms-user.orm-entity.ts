import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { WmsUserRole } from '../../shared/domain/wms-user-role.enum';

@Entity({ name: 'wms_users' })
export class WmsUserOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 64, unique: true })
  code!: string;

  @Column({ type: 'varchar', length: 200 })
  displayName!: string;

  @Column({ type: 'varchar', length: 60, nullable: true })
  passwordHash!: string | null;

  @Column({
    type: 'enum',
    enum: WmsUserRole,
    enumName: 'wms_user_role_enum',
    default: WmsUserRole.OPERATOR,
  })
  role!: WmsUserRole;

  @Column({ type: 'boolean', default: true })
  active!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
