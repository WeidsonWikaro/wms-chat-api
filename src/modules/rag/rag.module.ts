import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RagChunkRepository } from './persistence/rag-chunk.repository';
import { GeminiTokenService } from './services/gemini-token.service';
import { MarkdownChunkTokenService } from './services/markdown-chunk-token.service';
import { RagEmbeddingsService } from './services/rag-embeddings.service';
import { RagIngestService } from './services/rag-ingest.service';
import { RagSchemaService } from './services/rag-schema.service';
import { RagSearchService } from './services/rag-search.service';

@Module({
  imports: [TypeOrmModule],
  providers: [
    RagEmbeddingsService,
    RagSchemaService,
    GeminiTokenService,
    MarkdownChunkTokenService,
    RagChunkRepository,
    RagIngestService,
    RagSearchService,
  ],
  exports: [RagIngestService, RagSearchService],
})
export class RagModule {}
