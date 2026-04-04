import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TaskType } from '@google/generative-ai';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { DEFAULT_GEMINI_EMBEDDING_MODEL } from '../rag.constants';

/**
 * Embeddings Gemini (documento vs consulta). A dimensão do vetor vem da API
 * (probe na primeira utilização), salvo override opcional em RAG_VECTOR_DIMENSIONS.
 */
@Injectable()
export class RagEmbeddingsService {
  private readonly documentEmbeddings: GoogleGenerativeAIEmbeddings;
  private readonly queryEmbeddings: GoogleGenerativeAIEmbeddings;
  private resolvedDimensions: number | null = null;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('GOOGLE_API_KEY');
    if (!apiKey?.trim()) {
      throw new Error(
        'GOOGLE_API_KEY is required for RagEmbeddingsService (Gemini embeddings).',
      );
    }
    const model =
      this.config.get<string>('GEMINI_EMBEDDING_MODEL') ??
      DEFAULT_GEMINI_EMBEDDING_MODEL;
    const common = {
      apiKey,
      model,
      stripNewLines: false,
    };
    this.documentEmbeddings = new GoogleGenerativeAIEmbeddings({
      ...common,
      taskType: TaskType.RETRIEVAL_DOCUMENT,
    });
    this.queryEmbeddings = new GoogleGenerativeAIEmbeddings({
      ...common,
      taskType: TaskType.RETRIEVAL_QUERY,
    });
  }

  /**
   * Resolve N para vector(N): override por env, senão uma chamada real à API (embed).
   */
  async probeDimensions(): Promise<number> {
    if (this.resolvedDimensions !== null) {
      return this.resolvedDimensions;
    }
    const override = this.config.get<string>('RAG_VECTOR_DIMENSIONS')?.trim();
    if (override) {
      const n = Number(override);
      if (Number.isFinite(n) && n > 0) {
        this.resolvedDimensions = n;
        return n;
      }
    }
    const batch = await this.documentEmbeddings.embedDocuments([' ']);
    const first = batch[0];
    if (!first?.length) {
      throw new Error(
        'Gemini embedding API returned an empty vector; check model and API key.',
      );
    }
    this.resolvedDimensions = first.length;
    return this.resolvedDimensions;
  }

  getExpectedDimensions(): number {
    if (this.resolvedDimensions === null) {
      throw new Error(
        'RAG embedding dimension not resolved yet; ensure RagSchemaService.ensureSchema() ran first.',
      );
    }
    return this.resolvedDimensions;
  }

  async embedDocumentsForIndex(texts: readonly string[]): Promise<number[][]> {
    if (texts.length === 0) {
      return [];
    }
    return this.documentEmbeddings.embedDocuments([...texts]);
  }

  async embedQuery(text: string): Promise<number[]> {
    return this.queryEmbeddings.embedQuery(text);
  }
}
