import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Chat API')
    .setDescription(
      'Backend for the chat frontend. Health check and example Products CRUD (PostgreSQL).',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description:
          'Access JWT (campo accessToken de POST /api/auth/login ou /api/auth/refresh).',
      },
      'access-token',
    )
    .addTag('health', 'Liveness')
    .addTag('auth', 'Login e tokens')
    .addTag('products', 'Example CRUD')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    useGlobalPrefix: true,
  });
}
