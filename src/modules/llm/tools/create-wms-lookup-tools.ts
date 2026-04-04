import { NotFoundException } from '@nestjs/common';
import { tool } from '@langchain/core/tools';
import type { StructuredToolInterface } from '@langchain/core/tools';
import { z } from 'zod';
import { isUuidV4 } from '../../chat/chat-validation';
import type { HandlingUnitsService } from '../../wms/handling-unit/http/handling-units.service';
import type { LocationsService } from '../../wms/location/http/locations.service';
import type { WarehousesService } from '../../wms/warehouse/http/warehouses.service';
import type { WmsUsersService } from '../../wms/wms-user/http/wms-users.service';
import type { ZonesService } from '../../wms/zone/http/zones.service';

export interface WmsLookupToolsDeps {
  readonly wmsUsersService: WmsUsersService;
  readonly warehousesService: WarehousesService;
  readonly zonesService: ZonesService;
  readonly locationsService: LocationsService;
  readonly handlingUnitsService: HandlingUnitsService;
}

function invalidUuidPayload(entityLabel: string): string {
  return JSON.stringify({
    error: 'INVALID_ID',
    message: `O id deve ser um UUID v4 válido (${entityLabel}). Peça o id correto ao usuário.`,
  });
}

/**
 * LangChain tools for read-only WMS lookups (users, warehouses, zones, locations, handling units).
 */
