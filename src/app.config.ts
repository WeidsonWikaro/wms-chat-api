import type { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';

/**
 * Shared HTTP configuration for bootstrap and e2e tests (single place for prefix, CORS, validation).
 */
export function configureApp(app: INestApplication): void {
  app.setGlobalPrefix('api');
  const corsOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
    : ['http://localhost:3000'];
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
}
