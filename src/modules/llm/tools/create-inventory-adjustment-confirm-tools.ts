import { tool } from '@langchain/core/tools';
import type { StructuredToolInterface } from '@langchain/core/tools';
import { z } from 'zod';
import { isUuidV4 } from '../../chat/chat-validation';
import { getChatToolRuntimeContext } from '../chat-tool-runtime.storage';
import type { PendingInventoryAdjustmentStore } from '../services/pending-inventory-adjustment.store';
import type { InventoryAdjustmentsService } from '../../wms/inventory-adjustment/http/inventory-adjustments.service';

const QUANTITY_MIN = -2_000_000_000;
const QUANTITY_MAX = 2_000_000_000;
const REASON_MAX = 500;

export interface InventoryAdjustmentConfirmToolsDeps {
  readonly adjustmentsService: InventoryAdjustmentsService;
  readonly pendingStore: PendingInventoryAdjustmentStore;
}

/**
 * Two-step inventory adjustment: propose (holds draft) then confirm after explicit user approval in chat.
 */
export function createInventoryAdjustmentConfirmTools(
  deps: InventoryAdjustmentConfirmToolsDeps,
): StructuredToolInterface[] {
  const proposeInventoryAdjustment = tool(
    async (input: {
      productId: string;
      locationId: string;
      handlingUnitId?: string | null;
      quantityDelta: number;
      reason: string;
    }) => {
      const runtime = getChatToolRuntimeContext();
      if (runtime === undefined) {
        return JSON.stringify({
          error: 'NO_RUNTIME_CONTEXT',
          message:
            'Contexto do chat indisponível; não é possível propor ajuste neste turno.',
        });
      }
      const productId = input.productId.trim();
      const locationId = input.locationId.trim();
      if (!isUuidV4(productId) || !isUuidV4(locationId)) {
        return JSON.stringify({
          error: 'INVALID_ID',
          message:
            'productId e locationId devem ser UUID v4. Use as ferramentas de consulta para obter ids válidos.',
        });
      }
      let handlingUnitId: string | null = null;
      if (
        input.handlingUnitId !== undefined &&
        input.handlingUnitId !== null &&
        String(input.handlingUnitId).trim().length > 0
      ) {
        const hu = String(input.handlingUnitId).trim();
        if (!isUuidV4(hu)) {
          return JSON.stringify({
            error: 'INVALID_ID',
            message: 'handlingUnitId deve ser UUID v4 ou omitido.',
          });
        }
        handlingUnitId = hu;
      }
      const q = input.quantityDelta;
      if (!Number.isInteger(q) || q < QUANTITY_MIN || q > QUANTITY_MAX) {
        return JSON.stringify({
          error: 'INVALID_QUANTITY',
          message: `quantityDelta deve ser inteiro entre ${QUANTITY_MIN} e ${QUANTITY_MAX}.`,
        });
      }
      if (q === 0) {
        return JSON.stringify({
          error: 'INVALID_QUANTITY',
          message: 'quantityDelta não pode ser zero.',
        });
      }
      const reason = input.reason.trim();
      if (reason.length === 0 || reason.length > REASON_MAX) {
        return JSON.stringify({
          error: 'INVALID_REASON',
          message: `Motivo obrigatório, até ${REASON_MAX} caracteres.`,
        });
      }
      const pendingId = deps.pendingStore.register({
        userId: runtime.userId,
        conversationId: runtime.conversationId,
        productId,
        locationId,
        handlingUnitId,
        quantityDelta: q,
        reason,
      });
      return JSON.stringify({
        status: 'AWAITING_USER_CONFIRMATION',
        pendingId,
        summary: {
          productId,
          locationId,
          handlingUnitId,
          quantityDelta: q,
          reason,
        },
        nextStep:
          'Explique ao usuário o resumo acima e peça confirmação explícita (por exemplo "sim, confirmo"). ' +
          'Só depois use confirm_inventory_adjustment com o mesmo pendingId e userApproved=true. ' +
          'Se o usuário recusar, chame confirm_inventory_adjustment com userApproved=false.',
      });
    },
    {
      name: 'propose_inventory_adjustment',
      description:
        'Primeiro passo para registrar um ajuste de inventário com impacto no saldo: cria uma proposta e devolve um pendingId. ' +
        'Não altera o estoque até o usuário confirmar no chat no turno seguinte (ou posterior, dentro do prazo). ' +
        'Use após ter productId e locationId corretos (UUID). O delta positivo entra estoque, negativo sai.',
      schema: z.object({
        productId: z.string().describe('UUID v4 do produto.'),
        locationId: z.string().describe('UUID v4 da localização.'),
        handlingUnitId: z
          .union([z.string(), z.null()])
          .optional()
          .describe('UUID v4 da HU, ou omita se não aplicável.'),
        quantityDelta: z
          .number()
          .int()
          .describe('Quantidade a ajustar (positivo ou negativo, não zero).'),
        reason: z.string().describe('Motivo operacional do ajuste.'),
      }),
    },
  );

  const confirmInventoryAdjustment = tool(
    async (input: { pendingId: string; userApproved: boolean }) => {
      const runtime = getChatToolRuntimeContext();
      if (runtime === undefined) {
        return JSON.stringify({
          error: 'NO_RUNTIME_CONTEXT',
          message:
            'Contexto do chat indisponível; não é possível confirmar neste turno.',
        });
      }
      const pendingId = input.pendingId.trim();
      if (pendingId.length === 0) {
        return JSON.stringify({
          error: 'INVALID_PENDING_ID',
          message: 'pendingId é obrigatório (copie o valor devolvido por propose_inventory_adjustment).',
        });
      }
      if (runtime.approvalSignal === 'none') {
        return JSON.stringify({
          error: 'EXPLICIT_CONFIRMATION_REQUIRED',
          message:
            'Este turno não trouxe confirmação explícita do usuário. Peça "sim, confirmo" para aplicar ou "não, cancelar" para descartar.',
        });
      }
      if (
        (runtime.approvalSignal === 'approve' && !input.userApproved) ||
        (runtime.approvalSignal === 'reject' && input.userApproved)
      ) {
        return JSON.stringify({
          error: 'APPROVAL_SIGNAL_MISMATCH',
          message:
            'O userApproved informado não corresponde ao sinal explícito do usuário neste turno.',
        });
      }
      if (!input.userApproved) {
        const cancelled = deps.pendingStore.cancelIfValid(
          pendingId,
          runtime.userId,
          runtime.conversationId,
        );
        if (!cancelled) {
          return JSON.stringify({
            status: 'NOT_CANCELLED',
            message:
              'Não havia proposta pendente válida para este id, conversa ou prazo expirado.',
          });
        }
        return JSON.stringify({
          status: 'CANCELLED',
          message: 'Proposta descartada; nenhum ajuste foi aplicado.',
        });
      }
      const record = deps.pendingStore.consumeIfValid(
        pendingId,
        runtime.userId,
        runtime.conversationId,
      );
      if (record === null) {
        return JSON.stringify({
          error: 'INVALID_OR_EXPIRED_PENDING',
          message:
            'Proposta inválida, expirada (~15 min), ou já utilizada. Peça uma nova proposta com propose_inventory_adjustment.',
        });
      }
      try {
        const created = await deps.adjustmentsService.create({
          productId: record.productId,
          locationId: record.locationId,
          handlingUnitId: record.handlingUnitId,
          quantityDelta: record.quantityDelta,
          reason: record.reason,
          createdByUserId: runtime.userId,
        });
        return JSON.stringify({
          status: 'APPLIED',
          adjustment: created,
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Falha ao aplicar ajuste.';
        return JSON.stringify({
          error: 'APPLY_FAILED',
          message,
        });
      }
    },
    {
      name: 'confirm_inventory_adjustment',
      description:
        'Segundo passo: aplica ou descarta uma proposta criada por propose_inventory_adjustment. ' +
        'Só use userApproved=true depois de o usuário confirmar explicitamente no chat. ' +
        'Use userApproved=false se o usuário recusar.',
      schema: z.object({
        pendingId: z
          .string()
          .describe('Identificador devolvido por propose_inventory_adjustment.'),
        userApproved: z
          .boolean()
          .describe('true se o usuário confirmou explicitamente; false para cancelar.'),
      }),
    },
  );

  return [proposeInventoryAdjustment, confirmInventoryAdjustment];
}
