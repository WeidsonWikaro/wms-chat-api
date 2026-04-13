import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { DataSource, Repository } from 'typeorm';
import { HandlingUnitOrmEntity } from '../modules/wms/handling-unit/persistence/handling-unit.orm-entity';
import { InventoryBalanceOrmEntity } from '../modules/wms/inventory-balance/persistence/inventory-balance.orm-entity';
import { LocationOrmEntity } from '../modules/wms/location/persistence/location.orm-entity';
import { PickLineOrmEntity } from '../modules/wms/pick-line/persistence/pick-line.orm-entity';
import { PickOrderOrmEntity } from '../modules/wms/pick-order/persistence/pick-order.orm-entity';
import { ProductOrmEntity } from '../modules/wms/products/persistence/product.orm-entity';
import {
  HandlingUnitStatus,
  HandlingUnitType,
  PickLineStatus,
  PickOrderStatus,
  TransferLineStatus,
  TransferOrderStatus,
  ZoneType,
} from '../modules/wms/shared/domain/wms.enums';
import { WmsUserRole } from '../modules/wms/shared/domain/wms-user-role.enum';
import { TransferLineOrmEntity } from '../modules/wms/transfer-line/persistence/transfer-line.orm-entity';
import { TransferOrderOrmEntity } from '../modules/wms/transfer-order/persistence/transfer-order.orm-entity';
import { WarehouseOrmEntity } from '../modules/wms/warehouse/persistence/warehouse.orm-entity';
import { WmsUserOrmEntity } from '../modules/wms/wms-user/persistence/wms-user.orm-entity';
import { ZoneOrmEntity } from '../modules/wms/zone/persistence/zone.orm-entity';

/** Multiplicador de linhas em relação ao seed base (produtos, documentos, etc.). */
const SEED_ROW_MULTIPLIER = 200;

const SEED_LOCATION_COUNT = 400;
const SEED_USER_COUNT = 200;

const WAREHOUSE_SEED = [
  {
    id: 'b1000000-0000-4000-8000-000000000001',
    code: 'WH01',
    name: 'CD Central — São Paulo',
    active: true,
  },
  {
    id: 'b1000000-0000-4000-8000-000000000002',
    code: 'WH02',
    name: 'CD Sul — Curitiba',
    active: true,
  },
  {
    id: 'b1000000-0000-4000-8000-000000000003',
    code: 'WH03',
    name: 'CD Nordeste — Recife',
    active: true,
  },
  {
    id: 'b1000000-0000-4000-8000-000000000004',
    code: 'WH04',
    name: 'Cross-docking — Belo Horizonte',
    active: true,
  },
] as const;

const ZONE_TEMPLATES: ReadonlyArray<{
  warehouseIndex: number;
  code: string;
  name: string;
  zoneType: ZoneType;
}> = [
  {
    warehouseIndex: 0,
    code: 'STOR-A',
    name: 'Armazenagem bloco A',
    zoneType: ZoneType.STORAGE,
  },
  {
    warehouseIndex: 0,
    code: 'PICK-F',
    name: 'Separação frente de loja',
    zoneType: ZoneType.PICKING,
  },
  {
    warehouseIndex: 0,
    code: 'SHIP-1',
    name: 'Doca de expedição 1',
    zoneType: ZoneType.SHIPPING,
  },
  {
    warehouseIndex: 0,
    code: 'RCV-01',
    name: 'Recebimento principal',
    zoneType: ZoneType.RECEIVING,
  },
  {
    warehouseIndex: 0,
    code: 'STG-01',
    name: 'Área de consolidação',
    zoneType: ZoneType.STAGING,
  },
  {
    warehouseIndex: 0,
    code: 'STOR-B',
    name: 'Armazenagem bloco B',
    zoneType: ZoneType.STORAGE,
  },
  {
    warehouseIndex: 1,
    code: 'STOR-S',
    name: 'Armazenagem Sul',
    zoneType: ZoneType.STORAGE,
  },
  {
    warehouseIndex: 1,
    code: 'RCV-S',
    name: 'Recebimento Sul',
    zoneType: ZoneType.RECEIVING,
  },
  {
    warehouseIndex: 1,
    code: 'SHIP-S',
    name: 'Expedição Sul',
    zoneType: ZoneType.SHIPPING,
  },
  {
    warehouseIndex: 1,
    code: 'PICK-S',
    name: 'Separação Sul',
    zoneType: ZoneType.PICKING,
  },
  {
    warehouseIndex: 2,
    code: 'STOR-N',
    name: 'Armazenagem Nordeste',
    zoneType: ZoneType.STORAGE,
  },
  {
    warehouseIndex: 3,
    code: 'PICK-M',
    name: 'Separação expressa BH',
    zoneType: ZoneType.PICKING,
  },
];

