import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
import { RagChunkRepository } from '../persistence/rag-chunk.repository';
import { MarkdownChunkTokenService } from './markdown-chunk-token.service';
import { RagEmbeddingsService } from './rag-embeddings.service';
import { RagSchemaService } from './rag-schema.service';

/**
 * Lê todos os ficheiros .md na pasta docs/ (recursivo), parte por tokens,
 * gera embeddings e grava no Postgres (pgvector).
 */
@Injectable()
export class RagIngestService {
  private readonly logger = new Logger(RagIngestService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly schema: RagSchemaService,
    private readonly chunker: MarkdownChunkTokenService,
    private readonly embeddings: RagEmbeddingsService,
    private readonly chunks: RagChunkRepository,
  ) {}

  /**
   * Pasta `docs/` na raiz do projeto (cwd em runtime).
   */
  async ingestFromDocsFolder(): Promise<{
    filesProcessed: number;
    chunksWritten: number;
  }> {
    await this.schema.ensureSchema();
    const docsRoot = path.resolve(
      process.cwd(),
      this.config.get<string>('RAG_DOCS_PATH') ?? 'docs',
    );
    let filesProcessed = 0;
    let chunksWritten = 0;
    const files = await this.collectMarkdownFiles(docsRoot);
    if (files.length === 0) {
      this.logger.warn(`Nenhum .md encontrado em ${docsRoot}`);
      return { filesProcessed: 0, chunksWritten: 0 };
    }
    for (const absolutePath of files) {
      const relativePath = path
        .relative(docsRoot, absolutePath)
        .replace(/\\/g, '/');
      const raw = await fs.readFile(absolutePath, 'utf8');
      const contentHash = createHash('sha256').update(raw).digest('hex');
      const pieces = await this.chunker.splitIntoChunks(raw);
      await this.chunks.deleteBySourcePath(relativePath);
      if (pieces.length === 0) {
        this.logger.log(`Ignorado (vazio após chunk): ${relativePath}`);
        filesProcessed += 1;
        continue;
      }
      const texts = pieces.map((p) => p.content);
      const vectors = await this.embeddings.embedDocumentsForIndex(texts);
      const expected = this.embeddings.getExpectedDimensions();
      for (let i = 0; i < vectors.length; i++) {
        const v = vectors[i];
        if (v.length !== expected) {
          throw new Error(
            `Dimensão do embedding ${v.length} !== ${expected} (probe). Verifique GEMINI_EMBEDDING_MODEL ou defina RAG_VECTOR_DIMENSIONS.`,
          );
        }
        await this.chunks.insertChunk({
          sourcePath: relativePath,
          chunkIndex: pieces[i].chunkIndex,
          content: pieces[i].content,
          contentHash,
          embedding: v,
        });
        chunksWritten += 1;
      }
      filesProcessed += 1;
      this.logger.log(
        `Indexado ${relativePath}: ${pieces.length} chunk(s), hash=${contentHash.slice(0, 8)}…`,
      );
    }
    return { filesProcessed, chunksWritten };
  }

  private async collectMarkdownFiles(root: string): Promise<string[]> {
    const out: string[] = await this.walkDir(root);
    return out.sort();
  }

  private async walkDir(dir: string): Promise<string[]> {
    const results: string[] = [];
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return results;
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        const nested = await this.walkDir(full);
        results.push(...nested);
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
        results.push(full);
      }
    }
    return results;
  }
}
