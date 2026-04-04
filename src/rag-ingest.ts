import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RagIngestService } from './modules/rag/services/rag-ingest.service';

/**
 * CLI: indexa Markdown em docs/ (recursivo) para pgvector.
 * Uso: npm run rag:ingest (após nest build).
 */
async function bootstrap(): Promise<void> {
  const logger = new Logger('RagIngestCli');
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });
  try {
    const ingest = app.get(RagIngestService);
    const result = await ingest.ingestFromDocsFolder();
    logger.log(
      `Concluído: ficheiros=${result.filesProcessed}, chunks=${result.chunksWritten}`,
    );
  } finally {
    await app.close();
  }
}

bootstrap().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