const LOCATION_TEMPLATES: ReadonlyArray<{
  zoneTemplateIndex: number;
  code: string;
  aisle: string | null;
  bay: string | null;
  level: string | null;
}> = [
  { zoneTemplateIndex: 0, code: 'A-01-01', aisle: 'A', bay: '01', level: '01' },
  { zoneTemplateIndex: 0, code: 'A-01-02', aisle: 'A', bay: '01', level: '02' },
  { zoneTemplateIndex: 1, code: 'PF-01', aisle: 'PF', bay: '01', level: '1' },
  { zoneTemplateIndex: 1, code: 'PF-02', aisle: 'PF', bay: '02', level: '1' },
  { zoneTemplateIndex: 2, code: 'DOCK-01', aisle: 'D', bay: '01', level: null },
  { zoneTemplateIndex: 6, code: 'S-01-01', aisle: 'S', bay: '01', level: '01' },
  { zoneTemplateIndex: 4, code: 'RCV-D1', aisle: 'R', bay: '01', level: null },
  { zoneTemplateIndex: 5, code: 'STG-01', aisle: 'G', bay: '01', level: '1' },
  { zoneTemplateIndex: 5, code: 'B-02-01', aisle: 'B', bay: '02', level: '01' },
  {
    zoneTemplateIndex: 8,
    code: 'DOCK-S1',
    aisle: 'DS',
    bay: '01',
    level: null,
  },
  { zoneTemplateIndex: 9, code: 'PFS-01', aisle: 'PS', bay: '01', level: '1' },
  {
    zoneTemplateIndex: 10,
    code: 'N-01-01',
    aisle: 'N',
    bay: '01',
    level: '01',
  },
  {
    zoneTemplateIndex: 11,
    code: 'M-EXP-01',
    aisle: 'M',
    bay: '01',
    level: '1',
  },
];

const PRODUCT_TEMPLATES: ReadonlyArray<{
  name: string;
  barcode: string;
  description: string;
}> = [
  {
    name: 'Caixa de parafusos M6 zincado',
    barcode: 'SEED-SKU-A',
    description: 'Fixação em massa; paletizado no CD Central.',
  },
  {
    name: 'Fita adesiva transparente 48 mm x 50 m',
    barcode: 'SEED-SKU-B',
    description: 'Embalagem e fechamento de caixas.',
  },
  {
    name: 'Etiquetas térmicas 100 x 150 mm',
    barcode: 'SEED-SKU-C',
    description: 'Bobina para impressora de etiquetas de transporte.',
  },
  {
    name: 'Tubo PVC soldável 50 mm',
    barcode: 'SEED-SKU-D',
    description: 'Produto volumoso; manuseio com empilhadeira.',
  },
  {
    name: 'Luva de proteção nitrílica tamanho G',
    barcode: 'SEED-SKU-E',
    description: 'EPI descartável; lote homologado NR-6.',
  },
  {
    name: 'Caixa de papelão ondulado 40 x 30 x 25 cm',
    barcode: 'SEED-SKU-F',
    description: 'Embalagem secundária para e-commerce.',
  },
  {
    name: 'Spray lubrificante multiuso 300 ml',
    barcode: 'SEED-SKU-G',
    description: 'Manutenção leve; armazenar longe de calor.',
  },
  {
    name: 'Cinta de poliéster para amarração 50 mm',
    barcode: 'SEED-SKU-H',
    description: 'Unitização de paletes na doca.',
  },
];

const USER_FIXED_IDS: ReadonlyArray<string> = [
  'a1000000-0000-4000-8000-000000000001',
  'a1000000-0000-4000-8000-000000000002',
  'a1000000-0000-4000-8000-000000000003',
  'a1000000-0000-4000-8000-000000000004',
  'a1000000-0000-4000-8000-000000000005',
  'a1000000-0000-4000-8000-000000000006',
];

const USER_DISPLAY_BASE: ReadonlyArray<{ code: string; displayName: string }> =
  [
    { code: 'U-ALICE', displayName: 'Alice Silva' },
    { code: 'U-BOB', displayName: 'Bob Santos' },
    { code: 'U-CAROL', displayName: 'Carol Oliveira' },
    { code: 'U-DANIELA', displayName: 'Daniela Lima' },
    { code: 'U-EDUARDO', displayName: 'Eduardo Ferreira' },
    { code: 'U-FERNANDA', displayName: 'Fernanda Costa' },
  ];

const PRODUCT_FIXED_IDS: ReadonlyArray<string> = [
  'e1000000-0000-4000-8000-000000000001',
  'e1000000-0000-4000-8000-000000000002',
  'e1000000-0000-4000-8000-000000000003',
  'e1000000-0000-4000-8000-000000000004',
  'e1000000-0000-4000-8000-000000000005',
  'e1000000-0000-4000-8000-000000000006',
  'e1000000-0000-4000-8000-000000000007',
  'e1000000-0000-4000-8000-000000000008',
];

const FIRST_NAMES = [
  'Alice',
  'Bob',
  'Carol',
  'Daniela',
  'Eduardo',
  'Fernanda',
  'Gustavo',
  'Helena',
  'Igor',
  'Julia',
  'Kevin',
  'Laura',
  'Marcos',
  'Nina',
  'Otávio',
  'Paula',
  'Rafael',
  'Sofia',
  'Tiago',
  'Vitória',
];
const LAST_NAMES = [
  'Silva',
  'Santos',
  'Oliveira',
  'Lima',
  'Ferreira',
  'Costa',
  'Almeida',
  'Ribeiro',
  'Pereira',
  'Rodrigues',
  'Martins',
  'Carvalho',
  'Gomes',
  'Araújo',
  'Rocha',
  'Dias',
  'Monteiro',
  'Teixeira',
  'Nascimento',
  'Barbosa',
];

