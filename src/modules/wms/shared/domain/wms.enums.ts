/**
 * WMS enumerations (persisted as varchar in PostgreSQL).
 */
export enum HandlingUnitType {
  PALLET = 'PALLET',
  CASE = 'CASE',
  TOTE = 'TOTE',
}

export enum HandlingUnitStatus {
  EMPTY = 'EMPTY',
  IN_USE = 'IN_USE',
  BLOCKED = 'BLOCKED',
}

export enum ZoneType {
  STORAGE = 'STORAGE',
  PICKING = 'PICKING',
  RECEIVING = 'RECEIVING',
  SHIPPING = 'SHIPPING',
  STAGING = 'STAGING',
}

export enum PickOrderStatus {
  DRAFT = 'DRAFT',
  RELEASED = 'RELEASED',
  PICKING = 'PICKING',
  PICKED = 'PICKED',
  CANCELLED = 'CANCELLED',
}

export enum PickLineStatus {
  OPEN = 'OPEN',
  PARTIAL = 'PARTIAL',
  DONE = 'DONE',
}

export enum TransferOrderStatus {
  DRAFT = 'DRAFT',
  RELEASED = 'RELEASED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum TransferLineStatus {
  OPEN = 'OPEN',
  DONE = 'DONE',
}

export enum GoodsReceiptStatus {
  DRAFT = 'DRAFT',
  POSTED = 'POSTED',
  CANCELLED = 'CANCELLED',
}

export enum CycleCountTaskStatus {
  OPEN = 'OPEN',
  COUNTING = 'COUNTING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum PickWaveStatus {
  DRAFT = 'DRAFT',
  RELEASED = 'RELEASED',
}
