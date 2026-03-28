import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { DatabaseSeedModule } from './database/database-seed.module';
import { ChatModule } from './modules/chat/chat.module';
import { WmsModule } from './modules/wms/wms.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        host: config.get<string>('DB_HOST', 'localhost'),
        port: Number(config.get<string>('DB_PORT', '5432')),
        username: config.get<string>('DB_USER', 'postgres'),
        password: config.get<string>('DB_PASSWORD', 'postgres'),
        database: config.get<string>('DB_NAME', 'chat_api'),
        autoLoadEntities: true,
        synchronize:
          config.get<string>('DB_SYNC', 'true').toLowerCase() === 'true',
        logging:
          config.get<string>('DB_LOGGING', 'false').toLowerCase() === 'true',
      }),
    }),
    WmsModule,
    ChatModule,
    DatabaseSeedModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
