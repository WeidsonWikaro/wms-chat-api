import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { DatabaseSeedModule } from './database/database-seed.module';
import { ChatModule } from './modules/chat/chat.module';
import { RagModule } from './modules/rag/rag.module';
import { WmsModule } from './modules/wms/wms.module';

function envString(
  config: ConfigService,
  key: string,
  defaultValue: string,
): string {
  const raw = config.get<string>(key);
  if (raw === undefined || raw === null) {
    return defaultValue;
  }
  const trimmed = String(raw).replace(/^\uFEFF/, '').trim();
  return trimmed.length > 0 ? trimmed : defaultValue;
}

function postgresUrl(config: ConfigService): string {
  let host = envString(config, 'DB_HOST', '127.0.0.1');
  if (host === 'localhost') {
    host = '127.0.0.1';
  }
  const port = envString(config, 'DB_PORT', '5433');
  const user = encodeURIComponent(envString(config, 'DB_USER', 'postgres'));
  const pass = encodeURIComponent(envString(config, 'DB_PASSWORD', 'postgres'));
  const db = encodeURIComponent(envString(config, 'DB_NAME', 'chat_api'));
  return `postgresql://${user}:${pass}@${host}:${port}/${db}`;
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        delete process.env.PGPASSWORD;
        return {
          type: 'postgres' as const,
          url: postgresUrl(config),
          autoLoadEntities: true,
          synchronize:
            config.get<string>('DB_SYNC', 'true').toLowerCase() === 'true',
          logging:
            config.get<string>('DB_LOGGING', 'false').toLowerCase() === 'true',
        };
      },
    }),
    WmsModule,
    RagModule,
    ChatModule,
    DatabaseSeedModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