function displayNameForUserIndex(i: number): string {
  if (i < USER_DISPLAY_BASE.length) {
    return USER_DISPLAY_BASE[i].displayName;
  }
  return `${FIRST_NAMES[i % FIRST_NAMES.length]} ${LAST_NAMES[(Math.floor(i / FIRST_NAMES.length) + i) % LAST_NAMES.length]}`;
}

function codeForUserIndex(i: number): string {
  if (i < USER_DISPLAY_BASE.length) {
    return USER_DISPLAY_BASE[i].code;
  }
  return `U-SEED-${String(i).padStart(5, '0')}`;
}

/** Índice de local ao longo das réplicas (passo = quantidade de templates de local). */
function locationIndexFor(rep: number, templateSlotIndex: number): number {
  return (
    (templateSlotIndex + rep * LOCATION_TEMPLATES.length) % SEED_LOCATION_COUNT
  );
}

@Injectable()
export class DatabaseSeedService {
  private readonly logger = new Logger(DatabaseSeedService.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @InjectRepository(ProductOrmEntity)
    private readonly products: Repository<ProductOrmEntity>,
    @InjectRepository(WmsUserOrmEntity)
    private readonly wmsUsers: Repository<WmsUserOrmEntity>,
    @InjectRepository(WarehouseOrmEntity)
    private readonly warehouses: Repository<WarehouseOrmEntity>,
    @InjectRepository(ZoneOrmEntity)
    private readonly zones: Repository<ZoneOrmEntity>,
    @InjectRepository(LocationOrmEntity)
    private readonly locations: Repository<LocationOrmEntity>,
    @InjectRepository(HandlingUnitOrmEntity)
    private readonly handlingUnits: Repository<HandlingUnitOrmEntity>,
    @InjectRepository(InventoryBalanceOrmEntity)
    private readonly inventoryBalances: Repository<InventoryBalanceOrmEntity>,
    @InjectRepository(PickOrderOrmEntity)
    private readonly pickOrders: Repository<PickOrderOrmEntity>,
    @InjectRepository(PickLineOrmEntity)
    private readonly pickLines: Repository<PickLineOrmEntity>,
    @InjectRepository(TransferOrderOrmEntity)
    private readonly transferOrders: Repository<TransferOrderOrmEntity>,
    @InjectRepository(TransferLineOrmEntity)
    private readonly transferLines: Repository<TransferLineOrmEntity>,
  ) {}

  async run(): Promise<void> {
    this.logger.log('Limpando tabelas WMS + produtos…');
    await this.clearAll();
    this.logger.log('Inserindo dados de seed (volume ampliado)…');
    await this.insertSeed();
    this.logger.log('Seed concluído.');
  }

  private async clearAll(): Promise<void> {
    await this.dataSource.query(`
      TRUNCATE TABLE
        "auth_refresh_tokens",
        "pick_wave_orders",
        "pick_waves",
        "cycle_count_lines",
        "cycle_count_tasks",
        "goods_receipt_lines",
        "goods_receipts",
        "inventory_adjustments",
        "transfer_lines",
        "pick_lines",
        "inventory_balances",
        "transfer_orders",
        "pick_orders",
        "handling_units",
        "locations",
        "zones",
        "products",
        "wms_users",
        "warehouses"
      RESTART IDENTITY CASCADE;
    `);
  }

