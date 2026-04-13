import { Injectable } from '@nestjs/common';
import {
  getRagChunkMaxTokens,
  getRagMinChunkTokens,
  getRagOverlapTokenBudget,
} from '../rag.constants';
import { GeminiTokenService } from './gemini-token.service';

export interface MarkdownChunkPiece {
  readonly content: string;
  readonly chunkIndex: number;
}

/**
 * Parte Markdown em chunks com teto em **tokens** (não caracteres), com sobreposição em tokens.
 * Estratégia: fronteira principal em cabeçalhos **##**; secções grandes subdividem-se por **###**;
 * tabelas e blocos de código (fences) são atómicos; fragmentos muito pequenos fundem-se quando couber no teto.
 */
@Injectable()
export class MarkdownChunkTokenService {
  constructor(private readonly tokenService: GeminiTokenService) {}

  async splitIntoChunks(fullText: string): Promise<MarkdownChunkPiece[]> {
    const maxTokens = getRagChunkMaxTokens();
    const minTokens = getRagMinChunkTokens();
    const overlapBudget = getRagOverlapTokenBudget();
    const normalized = fullText.replace(/\r\n/g, '\n').trim();
    if (normalized.length === 0) {
      return [];
    }
    const h2Sections = this.splitByH2Headings(normalized);
    const rawChunks: string[] = [];
    for (const section of h2Sections) {
      const parts = await this.splitSectionIntoStructuredChunks(
        section,
        maxTokens,
      );
      rawChunks.push(...parts);
    }
    const merged = await this.mergeSmallChunks(rawChunks, minTokens, maxTokens);
    return this.applyOverlap(merged, overlapBudget, maxTokens);
  }

