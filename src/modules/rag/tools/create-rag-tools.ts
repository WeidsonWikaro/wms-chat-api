import { tool } from '@langchain/core/tools';
import type { StructuredToolInterface } from '@langchain/core/tools';
import { z } from 'zod';
import type { RagSearchService } from '../services/rag-search.service';

/**
 * Ferramenta LangChain: busca semântica na documentação WMS indexada (pgvector).
 */
export function createRagTools(
  ragSearchService: RagSearchService,
): StructuredToolInterface[] {
  const searchWarehouseDocs = tool(
    async (input: { query: string }) => {
      const trimmed = input.query.trim();
      if (!trimmed) {
        return JSON.stringify({
          error: 'EMPTY_QUERY',
          message: 'Consulta vazia.',
        });
      }
      const snippets = await ragSearchService.search(trimmed);
      return JSON.stringify({
        snippets: snippets.map((s) => ({
          text: s.text,
          source: s.sourcePath,
          chunkIndex: s.chunkIndex,
          distance: s.distance,
        })),
      });
    },
    {
      name: 'search_warehouse_docs',
      description:
        'Busca na documentação interna do WMS (regras de negócio e fluxos em Markdown indexados). Use para perguntas sobre procedimentos, políticas ou como executar fluxos. Não use para dados em tempo real (produtos por id, stock, etc.) — use as ferramentas de entidades. Passe uma consulta curta e objetiva em português.',
      schema: z.object({
        query: z
          .string()
          .describe(
            'Texto de busca semântica (o que procurar na documentação).',
          ),
      }),
    },
  );
  return [searchWarehouseDocs];
}