  private async insertSeed(): Promise<void> {
    const whIds = WAREHOUSE_SEED.map((w) => w.id);
    await this.warehouses.save([...WAREHOUSE_SEED]);

    const userRows: WmsUserOrmEntity[] = [];
    const userIds: string[] = [];
    for (let i = 0; i < SEED_USER_COUNT; i++) {
      const id = i < USER_FIXED_IDS.length ? USER_FIXED_IDS[i] : randomUUID();
      userIds.push(id);
      userRows.push({
        id,
        code: codeForUserIndex(i),
        displayName: displayNameForUserIndex(i),
        passwordHash: null,
        role: WmsUserRole.OPERATOR,
        active: true,
      } as WmsUserOrmEntity);
    }
    await this.chunkSave(this.wmsUsers, userRows);
    await this.applySeedLoginUsers();

    const zoneRows: ZoneOrmEntity[] = [];
    const zoneIds: string[] = [];
    for (let z = 0; z < ZONE_TEMPLATES.length; z++) {
      const tpl = ZONE_TEMPLATES[z];
      const id = randomUUID();
      zoneIds.push(id);
      zoneRows.push({
        id,
        warehouseId: whIds[tpl.warehouseIndex],
        code: tpl.code,
        name: tpl.name,
        zoneType: tpl.zoneType,
      } as ZoneOrmEntity);
    }
    await this.chunkSave(this.zones, zoneRows);

    const locationRows: LocationOrmEntity[] = [];
    const locationIds: string[] = [];
    for (let l = 0; l < LOCATION_TEMPLATES.length; l++) {
      const tpl = LOCATION_TEMPLATES[l];
      const id = randomUUID();
      locationIds.push(id);
      locationRows.push({
        id,
        zoneId: zoneIds[tpl.zoneTemplateIndex],
        code: tpl.code,
        aisle: tpl.aisle,
        bay: tpl.bay,
        level: tpl.level,
        active: true,
      } as LocationOrmEntity);
    }
    for (let l = LOCATION_TEMPLATES.length; l < SEED_LOCATION_COUNT; l++) {
      const zoneIndex = l % ZONE_TEMPLATES.length;
      const id = randomUUID();
      locationIds.push(id);
      locationRows.push({
        id,
        zoneId: zoneIds[zoneIndex],
        code: `G-${String(l + 1).padStart(4, '0')}`,
        aisle: `A${String((l % 24) + 1).padStart(2, '0')}`,
        bay: `B${String((Math.floor(l / 24) % 40) + 1).padStart(2, '0')}`,
        level: String((l % 5) + 1),
        active: true,
      } as LocationOrmEntity);
    }
    await this.chunkSave(this.locations, locationRows);

    const productRows: ProductOrmEntity[] = [];
    const productIds: string[] = [];
    const productCount = PRODUCT_TEMPLATES.length * SEED_ROW_MULTIPLIER;
    for (let p = 0; p < productCount; p++) {
      const tpl = PRODUCT_TEMPLATES[p % PRODUCT_TEMPLATES.length];
      const rep = Math.floor(p / PRODUCT_TEMPLATES.length);
      const id =
        p < PRODUCT_FIXED_IDS.length ? PRODUCT_FIXED_IDS[p] : randomUUID();
      productIds.push(id);
      productRows.push({
        id,
        name: rep === 0 ? tpl.name : `${tpl.name} (lote ${rep})`,
        barcode: rep === 0 ? tpl.barcode : `${tpl.barcode}-R${rep}`,
        description: tpl.description,
      } as ProductOrmEntity);
    }
    await this.chunkSave(this.products, productRows);

    const huTemplates: ReadonlyArray<{
      code: string;
      type: HandlingUnitType;
      status: HandlingUnitStatus;
      locationIndex: number;
    }> = [
      {
        code: 'SSCC-SEED-PALLET-01',
        type: HandlingUnitType.PALLET,
        status: HandlingUnitStatus.IN_USE,
        locationIndex: 0,
      },
      {
        code: 'TOTE-SEED-VAZIO-01',
        type: HandlingUnitType.TOTE,
        status: HandlingUnitStatus.EMPTY,
        locationIndex: 2,
      },
      {
        code: 'CX-SEED-BLOQUEADA-01',
        type: HandlingUnitType.CASE,
        status: HandlingUnitStatus.BLOCKED,
        locationIndex: 1,
      },
      {
        code: 'SSCC-SEED-PALLET-02',
        type: HandlingUnitType.PALLET,
        status: HandlingUnitStatus.IN_USE,
        locationIndex: 8,
      },
      {
        code: 'TOTE-SEED-EM-USO-02',
        type: HandlingUnitType.TOTE,
        status: HandlingUnitStatus.IN_USE,
        locationIndex: 10,
      },
      {
        code: 'CX-SEED-REC-01',
        type: HandlingUnitType.CASE,
        status: HandlingUnitStatus.IN_USE,
        locationIndex: 6,
      },
    ];
    const huRows: HandlingUnitOrmEntity[] = [];
    const huIds: string[] = [];
    const huCount = huTemplates.length * SEED_ROW_MULTIPLIER;
    for (let h = 0; h < huCount; h++) {
      const tpl = huTemplates[h % huTemplates.length];
      const rep = Math.floor(h / huTemplates.length);
      const id = randomUUID();
      huIds.push(id);
      const locIdx = locationIndexFor(rep, tpl.locationIndex);
      huRows.push({
        id,
        code: rep === 0 ? tpl.code : `${tpl.code}-R${rep}`,
        type: tpl.type,
        currentLocationId: locationIds[locIdx],
        status: tpl.status,
      } as HandlingUnitOrmEntity);
    }
    await this.chunkSave(this.handlingUnits, huRows);

    const balanceTemplates: ReadonlyArray<{
      productIndex: number;
      locationIndex: number;
      handlingUnitIndex: number | null;
      quantityOnHand: number;
      quantityReserved: number;
    }> = [
      {
        productIndex: 0,
        locationIndex: 0,
        handlingUnitIndex: 0,
        quantityOnHand: 240,
        quantityReserved: 40,
      },
      {
        productIndex: 1,
        locationIndex: 2,
        handlingUnitIndex: null,
        quantityOnHand: 80,
        quantityReserved: 0,
      },
      {
        productIndex: 2,
        locationIndex: 3,
        handlingUnitIndex: null,
        quantityOnHand: 25,
        quantityReserved: 10,
      },
      {
        productIndex: 3,
        locationIndex: 1,
        handlingUnitIndex: null,
        quantityOnHand: 12,
        quantityReserved: 0,
      },
      {
        productIndex: 1,
        locationIndex: 5,
        handlingUnitIndex: null,
        quantityOnHand: 30,
        quantityReserved: 0,
      },
      {
        productIndex: 4,
        locationIndex: 5,
        handlingUnitIndex: null,
        quantityOnHand: 200,
        quantityReserved: 24,
      },
      {
        productIndex: 4,
        locationIndex: 8,
        handlingUnitIndex: 3,
        quantityOnHand: 500,
        quantityReserved: 50,
      },
      {
        productIndex: 5,
        locationIndex: 7,
        handlingUnitIndex: null,
        quantityOnHand: 120,
        quantityReserved: 0,
      },
      {
        productIndex: 6,
        locationIndex: 6,
        handlingUnitIndex: 5,
        quantityOnHand: 48,
        quantityReserved: 0,
      },
      {
        productIndex: 7,
        locationIndex: 4,
        handlingUnitIndex: null,
        quantityOnHand: 200,
        quantityReserved: 20,
      },
      {
        productIndex: 2,
        locationIndex: 11,
        handlingUnitIndex: null,
        quantityOnHand: 60,
        quantityReserved: 0,
      },
      {
        productIndex: 0,
        locationIndex: 12,
        handlingUnitIndex: null,
        quantityOnHand: 15,
        quantityReserved: 5,
      },
      {
        productIndex: 3,
        locationIndex: 10,
        handlingUnitIndex: 4,
        quantityOnHand: 8,
        quantityReserved: 0,
      },
    ];
    const balRows: InventoryBalanceOrmEntity[] = [];
    const balanceCount = balanceTemplates.length * SEED_ROW_MULTIPLIER;
    for (let b = 0; b < balanceCount; b++) {
      const tpl = balanceTemplates[b % balanceTemplates.length];
      const rep = Math.floor(b / balanceTemplates.length);
      const pid = productIds[tpl.productIndex + rep * PRODUCT_TEMPLATES.length];
      const lid = locationIds[locationIndexFor(rep, tpl.locationIndex)];
      const hid =
        tpl.handlingUnitIndex === null
          ? null
          : huIds[tpl.handlingUnitIndex + rep * huTemplates.length];
      balRows.push({
        productId: pid,
        locationId: lid,
        handlingUnitId: hid,
        quantityOnHand: tpl.quantityOnHand,
        quantityReserved: tpl.quantityReserved,
      } as InventoryBalanceOrmEntity);
    }
    await this.chunkSave(this.inventoryBalances, balRows);

    const now = new Date();
    const pickOrderTemplates: ReadonlyArray<{
      orderNumber: string;
      warehouseIndex: number;
      status: PickOrderStatus;
      priority: number;
      createdByUserIndex: number;
      releasedByUserIndex: number | null;
      completedByUserIndex: number | null;
    }> = [
      {
        orderNumber: 'PO-SEED-RASCUNHO',
        warehouseIndex: 0,
        status: PickOrderStatus.DRAFT,
        priority: 5,
        createdByUserIndex: 0,
        releasedByUserIndex: null,
        completedByUserIndex: null,
      },
      {
        orderNumber: 'PO-SEED-LIBERADO',
        warehouseIndex: 0,
        status: PickOrderStatus.RELEASED,
        priority: 3,
        createdByUserIndex: 0,
        releasedByUserIndex: 0,
        completedByUserIndex: null,
      },
      {
        orderNumber: 'PO-SEED-SEPARANDO',
        warehouseIndex: 0,
        status: PickOrderStatus.PICKING,
        priority: 2,
        createdByUserIndex: 0,
        releasedByUserIndex: 0,
        completedByUserIndex: null,
      },
      {
        orderNumber: 'PO-SEED-CONCLUIDO',
        warehouseIndex: 0,
        status: PickOrderStatus.PICKED,
        priority: 1,
        createdByUserIndex: 0,
        releasedByUserIndex: 0,
        completedByUserIndex: 1,
      },
      {
        orderNumber: 'PO-SEED-CANCELADO',
        warehouseIndex: 0,
        status: PickOrderStatus.CANCELLED,
        priority: 9,
        createdByUserIndex: 0,
        releasedByUserIndex: null,
        completedByUserIndex: null,
      },
      {
        orderNumber: 'PO-SEED-SUL-RASCUNHO',
        warehouseIndex: 1,
        status: PickOrderStatus.DRAFT,
        priority: 6,
        createdByUserIndex: 5,
        releasedByUserIndex: null,
        completedByUserIndex: null,
      },
      {
        orderNumber: 'PO-SEED-SUL-LIBERADO',
        warehouseIndex: 1,
        status: PickOrderStatus.RELEASED,
        priority: 4,
        createdByUserIndex: 5,
        releasedByUserIndex: 5,
        completedByUserIndex: null,
      },
      {
        orderNumber: 'PO-SEED-SUL-SEPARANDO',
        warehouseIndex: 1,
        status: PickOrderStatus.PICKING,
        priority: 3,
        createdByUserIndex: 5,
        releasedByUserIndex: 5,
        completedByUserIndex: null,
      },
      {
        orderNumber: 'PO-SEED-SUL-CONCLUIDO',
        warehouseIndex: 1,
        status: PickOrderStatus.PICKED,
        priority: 2,
        createdByUserIndex: 5,
        releasedByUserIndex: 5,
        completedByUserIndex: 1,
      },
      {
        orderNumber: 'PO-SEED-CANCELADO-2',
        warehouseIndex: 3,
        status: PickOrderStatus.CANCELLED,
        priority: 8,
        createdByUserIndex: 3,
        releasedByUserIndex: null,
        completedByUserIndex: null,
      },
    ];
    const poRows: PickOrderOrmEntity[] = [];
    const pickOrderIds: string[] = [];
    const pickOrderCount = pickOrderTemplates.length * SEED_ROW_MULTIPLIER;
    for (let o = 0; o < pickOrderCount; o++) {
      const tpl = pickOrderTemplates[o % pickOrderTemplates.length];
      const rep = Math.floor(o / pickOrderTemplates.length);
      const id = randomUUID();
      pickOrderIds.push(id);
      poRows.push({
        id,
        orderNumber: rep === 0 ? tpl.orderNumber : `${tpl.orderNumber}-R${rep}`,
        warehouseId: whIds[tpl.warehouseIndex],
        status: tpl.status,
        priority: tpl.priority,
        createdByUserId: userIds[tpl.createdByUserIndex],
        releasedByUserId:
          tpl.releasedByUserIndex === null
            ? null
            : userIds[tpl.releasedByUserIndex],
        releasedAt: tpl.releasedByUserIndex === null ? null : now,
        completedByUserId:
          tpl.completedByUserIndex === null
            ? null
            : userIds[tpl.completedByUserIndex],
        completedAt: tpl.completedByUserIndex === null ? null : now,
      } as PickOrderOrmEntity);
    }
    await this.chunkSave(this.pickOrders, poRows);

    type PickLineTpl = {
      orderOffset: number;
      productIndex: number;
      quantityOrdered: number;
      quantityPicked: number;
      sourceLocationIndex: number | null;
      status: PickLineStatus;
      pickedByUserIndex: number | null;
    };
    const pickLineTemplates: ReadonlyArray<PickLineTpl> = [
      {
        orderOffset: 0,
        productIndex: 0,
        quantityOrdered: 10,
        quantityPicked: 0,
        sourceLocationIndex: 0,
        status: PickLineStatus.OPEN,
        pickedByUserIndex: null,
      },
      {
        orderOffset: 1,
        productIndex: 1,
        quantityOrdered: 15,
        quantityPicked: 0,
        sourceLocationIndex: 2,
        status: PickLineStatus.OPEN,
        pickedByUserIndex: null,
      },
      {
        orderOffset: 1,
        productIndex: 2,
        quantityOrdered: 5,
        quantityPicked: 0,
        sourceLocationIndex: 3,
        status: PickLineStatus.OPEN,
        pickedByUserIndex: null,
      },
      {
        orderOffset: 2,
        productIndex: 1,
        quantityOrdered: 20,
        quantityPicked: 8,
        sourceLocationIndex: 2,
        status: PickLineStatus.PARTIAL,
        pickedByUserIndex: 1,
      },
      {
        orderOffset: 2,
        productIndex: 2,
        quantityOrdered: 10,
        quantityPicked: 0,
        sourceLocationIndex: 3,
        status: PickLineStatus.OPEN,
        pickedByUserIndex: null,
      },
      {
        orderOffset: 3,
        productIndex: 3,
        quantityOrdered: 4,
        quantityPicked: 4,
        sourceLocationIndex: 1,
        status: PickLineStatus.DONE,
        pickedByUserIndex: 1,
      },
      {
        orderOffset: 4,
        productIndex: 0,
        quantityOrdered: 99,
        quantityPicked: 0,
        sourceLocationIndex: null,
        status: PickLineStatus.OPEN,
        pickedByUserIndex: null,
      },
      {
        orderOffset: 5,
        productIndex: 1,
        quantityOrdered: 12,
        quantityPicked: 0,
        sourceLocationIndex: 5,
        status: PickLineStatus.OPEN,
        pickedByUserIndex: null,
      },
      {
        orderOffset: 6,
        productIndex: 3,
        quantityOrdered: 6,
        quantityPicked: 0,
        sourceLocationIndex: 10,
        status: PickLineStatus.OPEN,
        pickedByUserIndex: null,
      },
      {
        orderOffset: 6,
        productIndex: 4,
        quantityOrdered: 24,
        quantityPicked: 0,
        sourceLocationIndex: 5,
        status: PickLineStatus.OPEN,
        pickedByUserIndex: null,
      },
      {
        orderOffset: 7,
        productIndex: 1,
        quantityOrdered: 18,
        quantityPicked: 10,
        sourceLocationIndex: 5,
        status: PickLineStatus.PARTIAL,
        pickedByUserIndex: 1,
      },
      {
        orderOffset: 7,
        productIndex: 7,
        quantityOrdered: 4,
        quantityPicked: 0,
        sourceLocationIndex: 9,
        status: PickLineStatus.OPEN,
        pickedByUserIndex: null,
      },
      {
        orderOffset: 8,
        productIndex: 2,
        quantityOrdered: 8,
        quantityPicked: 8,
        sourceLocationIndex: 10,
        status: PickLineStatus.DONE,
        pickedByUserIndex: 2,
      },
      {
        orderOffset: 9,
        productIndex: 0,
        quantityOrdered: 50,
        quantityPicked: 0,
        sourceLocationIndex: 12,
        status: PickLineStatus.OPEN,
        pickedByUserIndex: null,
      },
    ];
    const plRows: PickLineOrmEntity[] = [];
    for (let rep = 0; rep < SEED_ROW_MULTIPLIER; rep++) {
      const baseOrder = rep * pickOrderTemplates.length;
      const baseProduct = rep * PRODUCT_TEMPLATES.length;
      for (const lt of pickLineTemplates) {
        const oid = pickOrderIds[baseOrder + lt.orderOffset];
        const pid =
          productIds[
            baseProduct + (lt.productIndex % PRODUCT_TEMPLATES.length)
          ];
        const src =
          lt.sourceLocationIndex === null
            ? null
            : locationIds[locationIndexFor(rep, lt.sourceLocationIndex)];
        plRows.push({
          pickOrderId: oid,
          productId: pid,
          quantityOrdered: lt.quantityOrdered,
          quantityPicked: lt.quantityPicked,
          sourceLocationId: src,
          sourceHandlingUnitId: null,
          status: lt.status,
          pickedByUserId:
            lt.pickedByUserIndex === null
              ? null
              : userIds[lt.pickedByUserIndex],
          pickedAt: lt.pickedByUserIndex === null ? null : now,
        } as PickLineOrmEntity);
      }
    }
    await this.chunkSave(this.pickLines, plRows);

    const transferOrderTemplates: ReadonlyArray<{
      referenceCode: string;
      warehouseIndex: number;
      status: TransferOrderStatus;
      createdByUserIndex: number;
      completedByUserIndex: number | null;
    }> = [
      {
        referenceCode: 'TRF-SEED-RASCUNHO',
        warehouseIndex: 0,
        status: TransferOrderStatus.DRAFT,
        createdByUserIndex: 0,
        completedByUserIndex: null,
      },
      {
        referenceCode: 'TRF-SEED-EM-ANDAMENTO',
        warehouseIndex: 0,
        status: TransferOrderStatus.IN_PROGRESS,
        createdByUserIndex: 0,
        completedByUserIndex: null,
      },
      {
        referenceCode: 'TRF-SEED-CONCLUIDO',
        warehouseIndex: 0,
        status: TransferOrderStatus.COMPLETED,
        createdByUserIndex: 0,
        completedByUserIndex: 2,
      },
      {
        referenceCode: 'TRF-SEED-SUL-RASCUNHO',
        warehouseIndex: 1,
        status: TransferOrderStatus.DRAFT,
        createdByUserIndex: 5,
        completedByUserIndex: null,
      },
      {
        referenceCode: 'TRF-SEED-SUL-ANDAMENTO',
        warehouseIndex: 1,
        status: TransferOrderStatus.IN_PROGRESS,
        createdByUserIndex: 3,
        completedByUserIndex: null,
      },
      {
        referenceCode: 'TRF-SEED-SUL-CONCLUIDO',
        warehouseIndex: 1,
        status: TransferOrderStatus.COMPLETED,
        createdByUserIndex: 4,
        completedByUserIndex: 2,
      },
    ];
    const toRows: TransferOrderOrmEntity[] = [];
    const transferOrderIds: string[] = [];
    const transferOrderCount =
      transferOrderTemplates.length * SEED_ROW_MULTIPLIER;
    for (let t = 0; t < transferOrderCount; t++) {
      const tpl = transferOrderTemplates[t % transferOrderTemplates.length];
      const rep = Math.floor(t / transferOrderTemplates.length);
      const id = randomUUID();
      transferOrderIds.push(id);
      toRows.push({
        id,
        referenceCode:
          rep === 0 ? tpl.referenceCode : `${tpl.referenceCode}-R${rep}`,
        warehouseId: whIds[tpl.warehouseIndex],
        status: tpl.status,
        createdByUserId: userIds[tpl.createdByUserIndex],
        releasedByUserId: null,
        releasedAt: null,
        completedByUserId:
          tpl.completedByUserIndex === null
            ? null
            : userIds[tpl.completedByUserIndex],
        completedAt: tpl.completedByUserIndex === null ? null : now,
      } as TransferOrderOrmEntity);
    }
    await this.chunkSave(this.transferOrders, toRows);

    type TLineTpl = {
      orderOffset: number;
      productIndex: number;
      quantity: number;
      fromLocIndex: number;
      toLocIndex: number;
      fromHuIndex: number | null;
      toHuIndex: number | null;
      status: TransferLineStatus;
    };
    const transferLineTemplates: ReadonlyArray<TLineTpl> = [
      {
        orderOffset: 0,
        productIndex: 0,
        quantity: 12,
        fromLocIndex: 0,
        toLocIndex: 2,
        fromHuIndex: 0,
        toHuIndex: null,
        status: TransferLineStatus.OPEN,
      },
      {
        orderOffset: 1,
        productIndex: 1,
        quantity: 6,
        fromLocIndex: 2,
        toLocIndex: 4,
        fromHuIndex: null,
        toHuIndex: 1,
        status: TransferLineStatus.DONE,
      },
      {
        orderOffset: 1,
        productIndex: 2,
        quantity: 3,
        fromLocIndex: 3,
        toLocIndex: 4,
        fromHuIndex: null,
        toHuIndex: null,
        status: TransferLineStatus.OPEN,
      },
      {
        orderOffset: 2,
        productIndex: 3,
        quantity: 2,
        fromLocIndex: 1,
        toLocIndex: 4,
        fromHuIndex: null,
        toHuIndex: null,
        status: TransferLineStatus.DONE,
      },
      {
        orderOffset: 3,
        productIndex: 1,
        quantity: 20,
        fromLocIndex: 5,
        toLocIndex: 10,
        fromHuIndex: null,
        toHuIndex: null,
        status: TransferLineStatus.OPEN,
      },
      {
        orderOffset: 3,
        productIndex: 5,
        quantity: 30,
        fromLocIndex: 7,
        toLocIndex: 5,
        fromHuIndex: null,
        toHuIndex: null,
        status: TransferLineStatus.OPEN,
      },
      {
        orderOffset: 4,
        productIndex: 6,
        quantity: 12,
        fromLocIndex: 6,
        toLocIndex: 9,
        fromHuIndex: 5,
        toHuIndex: null,
        status: TransferLineStatus.DONE,
      },
      {
        orderOffset: 4,
        productIndex: 7,
        quantity: 15,
        fromLocIndex: 4,
        toLocIndex: 7,
        fromHuIndex: null,
        toHuIndex: null,
        status: TransferLineStatus.OPEN,
      },
      {
        orderOffset: 5,
        productIndex: 4,
        quantity: 100,
        fromLocIndex: 8,
        toLocIndex: 5,
        fromHuIndex: 3,
        toHuIndex: null,
        status: TransferLineStatus.DONE,
      },
      {
        orderOffset: 5,
        productIndex: 2,
        quantity: 10,
        fromLocIndex: 11,
        toLocIndex: 12,
        fromHuIndex: null,
        toHuIndex: null,
        status: TransferLineStatus.DONE,
      },
      {
        orderOffset: 2,
        productIndex: 5,
        quantity: 4,
        fromLocIndex: 7,
        toLocIndex: 4,
        fromHuIndex: null,
        toHuIndex: null,
        status: TransferLineStatus.OPEN,
      },
    ];
    const tlRows: TransferLineOrmEntity[] = [];
    for (let rep = 0; rep < SEED_ROW_MULTIPLIER; rep++) {
      const baseOrder = rep * transferOrderTemplates.length;
      const baseProduct = rep * PRODUCT_TEMPLATES.length;
      const baseHu = rep * huTemplates.length;
      for (const lt of transferLineTemplates) {
        const oid = transferOrderIds[baseOrder + lt.orderOffset];
        const pid =
          productIds[
            baseProduct + (lt.productIndex % PRODUCT_TEMPLATES.length)
          ];
        const fromId = locationIds[locationIndexFor(rep, lt.fromLocIndex)];
        const toId = locationIds[locationIndexFor(rep, lt.toLocIndex)];
        const fromHu =
          lt.fromHuIndex === null
            ? null
            : huIds[baseHu + (lt.fromHuIndex % huTemplates.length)];
        const toHu =
          lt.toHuIndex === null
            ? null
            : huIds[baseHu + (lt.toHuIndex % huTemplates.length)];
        tlRows.push({
          transferOrderId: oid,
          productId: pid,
          quantity: lt.quantity,
          fromLocationId: fromId,
          toLocationId: toId,
          fromHandlingUnitId: fromHu,
          toHandlingUnitId: toHu,
          status: lt.status,
        } as TransferLineOrmEntity);
      }
    }
    await this.chunkSave(this.transferLines, tlRows);
  }

