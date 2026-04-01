import { NotFoundException } from '@nestjs/common';
import { tool } from '@langchain/core/tools';
import type { StructuredToolInterface } from '@langchain/core/tools';
import { z } from 'zod';
import { isUuidV4 } from '../../chat/chat-validation';
import type { ProductsService } from '../../wms/products/http/products.service';

/**
 * LangChain tools that call WMS {@link ProductsService} (no HTTP hop).
 * Only lookup by UUID or exact barcode — no name search.
 */
export function createProductTools(
  productsService: ProductsService,
): StructuredToolInterface[] {
  const getProductById = tool(
    async (input: { id: string }) => {
      const trimmed = input.id.trim();
      if (!isUuidV4(trimmed)) {
        return JSON.stringify({
          error: 'INVALID_ID',
          message:
            'O id deve ser um UUID v4 válido do produto. Peça o usuário o id correto.',
        });
      }
      try {
        const product = await productsService.findOne(trimmed);
        return JSON.stringify({ product });
      } catch (err) {
        if (err instanceof NotFoundException) {
          return JSON.stringify({
            error: 'NOT_FOUND',
            message: err.message,
          });
        }
        throw err;
      }
    },
    {
      name: 'get_product_by_id',
      description:
        'Busca um produto pelo id (UUID v4). Use quando o usuário informar ou pedir dados pelo id do produto.',
      schema: z.object({
        id: z
          .string()
          .describe('UUID v4 do produto no sistema (formato id, não nome).'),
      }),
    },
  );

  const getProductByBarcode = tool(
    async (input: { barcode: string }) => {
      const trimmed = input.barcode.trim();
      if (!trimmed) {
        return JSON.stringify({
          error: 'INVALID_BARCODE',
          message: 'Código de barras vazio.',
        });
      }
      try {
        const product = await productsService.findByBarcode(trimmed);
        return JSON.stringify({ product });
      } catch (err) {
        if (err instanceof NotFoundException) {
          return JSON.stringify({
            error: 'NOT_FOUND',
            message: err.message,
          });
        }
        throw err;
      }
    },
    {
      name: 'get_product_by_barcode',
      description:
        'Busca um produto pelo código de barras exato. Use quando o usuário passar o barcode ou código de barras.',
      schema: z.object({
        barcode: z
          .string()
          .describe('Código de barras completo, como armazenado no WMS.'),
      }),
    },
  );

  return [getProductById, getProductByBarcode];
}
