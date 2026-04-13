import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

export interface RagChunkRow {
  readonly id: string;
  readonly sourcePath: string;
  readonly chunkIndex: number;
  readonly content: string;
  readonly distance: number;
}

interface RagChunkQueryRow {
  id: string;
  source_path: string;
  chunk_index: number;
  content: string;
  distance: string | number;
}

/**
 * Acesso SQL a `rag_document_chunks` (coluna `vector` via literal PostgreSQL).
 */
@Injectable()
export class RagChunkRepository {
  constructor(private readonly dataSource: DataSource) {}

  async deleteBySourcePath(sourcePath: string): Promise<void> {
    await this.dataSource.query(
      `DELETE FROM rag_document_chunks WHERE source_path = $1`,
      [sourcePath],
    );
  }

  async insertChunk(input: {
    readonly sourcePath: string;
    readonly chunkIndex: number;
    readonly content: string;
    readonly contentHash: string;
    readonly embedding: readonly number[];
  }): Promise<void> {
    const vectorLiteral = formatVectorLiteral(input.embedding);
    await this.dataSource.query(
      `INSERT INTO rag_document_chunks (source_path, chunk_index, content, content_hash, embedding)
       VALUES ($1, $2, $3, $4, $5::vector)`,
      [
        input.sourcePath,
        input.chunkIndex,
        input.content,
        input.contentHash,
        vectorLiteral,
      ],
    );
  }

  async searchByEmbeddingSimilarity(
    queryEmbedding: readonly number[],
    limit: number,
  ): Promise<RagChunkRow[]> {
    const vectorLiteral = formatVectorLiteral(queryEmbedding);
    const rows = await this.dataSource.query(
      `SELECT id::text AS id, source_path, chunk_index, content,
              (embedding <=> $1::vector) AS distance
       FROM rag_document_chunks
       ORDER BY embedding <=> $1::vector
       LIMIT $2`,
      [vectorLiteral, limit],
    );
    return rows.map((r: RagChunkQueryRow) => ({
      id: r.id,
      sourcePath: r.source_path,
      chunkIndex: r.chunk_index,
      content: r.content,
      distance: Number(r.distance),
    }));
  }

  async countChunks(): Promise<number> {
    const row = await this.dataSource.query(
      `SELECT count(*)::int AS c FROM rag_document_chunks`,
    );
    return row[0]?.c ?? 0;
  }
}

function formatVectorLiteral(values: readonly number[]): string {
  return `[${values.join(',')}]`;
}