export function createWmsLookupTools(
  deps: WmsLookupToolsDeps,
): StructuredToolInterface[] {
  const getWmsUserById = tool(
    async (input: { id: string }) => {
      const trimmed = input.id.trim();
      if (!isUuidV4(trimmed)) {
        return invalidUuidPayload('utilizador WMS');
      }
      try {
        const user = await deps.wmsUsersService.findOne(trimmed);
        return JSON.stringify({ user });
      } catch (err) {
        if (err instanceof NotFoundException) {
          return JSON.stringify({ error: 'NOT_FOUND', message: err.message });
        }
        throw err;
      }
    },
    {
      name: 'get_wms_user_by_id',
      description:
        'Busca um utilizador WMS pelo id (UUID v4). Apenas consulta por id; não há listagem de utilizadores.',
      schema: z.object({
        id: z.string().describe('UUID v4 do utilizador WMS.'),
      }),
    },
  );

  const listWarehouses = tool(
    async () => {
      const warehouses = await deps.warehousesService.findAll();
      return JSON.stringify({ warehouses });
    },
    {
      name: 'list_warehouses',
      description:
        'Lista todos os armazéns (warehouses) do WMS, ordenados por código.',
      schema: z.object({}),
    },
  );

  const getWarehouseById = tool(
    async (input: { id: string }) => {
      const trimmed = input.id.trim();
      if (!isUuidV4(trimmed)) {
        return invalidUuidPayload('armazém');
      }
      try {
        const warehouse = await deps.warehousesService.findOne(trimmed);
        return JSON.stringify({ warehouse });
      } catch (err) {
        if (err instanceof NotFoundException) {
          return JSON.stringify({ error: 'NOT_FOUND', message: err.message });
        }
        throw err;
      }
    },
    {
      name: 'get_warehouse_by_id',
      description:
        'Busca um armazém pelo id (UUID v4). Use quando o usuário informar o id do warehouse.',
      schema: z.object({
        id: z.string().describe('UUID v4 do armazém.'),
      }),
    },
  );

  const listZones = tool(
    async (input: { warehouseId?: string }) => {
      const wid = input.warehouseId?.trim();
      if (wid !== undefined && wid.length > 0 && !isUuidV4(wid)) {
        return invalidUuidPayload('armazém (filtro warehouseId)');
      }
      const zones = await deps.zonesService.findAll(
        wid && wid.length > 0 ? wid : undefined,
      );
      return JSON.stringify({ zones });
    },
    {
      name: 'list_zones',
      description:
        'Lista zonas do WMS. Sem warehouseId, lista todas as zonas; com warehouseId (UUID), filtra zonas desse armazém.',
      schema: z.object({
        warehouseId: z
          .string()
          .optional()
          .describe(
            'Opcional: UUID v4 do armazém para filtrar zonas; omita para listar todas.',
          ),
      }),
    },
  );

  const getZoneById = tool(
    async (input: { id: string }) => {
      const trimmed = input.id.trim();
      if (!isUuidV4(trimmed)) {
        return invalidUuidPayload('zona');
      }
      try {
        const zone = await deps.zonesService.findOne(trimmed);
        return JSON.stringify({ zone });
      } catch (err) {
        if (err instanceof NotFoundException) {
          return JSON.stringify({ error: 'NOT_FOUND', message: err.message });
        }
        throw err;
      }
    },
    {
      name: 'get_zone_by_id',
      description:
        'Busca uma zona pelo id (UUID v4). Use quando o usuário informar o id da zona.',
      schema: z.object({
        id: z.string().describe('UUID v4 da zona.'),
      }),
    },
  );

  const listLocationsByZoneId = tool(
    async (input: { zoneId: string }) => {
      const trimmed = input.zoneId.trim();
      if (!isUuidV4(trimmed)) {
        return invalidUuidPayload('zona');
      }
      const locations = await deps.locationsService.findAll(trimmed);
      return JSON.stringify({ locations });
    },
    {
      name: 'list_locations_by_zone_id',
      description:
        'Lista todas as localizações (locations) de uma zona, pelo id da zona (UUID v4).',
      schema: z.object({
        zoneId: z.string().describe('UUID v4 da zona.'),
      }),
    },
  );

  const getLocationById = tool(
    async (input: { id: string }) => {
      const trimmed = input.id.trim();
      if (!isUuidV4(trimmed)) {
        return invalidUuidPayload('localização');
      }
      try {
        const location = await deps.locationsService.findOne(trimmed);
        return JSON.stringify({ location });
      } catch (err) {
        if (err instanceof NotFoundException) {
          return JSON.stringify({ error: 'NOT_FOUND', message: err.message });
        }
        throw err;
      }
    },
    {
      name: 'get_location_by_id',
      description:
        'Busca uma localização pelo id (UUID v4). Use quando o usuário informar o id da location.',
      schema: z.object({
        id: z.string().describe('UUID v4 da localização.'),
      }),
    },
  );

  const getLocationInZone = tool(
    async (input: { zoneId: string; locationId: string }) => {
      const zid = input.zoneId.trim();
      const lid = input.locationId.trim();
      if (!isUuidV4(zid)) {
        return invalidUuidPayload('zona');
      }
      if (!isUuidV4(lid)) {
        return invalidUuidPayload('localização');
      }
      try {
        const location = await deps.locationsService.findOne(lid);
        if (location.zoneId !== zid) {
          return JSON.stringify({
            error: 'ZONE_MISMATCH',
            message:
              'A localização existe mas não pertence à zona indicada. Confira os ids.',
          });
        }
        return JSON.stringify({ location });
      } catch (err) {
        if (err instanceof NotFoundException) {
          return JSON.stringify({ error: 'NOT_FOUND', message: err.message });
        }
        throw err;
      }
    },
    {
      name: 'get_location_in_zone',
      description:
        'Busca uma localização pelo id e confirma que pertence à zona indicada (ambos UUID v4). Use quando o usuário der id da zona e id da localização.',
      schema: z.object({
        zoneId: z.string().describe('UUID v4 da zona esperada.'),
        locationId: z.string().describe('UUID v4 da localização.'),
      }),
    },
  );

  const getHandlingUnitById = tool(
    async (input: { id: string }) => {
      const trimmed = input.id.trim();
      if (!isUuidV4(trimmed)) {
        return invalidUuidPayload('unidade de manuseio');
      }
      try {
        const handlingUnit = await deps.handlingUnitsService.findOne(trimmed);
        return JSON.stringify({ handlingUnit });
      } catch (err) {
        if (err instanceof NotFoundException) {
          return JSON.stringify({ error: 'NOT_FOUND', message: err.message });
        }
        throw err;
      }
    },
    {
      name: 'get_handling_unit_by_id',
      description:
        'Busca uma unidade de manuseio (handling unit) pelo id (UUID v4).',
      schema: z.object({
        id: z.string().describe('UUID v4 da unidade de manuseio.'),
      }),
    },
  );

  return [
    getWmsUserById,
    listWarehouses,
    getWarehouseById,
    listZones,
    getZoneById,
    listLocationsByZoneId,
    getLocationById,
    getLocationInZone,
    getHandlingUnitById,
  ];
}
