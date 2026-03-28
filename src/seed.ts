import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DatabaseSeedService } from './database/database-seed.service';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });
  try {
    const seeder = app.get(DatabaseSeedService);
    await seeder.run();
  } finally {
    await app.close();
  }
}

bootstrap().catch((err: unknown) => {
  const logger = new Logger('Seed');
  logger.error(err instanceof Error ? err.stack : String(err));
  process.exit(1);
});
