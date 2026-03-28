import type { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';

/** Origens CORS (HTTP REST + Socket.IO devem usar a mesma lista). */
export function getCorsOrigins(): string[] {
  return process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
    : ['http://localhost:3000'];
}

/**
 * Shared HTTP configuration for bootstrap and e2e tests (single place for prefix, CORS, validation).
 */
export function configureApp(app: INestApplication): void {
  app.setGlobalPrefix('api');
  const corsOrigins = getCorsOrigins();
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
