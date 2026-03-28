import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { AppModule } from './app.module';
import { configureApp } from './app.config';
import { setupSwagger } from './swagger.setup';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.useWebSocketAdapter(new IoAdapter(app));
  configureApp(app);
  setupSwagger(app);
  const port = Number(process.env.PORT) || 3001;
  await app.listen(port);
  const baseUrl = `http://localhost:${port}`;
  const logger = new Logger('Bootstrap');
  logger.log(`Listening on ${baseUrl} (API prefix: /api)`);
  logger.log(`Swagger UI: ${baseUrl}/api/docs`);
  logger.log(
    `Socket.IO: namespace /chat, engine path /socket.io/ (same port ${port})`,
  );
}

bootstrap().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
