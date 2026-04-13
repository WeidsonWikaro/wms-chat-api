import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { WmsUserOrmEntity } from '../../wms/wms-user/persistence/wms-user.orm-entity';

@Entity({ name: 'auth_refresh_tokens' })
export class AuthRefreshTokenOrmEntity {
  @PrimaryColumn('uuid')
  jti!: string;

  @ManyToOne(() => WmsUserOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: WmsUserOrmEntity;

  @Column({ type: 'timestamptz' })
  expiresAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  revokedAt!: Date | null;
}