  /**
   * Utilizadores com palavra-passe para login em desenvolvimento (ver `.env.example`).
   * Todos partilham a mesma palavra-passe; perfis distintos para testar roles.
   */
  private async applySeedLoginUsers(): Promise<void> {
    const password = 'DevPass#2026';
    const hash = await bcrypt.hash(password, 12);
    const aliceId = USER_FIXED_IDS[0];
    const bobId = USER_FIXED_IDS[1];
    const carolId = USER_FIXED_IDS[2];
    if (aliceId !== undefined) {
      await this.wmsUsers.update(
        { id: aliceId },
        { passwordHash: hash, role: WmsUserRole.ADMIN },
      );
    }
    if (bobId !== undefined) {
      await this.wmsUsers.update(
        { id: bobId },
        { passwordHash: hash, role: WmsUserRole.OPERATOR },
      );
    }
    if (carolId !== undefined) {
      await this.wmsUsers.update(
        { id: carolId },
        { passwordHash: hash, role: WmsUserRole.VIEWER },
      );
    }
  }

  private async chunkSave<T extends object>(
    repo: Repository<T>,
    rows: T[],
    size = 500,
  ): Promise<void> {
    for (let i = 0; i < rows.length; i += size) {
      await repo.save(rows.slice(i, i + size));
    }
  }
}
