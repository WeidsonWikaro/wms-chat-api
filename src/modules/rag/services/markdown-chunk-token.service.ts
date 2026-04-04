import { Injectable } from '@nestjs/common';
import {
  getRagChunkMaxTokens,
  getRagOverlapTokenBudget,
} from '../rag.constants';
import { GeminiTokenService } from './gemini-token.service';

export interface MarkdownChunkPiece {
  readonly content: string;
  readonly chunkIndex: number;
}

/**
 * Parte Markdown em chunks com teto em **tokens** (não caracteres), com sobreposição em tokens.
 */
@Injectable()
export class MarkdownChunkTokenService {
  constructor(private readonly tokenService: GeminiTokenService) {}

  async splitIntoChunks(fullText: string): Promise<MarkdownChunkPiece[]> {
    const maxTokens = getRagChunkMaxTokens();
    const overlapBudget = getRagOverlapTokenBudget();
    const normalized = fullText.replace(/\r\n/g, '\n').trim();
    if (normalized.length === 0) {
      return [];
    }
    const sections = this.splitByMarkdownHeadings(normalized);
    const rawChunks: string[] = [];
    for (const section of sections) {
      const parts = await this.splitSectionToMaxTokens(section, maxTokens);
      rawChunks.push(...parts);
    }
    return this.applyOverlap(rawChunks, overlapBudget, maxTokens);
  }

  private splitByMarkdownHeadings(text: string): string[] {
    const parts = text.split(/\n(?=#{1,6}\s)/);
    return parts.map((p) => p.trim()).filter((p) => p.length > 0);
  }

  private async splitSectionToMaxTokens(
    section: string,
    maxTokens: number,
  ): Promise<string[]> {
    const tokens = await this.tokenService.countTokens(section);
    if (tokens <= maxTokens) {
      return [section];
    }
    const out: string[] = [];
    let remainder = section;
    while (remainder.length > 0) {
      const take = await this.maxPrefixWithinTokenLimit(remainder, maxTokens);
      if (take.length === 0 && remainder.length > 0) {
        const single = await this.forceSplitByCharacter(remainder, maxTokens);
        out.push(single.chunk);
        remainder = single.rest;
        continue;
      }
      if (take.length === 0) {
        break;
      }
      out.push(take);
      const next = remainder.slice(take.length).trimStart();
      if (next.length === 0) {
        break;
      }
      remainder = next;
    }
    return out;
  }

  /**
   * Encontra o maior prefixo de `text` cujo contagem de tokens é <= maxTokens.
   */
  private async maxPrefixWithinTokenLimit(
    text: string,
    maxTokens: number,
  ): Promise<string> {
    let low = 0;
    let high = text.length;
    let best = 0;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const slice = text.slice(0, mid);
      const n = await this.tokenService.countTokens(slice);
      if (n <= maxTokens) {
        best = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    return text.slice(0, best);
  }

  /**
   * Caso uma única palavra/símbolo exceda o limite de tokens (raro), corta por caracteres.
   */
  private async forceSplitByCharacter(
    text: string,
    maxTokens: number,
  ): Promise<{ chunk: string; rest: string }> {
    let low = 1;
    let high = text.length;
    let best = 1;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const slice = text.slice(0, mid);
      const n = await this.tokenService.countTokens(slice);
      if (n <= maxTokens) {
        best = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    return {
      chunk: text.slice(0, best),
      rest: text.slice(best).trimStart(),
    };
  }

  /**
   * Sufixo de `text` com até `maxTokenBudget` tokens (pesquisa binária no comprimento em caracteres).
   */
  private async suffixWithinTokenBudget(
    text: string,
    maxTokenBudget: number,
  ): Promise<string> {
    if (text.length === 0) {
      return '';
    }
    let low = 0;
    let high = text.length;
    let best = 0;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const slice = text.slice(-mid);
      const n = await this.tokenService.countTokens(slice);
      if (n <= maxTokenBudget) {
        best = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    return text.slice(-best);
  }

  private async applyOverlap(
    chunks: string[],
    overlapBudget: number,
    maxTokens: number,
  ): Promise<MarkdownChunkPiece[]> {
    if (chunks.length === 0) {
      return [];
    }
    const result: string[] = [];
    for (let i = 0; i < chunks.length; i++) {
      let piece = chunks[i];
      if (i > 0 && overlapBudget > 0) {
        const suffix = await this.suffixWithinTokenBudget(
          result[i - 1],
          overlapBudget,
        );
        if (suffix.length > 0) {
          piece = `${suffix}\n\n${piece}`;
          piece = await this.trimToMaxTokens(piece, maxTokens);
        }
      }
      result.push(piece);
    }
    return result.map((content, chunkIndex) => ({ content, chunkIndex }));
  }

  private async trimToMaxTokens(text: string, maxTokens: number): Promise<string> {
    if ((await this.tokenService.countTokens(text)) <= maxTokens) {
      return text;
    }
    return this.maxPrefixWithinTokenLimit(text, maxTokens);
  }
}
