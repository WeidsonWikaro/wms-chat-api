import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HandlingUnitOrmEntity } from './handling-unit/persistence/handling-unit.orm-entity';
import { HandlingUnitsController } from './handling-unit/http/handling-units.controller';
import { HandlingUnitsService } from './handling-unit/http/handling-units.service';
import { InventoryBalanceOrmEntity } from './inventory-balance/persistence/inventory-balance.orm-entity';
import { InventoryBalancesController } from './inventory-balance/http/inventory-balances.controller';
import { InventoryBalancesService } from './inventory-balance/http/inventory-balances.service';
import { LocationOrmEntity } from './location/persistence/location.orm-entity';
import { LocationsController } from './location/http/locations.controller';
import { LocationsService } from './location/http/locations.service';
import { PickLineOrmEntity } from './pick-line/persistence/pick-line.orm-entity';
import { PickLinesController } from './pick-line/http/pick-lines.controller';
import { PickLinesService } from './pick-line/http/pick-lines.service';
import { PickOrderOrmEntity } from './pick-order/persistence/pick-order.orm-entity';
import { PickOrdersController } from './pick-order/http/pick-orders.controller';
import { PickOrdersService } from './pick-order/http/pick-orders.service';
import { ProductsModule } from './products/products.module';
import { TransferLineOrmEntity } from './transfer-line/persistence/transfer-line.orm-entity';
import { TransferLinesController } from './transfer-line/http/transfer-lines.controller';
import { TransferLinesService } from './transfer-line/http/transfer-lines.service';
import { TransferOrderOrmEntity } from './transfer-order/persistence/transfer-order.orm-entity';
import { TransferOrdersController } from './transfer-order/http/transfer-orders.controller';
import { TransferOrdersService } from './transfer-order/http/transfer-orders.service';
import { WarehouseOrmEntity } from './warehouse/persistence/warehouse.orm-entity';
import { WarehousesController } from './warehouse/http/warehouses.controller';
import { WarehousesService } from './warehouse/http/warehouses.service';
import { WmsUserOrmEntity } from './wms-user/persistence/wms-user.orm-entity';
import { WmsUsersController } from './wms-user/http/wms-users.controller';
import { WmsUsersService } from './wms-user/http/wms-users.service';
import { ZoneOrmEntity } from './zone/persistence/zone.orm-entity';
import { ZonesController } from './zone/http/zones.controller';
import { ZonesService } from './zone/http/zones.service';

const wmsEntities = [
  WmsUserOrmEntity,
  WarehouseOrmEntity,
  ZoneOrmEntity,
  LocationOrmEntity,
  HandlingUnitOrmEntity,
  InventoryBalanceOrmEntity,
  PickOrderOrmEntity,
  PickLineOrmEntity,
  TransferOrderOrmEntity,
  TransferLineOrmEntity,
];

const wmsControllers = [
  WmsUsersController,
  WarehousesController,
  ZonesController,
  LocationsController,
  HandlingUnitsController,
  InventoryBalancesController,
  PickOrdersController,
  PickLinesController,
  TransferOrdersController,
  TransferLinesController,
];

const wmsProviders = [
  WmsUsersService,
  WarehousesService,
  ZonesService,
  LocationsService,
  HandlingUnitsService,
  InventoryBalancesService,
  PickOrdersService,
  PickLinesService,
  TransferOrdersService,
  TransferLinesService,
];

@Module({
  imports: [ProductsModule, TypeOrmModule.forFeature(wmsEntities)],
  controllers: wmsControllers,
  providers: wmsProviders,
  exports: [TypeOrmModule, ProductsModule],
})
export class WmsModule {}
