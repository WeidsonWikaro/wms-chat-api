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
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum TransferLineStatus {
  OPEN = 'OPEN',
  DONE = 'DONE',
}
