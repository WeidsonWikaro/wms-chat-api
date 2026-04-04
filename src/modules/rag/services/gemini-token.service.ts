import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { DEFAULT_GEMINI_EMBEDDING_MODEL } from '../rag.constants';

/**
 * Conta tokens com o mesmo modelo usado para embeddings (alinhado à API Gemini).
 */
@Injectable()
export class GeminiTokenService {
  private readonly model;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('GOOGLE_API_KEY');
    if (!apiKey?.trim()) {
      throw new Error(
        'GOOGLE_API_KEY is required for GeminiTokenService (RAG chunking).',
      );
    }
    const modelName =
      this.config.get<string>('GEMINI_EMBEDDING_MODEL') ??
      DEFAULT_GEMINI_EMBEDDING_MODEL;
    this.model = new GoogleGenerativeAI(apiKey).getGenerativeModel({
      model: modelName,
    });
  }

  async countTokens(text: string): Promise<number> {
    const result = await this.model.countTokens({
      contents: [{ role: 'user', parts: [{ text }] }],
    });
    return result.totalTokens;
  }
}
