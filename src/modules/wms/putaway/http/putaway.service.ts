import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { InventoryBalanceOrmEntity } from '../../inventory-balance/persistence/inventory-balance.orm-entity';
import { LocationOrmEntity } from '../../location/persistence/location.orm-entity';
import { ZoneType } from '../../shared/domain/wms.enums';
import { ZoneOrmEntity } from '../../zone/persistence/zone.orm-entity';
import {
  PutawaySuggestionResponseDto,
  SuggestPutawayDto,
} from './dto/putaway.dto';

@Injectable()
export class PutawayService {
  constructor(
    @InjectRepository(ZoneOrmEntity)
    private readonly zones: Repository<ZoneOrmEntity>,
    @InjectRepository(LocationOrmEntity)
    private readonly locations: Repository<LocationOrmEntity>,
    @InjectRepository(InventoryBalanceOrmEntity)
    private readonly balances: Repository<InventoryBalanceOrmEntity>,
  ) {}

  async suggest(dto: SuggestPutawayDto): Promise<PutawaySuggestionResponseDto> {
    const storageZones = await this.zones.find({
      where: { warehouseId: dto.warehouseId, zoneType: ZoneType.STORAGE },
    });
    if (storageZones.length === 0) {
      throw new BadRequestException(
        'Nenhuma zona de armazenagem encontrada para este armazém.',
      );
    }
    const zoneIds = storageZones.map((z) => z.id);
    const locs = await this.locations.find({
      where: { zoneId: In(zoneIds), active: true },
    });
    if (locs.length === 0) {
      throw new BadRequestException(
        'Nenhuma localização ativa em zonas de armazenagem.',
      );
    }
    const sums = new Map<string, number>();
    for (const loc of locs) {
      sums.set(loc.id, 0);
    }
    const balRows = await this.balances.find({
      where: { productId: dto.productId },
    });
    for (const b of balRows) {
      if (!sums.has(b.locationId)) {
        continue;
      }
      sums.set(b.locationId, (sums.get(b.locationId) ?? 0) + b.quantityOnHand);
    }
    let bestId = locs[0].id;
    let bestTotal = sums.get(bestId) ?? 0;
    for (const loc of locs) {
      const t = sums.get(loc.id) ?? 0;
      if (t < bestTotal) {
        bestTotal = t;
        bestId = loc.id;
      }
    }
    return {
      suggestedLocationId: bestId,
      reason:
        'Heurística: zona STORAGE com menor quantidade em mão do SKU (consolidação).',
    };
  }
}
