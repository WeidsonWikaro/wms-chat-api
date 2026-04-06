import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DEFAULT_RAG_SEARCH_TIMEOUT_MS,
  RAG_DEFAULT_TOP_K,
} from '../rag.constants';
import { RagChunkRepository, type RagChunkRow } from '../persistence/rag-chunk.repository';
import { RagEmbeddingsService } from './rag-embeddings.service';

export interface RagSearchSnippet {
  readonly text: string;
  readonly sourcePath: string;
  readonly chunkIndex: number;
  readonly distance: number;
}

/**
 * Busca semântica sobre `rag_document_chunks` (pgvector + embedding da pergunta).
 */
@Injectable()
export class RagSearchService {
  private readonly logger = new Logger(RagSearchService.name);
  private readonly searchTimeoutMs: number | null;

  constructor(
    private readonly config: ConfigService,
    private readonly embeddings: RagEmbeddingsService,
    private readonly chunks: RagChunkRepository,
  ) {
    const raw = this.config.get<string | number>('RAG_SEARCH_TIMEOUT_MS');
    if (raw === '0' || raw === 0) {
      this.searchTimeoutMs = null;
    } else if (raw === undefined || raw === null || raw === '') {
      this.searchTimeoutMs = DEFAULT_RAG_SEARCH_TIMEOUT_MS;
    } else {
      const n = typeof raw === 'number' ? raw : parseInt(String(raw), 10);
      this.searchTimeoutMs =
        Number.isFinite(n) && n > 0 ? n : DEFAULT_RAG_SEARCH_TIMEOUT_MS;
    }
  }

  async search(
    query: string,
    topK: number = RAG_DEFAULT_TOP_K,
  ): Promise<RagSearchSnippet[]> {
    const trimmed = query.trim();
    if (!trimmed) {
      return [];
    }
    if (this.searchTimeoutMs === null) {
      return this.searchInternal(trimmed, topK);
    }
    const timeoutMs = this.searchTimeoutMs;
    return Promise.race([
      this.searchInternal(trimmed, topK),
      new Promise<RagSearchSnippet[]>((_, reject) => {
        const t = setTimeout(() => {
          reject(new Error(`RAG_SEARCH_TIMEOUT_${timeoutMs}ms`));
        }, timeoutMs);
        t.unref?.();
      }),
    ]);
  }

  private async searchInternal(
    trimmed: string,
    topK: number,
  ): Promise<RagSearchSnippet[]> {
    const k = Number(
      this.config.get<string>('RAG_TOP_K') ?? String(topK),
    );
    const limit = Number.isFinite(k) && k > 0 ? Math.min(k, 32) : topK;
    const vector = await this.embeddings.embedQuery(trimmed);
    this.assertVectorDimensions(vector);
    const rows = await this.chunks.searchByEmbeddingSimilarity(vector, limit);
    return rows.map((r) => this.toSnippet(r));
  }

  private assertVectorDimensions(vector: readonly number[]): void {
    const expected = this.embeddings.getExpectedDimensions();
    if (vector.length !== expected) {
      this.logger.warn(
        `Embedding length ${vector.length} !== dimensão resolvida ${expected} (probe / RAG_VECTOR_DIMENSIONS).`,
      );
    }
  }

  private toSnippet(row: RagChunkRow): RagSearchSnippet {
    return {
      text: row.content,
      sourcePath: row.sourcePath,
      chunkIndex: row.chunkIndex,
      distance: row.distance,
    };
  }
}
