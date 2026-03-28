import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from './app.config';
import { setupSwagger } from './swagger.setup';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  configureApp(app);
  setupSwagger(app);
  const port = Number(process.env.PORT) || 3001;
  await app.listen(port);
  const baseUrl = `http://localhost:${port}`;
  const logger = new Logger('Bootstrap');
  logger.log(`Listening on ${baseUrl} (API prefix: /api)`);
  logger.log(`Swagger UI: ${baseUrl}/api/docs`);
}

bootstrap().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
