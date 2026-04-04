import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { RagEmbeddingsService } from './rag-embeddings.service';

/**
 * Garante extensão `vector` e tabela `rag_document_chunks` (idempotente).
 * Dimensão da coluna = resultado de {@link RagEmbeddingsService.probeDimensions} (API).
 */
@Injectable()
export class RagSchemaService implements OnModuleInit {
  private readonly logger = new Logger(RagSchemaService.name);
  private ensured = false;

  constructor(
    private readonly dataSource: DataSource,
    private readonly embeddings: RagEmbeddingsService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.ensureSchema();
  }

  async ensureSchema(): Promise<void> {
    if (this.ensured) {
      return;
    }
    const dim = await this.embeddings.probeDimensions();
    if (!Number.isFinite(dim) || dim < 1) {
      throw new Error('Embedding dimension must be a positive integer.');
    }
    await this.dataSource.query(`CREATE EXTENSION IF NOT EXISTS vector`);
    await this.dropTableIfEmbeddingDimensionMismatch(dim);
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS rag_document_chunks (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        source_path text NOT NULL,
        chunk_index int NOT NULL,
        content text NOT NULL,
        content_hash text NOT NULL,
        metadata jsonb,
        embedding vector(${dim}) NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE (source_path, chunk_index)
      )
    `);
    this.logger.log(
      `RAG table ready (vector dim=${dim} from Gemini embedding). Consider adding an IVFFlat/HNSW index in production.`,
    );
    this.ensured = true;
  }

  private async dropTableIfEmbeddingDimensionMismatch(
    expectedDim: number,
  ): Promise<void> {
    const rows = (await this.dataSource.query(
      `
      SELECT (regexp_match(
        pg_catalog.format_type(a.atttypid, a.atttypmod),
        'vector\\((\\d+)\\)'
      ))[1]::int AS dim
      FROM pg_catalog.pg_attribute a
      JOIN pg_catalog.pg_class c ON c.oid = a.attrelid
      JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relname = 'rag_document_chunks'
        AND a.attname = 'embedding'
        AND NOT a.attisdropped
      `,
    )) as Array<{ dim: number | null }>;
    const current = rows[0]?.dim;
    if (current !== undefined && current !== null && current !== expectedDim) {
      this.logger.warn(
        `rag_document_chunks tinha vector(${current}); recriando com vector(${expectedDim}).`,
      );
      await this.dataSource.query(`DROP TABLE IF EXISTS rag_document_chunks`);
    }
  }
}
