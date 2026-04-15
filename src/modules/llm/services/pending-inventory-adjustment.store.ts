import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

export interface PendingInventoryAdjustmentRecord {
  readonly userId: string;
  readonly conversationId: string;
  readonly productId: string;
  readonly locationId: string;
  readonly handlingUnitId: string | null;
  readonly quantityDelta: number;
  readonly reason: string;
  readonly createdAtMs: number;
}

const DEFAULT_TTL_MS = 15 * 60 * 1000;

/**
 * In-memory pending proposals for human-confirmed inventory adjustments (single Nest instance).
 */
@Injectable()
export class PendingInventoryAdjustmentStore {
  private readonly entries = new Map<string, PendingInventoryAdjustmentRecord>();

  private readonly ttlMs = DEFAULT_TTL_MS;

  register(
    data: Omit<PendingInventoryAdjustmentRecord, 'createdAtMs'>,
  ): string {
    const pendingId = randomUUID();
    const record: PendingInventoryAdjustmentRecord = {
      ...data,
      createdAtMs: Date.now(),
    };
    this.entries.set(pendingId, record);
    return pendingId;
  }

  /**
   * Returns the record and removes it if still valid and ownership matches.
   */
  consumeIfValid(
    pendingId: string,
    userId: string,
    conversationId: string,
  ): PendingInventoryAdjustmentRecord | null {
    const trimmed = pendingId.trim();
    const row = this.entries.get(trimmed);
    if (row === undefined) {
      return null;
    }
    if (Date.now() - row.createdAtMs > this.ttlMs) {
      this.entries.delete(trimmed);
      return null;
    }
    if (row.userId !== userId || row.conversationId !== conversationId) {
      return null;
    }
    this.entries.delete(trimmed);
    return row;
  }

  /**
   * Discards a pending proposal without applying (e.g. user declined).
   */
  cancelIfValid(
    pendingId: string,
    userId: string,
    conversationId: string,
  ): boolean {
    const trimmed = pendingId.trim();
    const row = this.entries.get(trimmed);
    if (row === undefined) {
      return false;
    }
    if (Date.now() - row.createdAtMs > this.ttlMs) {
      this.entries.delete(trimmed);
      return false;
    }
    if (row.userId !== userId || row.conversationId !== conversationId) {
      return false;
    }
    this.entries.delete(trimmed);
    return true;
  }
}