  /**
   * Divide só em cabeçalhos de nível 2 (`## Título`), não em `#` nem `###`,
   * para manter cada secção de negócio como unidade semântica.
   */
  private splitByH2Headings(text: string): string[] {
    const parts = text.split(/\n(?=##\s)/);
    return parts.map((p) => p.trim()).filter((p) => p.length > 0);
  }

  /**
   * Subdivide por `###` apenas quando a linha começa com três `#` e um espaço (H3, não H4+).
   */
  private splitByH3Headings(section: string): string[] {
    const parts = section.split(/\n(?=###\s(?!#))/);
    return parts.map((p) => p.trim()).filter((p) => p.length > 0);
  }

  private async splitSectionIntoStructuredChunks(
    section: string,
    maxTokens: number,
  ): Promise<string[]> {
    const tokens = await this.tokenService.countTokens(section);
    if (tokens <= maxTokens) {
      return [section];
    }
    const h3Parts = this.splitByH3Headings(section);
    if (h3Parts.length > 1) {
      const out: string[] = [];
      for (const part of h3Parts) {
        out.push(
          ...(await this.splitSectionIntoStructuredChunks(part, maxTokens)),
        );
      }
      return out;
    }
    return this.packSegmentsIntoChunks(
      this.segmentMarkdownForSplitting(section),
      maxTokens,
    );
  }

  /**
   * Segmenta o texto em blocos atómicos (código) e tabelas; o resto em parágrafos (blocos entre linhas em branco).
   */
  private segmentMarkdownForSplitting(text: string): string[] {
    const lines = text.split('\n');
    const segments: string[] = [];
    let i = 0;
    const paragraphLines: string[] = [];
    const flushParagraph = (): void => {
      if (paragraphLines.length === 0) {
        return;
      }
      segments.push(paragraphLines.join('\n'));
      paragraphLines.length = 0;
    };
    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();
      if (trimmed.startsWith('```')) {
        flushParagraph();
        const start = i;
        i += 1;
        while (i < lines.length) {
          if (lines[i].trim().startsWith('```')) {
            i += 1;
            break;
          }
          i += 1;
        }
        segments.push(lines.slice(start, i).join('\n'));
        continue;
      }
      if (this.isMarkdownTableRow(trimmed)) {
        flushParagraph();
        const start = i;
        i += 1;
        while (i < lines.length) {
          const ti = lines[i].trim();
          if (ti.length === 0) {
            break;
          }
          if (
            this.isMarkdownTableRow(ti) ||
            this.isMarkdownTableSeparator(ti)
          ) {
            i += 1;
          } else {
            break;
          }
        }
        segments.push(lines.slice(start, i).join('\n'));
        continue;
      }
      if (trimmed.length === 0) {
        flushParagraph();
        i += 1;
        continue;
      }
      paragraphLines.push(line);
      i += 1;
    }
    flushParagraph();
    return segments.filter((s) => s.trim().length > 0);
  }

  private isMarkdownTableRow(line: string): boolean {
    const t = line.trim();
    return t.length > 0 && t.startsWith('|') && t.endsWith('|');
  }

  private isMarkdownTableSeparator(line: string): boolean {
    const t = line.trim();
    if (t.length === 0) {
      return false;
    }
    return /^\|[\s\-:|]+\|\s*$/.test(t) || /^\|(?:\s*[-:]+\s*\|)+\s*$/.test(t);
  }

  private async packSegmentsIntoChunks(
    segments: string[],
    maxTokens: number,
  ): Promise<string[]> {
    const chunks: string[] = [];
    let current = '';
    for (const seg of segments) {
      const segTrim = seg.trim();
      if (segTrim.length === 0) {
        continue;
      }
      const candidate =
        current.length === 0 ? segTrim : `${current}\n\n${segTrim}`;
      const n = await this.tokenService.countTokens(candidate);
      if (n <= maxTokens) {
        current = candidate;
        continue;
      }
      if (current.length > 0) {
        chunks.push(current);
        current = '';
      }
      const segTokens = await this.tokenService.countTokens(segTrim);
      if (segTokens <= maxTokens) {
        current = segTrim;
      } else {
        chunks.push(...(await this.splitOversizedSegment(segTrim, maxTokens)));
      }
    }
    if (current.trim().length > 0) {
      chunks.push(current);
    }
    return chunks.filter((c) => c.trim().length > 0);
  }

  private async splitOversizedSegment(
    text: string,
    maxTokens: number,
  ): Promise<string[]> {
    const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
    if (paragraphs.length > 1) {
      return this.packSegmentsIntoChunks(paragraphs, maxTokens);
    }
    return this.splitSectionToMaxTokensGreedy(text, maxTokens);
  }

  /**
   * Último recurso: maior prefixo em tokens (pode partir no meio de linha — raro após segmentação).
   */
  private async splitSectionToMaxTokensGreedy(
    section: string,
    maxTokens: number,
  ): Promise<string[]> {
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

  private async mergeSmallChunks(
    chunks: string[],
    minTokens: number,
    maxTokens: number,
  ): Promise<string[]> {
    if (chunks.length <= 1) {
      return chunks.filter((c) => c.trim().length > 0);
    }
    const merged: string[] = [];
    let acc = chunks[0];
    for (let i = 1; i < chunks.length; i++) {
      const next = chunks[i];
      const combined = `${acc}\n\n${next}`;
      const tAcc = await this.tokenService.countTokens(acc);
      const tNext = await this.tokenService.countTokens(next);
      const tCombined = await this.tokenService.countTokens(combined);
      const shouldMerge =
        tCombined <= maxTokens && (tAcc < minTokens || tNext < minTokens);
      if (shouldMerge) {
        acc = combined;
      } else {
        merged.push(acc);
        acc = next;
      }
    }
    merged.push(acc);
    return merged.filter((c) => c.trim().length > 0);
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

  private async trimToMaxTokens(
    text: string,
    maxTokens: number,
  ): Promise<string> {
    if ((await this.tokenService.countTokens(text)) <= maxTokens) {
      return text;
    }
    return this.maxPrefixWithinTokenLimit(text, maxTokens);
  }
}
