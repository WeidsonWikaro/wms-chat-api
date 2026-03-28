import { BadRequestException, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { InventoryBalanceOrmEntity } from '../inventory-balance/persistence/inventory-balance.orm-entity';

/**
 * Operações de saldo (reserva, baixa, transferência) com regras consistentes.
 */
@Injectable()
export class InventoryStockService {
  constructor() {}

  getAvailable(balance: InventoryBalanceOrmEntity): number {
    return balance.quantityOnHand - balance.quantityReserved;
  }

  async findBalanceForProductLocation(
    manager: EntityManager,
    productId: string,
    locationId: string,
    handlingUnitId: string | null,
    lock: boolean,
  ): Promise<InventoryBalanceOrmEntity | null> {
    const qb = manager
      .getRepository(InventoryBalanceOrmEntity)
      .createQueryBuilder('b');
    qb.where('b.productId = :productId', { productId });
    qb.andWhere('b.locationId = :locationId', { locationId });
    if (handlingUnitId === null) {
      qb.andWhere('b.handlingUnitId IS NULL');
    } else {
      qb.andWhere('b.handlingUnitId = :handlingUnitId', { handlingUnitId });
    }
    if (lock) {
      qb.setLock('pessimistic_write');
    }
    return qb.getOne();
  }

  /**
   * Resolve saldo na origem: HU explícita, ou linha sem HU (null) com desambiguação.
   */
  async resolveBalanceForSource(
    manager: EntityManager,
    productId: string,
    locationId: string,
    explicitHandlingUnitId: string | null | undefined,
    lock: boolean,
  ): Promise<InventoryBalanceOrmEntity> {
    const hu =
      explicitHandlingUnitId === undefined ? null : explicitHandlingUnitId;
    const direct = await this.findBalanceForProductLocation(
      manager,
      productId,
      locationId,
      hu,
      lock,
    );
    if (direct) {
      return direct;
    }
    if (hu !== null) {
      throw new BadRequestException(
        'Saldo não encontrado para a combinação produto / local / HU informada.',
      );
    }
    const qb = manager
      .getRepository(InventoryBalanceOrmEntity)
      .createQueryBuilder('b');
    qb.where('b.productId = :productId', { productId });
    qb.andWhere('b.locationId = :locationId', { locationId });
    if (lock) {
      qb.setLock('pessimistic_write');
    }
    const rows = await qb.getMany();
    if (rows.length === 1) {
      return rows[0];
    }
    if (rows.length === 0) {
      throw new BadRequestException(
        'Não existe saldo para este produto neste local. Cadastre saldo ou informe a HU de origem.',
      );
    }
    throw new BadRequestException(
      'Existem múltiplos saldos para este produto neste local. Informe a HU de origem (picking ou transferência).',
    );
  }

  reserve(balance: InventoryBalanceOrmEntity, quantity: number): void {
    if (quantity <= 0) {
      throw new BadRequestException(
        'Quantidade de reserva deve ser maior que zero.',
      );
    }
    const available = this.getAvailable(balance);
    if (available < quantity) {
      throw new BadRequestException(
        `Saldo insuficiente para reserva. Disponível: ${available}, solicitado: ${quantity}.`,
      );
    }
    balance.quantityReserved += quantity;
  }

  releaseReserved(balance: InventoryBalanceOrmEntity, quantity: number): void {
    if (quantity <= 0) {
      return;
    }
    const release = Math.min(quantity, balance.quantityReserved);
    balance.quantityReserved -= release;
  }

  /**
   * Baixa física e liberação da reserva (pick ou consumo após reserva).
   */
  consumeFromBalance(
    balance: InventoryBalanceOrmEntity,
    quantity: number,
  ): void {
    if (quantity <= 0) {
      throw new BadRequestException(
        'Quantidade de baixa deve ser maior que zero.',
      );
    }
    if (balance.quantityOnHand < quantity) {
      throw new BadRequestException(
        `Saldo físico insuficiente. Em mão: ${balance.quantityOnHand}.`,
      );
    }
    balance.quantityOnHand -= quantity;
    const reservedRelease = Math.min(quantity, balance.quantityReserved);
    balance.quantityReserved -= reservedRelease;
  }

  /**
   * Transferência interna: baixa na origem (inclui reserva associada) e crédito no destino.
   */
  transferOutToDestination(
    from: InventoryBalanceOrmEntity,
    to: InventoryBalanceOrmEntity,
    quantity: number,
  ): void {
    this.consumeFromBalance(from, quantity);
    to.quantityOnHand += quantity;
  }

  async ensureDestinationBalance(
    manager: EntityManager,
    productId: string,
    locationId: string,
    handlingUnitId: string | null,
    lock: boolean,
  ): Promise<InventoryBalanceOrmEntity> {
    const existing = await this.findBalanceForProductLocation(
      manager,
      productId,
      locationId,
      handlingUnitId,
      lock,
    );
    if (existing) {
      return existing;
    }
    const row = manager.getRepository(InventoryBalanceOrmEntity).create({
      productId,
      locationId,
      handlingUnitId,
      quantityOnHand: 0,
      quantityReserved: 0,
    });
    return manager.getRepository(InventoryBalanceOrmEntity).save(row);
  }

  /**
   * Ajuste de inventário: delta positivo cria ou incrementa; negativo decrementa.
   */
  async applyAdjustmentDelta(
    manager: EntityManager,
    productId: string,
    locationId: string,
    handlingUnitId: string | null,
    delta: number,
  ): Promise<InventoryBalanceOrmEntity> {
    if (delta === 0) {
      const row = await this.findBalanceForProductLocation(
        manager,
        productId,
        locationId,
        handlingUnitId,
        true,
      );
      if (!row) {
        throw new BadRequestException(
          'Não existe saldo para aplicar ajuste zero; informe local/HU válidos.',
        );
      }
      return row;
    }
    if (delta > 0) {
      let row = await this.findBalanceForProductLocation(
        manager,
        productId,
        locationId,
        handlingUnitId,
        true,
      );
      if (!row) {
        row = manager.getRepository(InventoryBalanceOrmEntity).create({
          productId,
          locationId,
          handlingUnitId,
          quantityOnHand: delta,
          quantityReserved: 0,
        });
      } else {
        row.quantityOnHand += delta;
      }
      return manager.getRepository(InventoryBalanceOrmEntity).save(row);
    }
    const qty = -delta;
    const row = await this.findBalanceForProductLocation(
      manager,
      productId,
      locationId,
      handlingUnitId,
      true,
    );
    if (!row) {
      throw new BadRequestException(
        'Não existe saldo para reduzir nesta combinação produto / local / HU.',
      );
    }
    if (row.quantityOnHand < qty) {
      throw new BadRequestException(
        `Saldo não pode ficar negativo. Em mão: ${row.quantityOnHand}, ajuste solicitado: ${-delta}.`,
      );
    }
    row.quantityOnHand -= qty;
    return manager.getRepository(InventoryBalanceOrmEntity).save(row);
  }
}
