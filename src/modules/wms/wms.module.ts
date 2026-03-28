import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CycleCountLineOrmEntity } from './cycle-count-task/persistence/cycle-count-line.orm-entity';
import { CycleCountTaskOrmEntity } from './cycle-count-task/persistence/cycle-count-task.orm-entity';
import { CycleCountTasksController } from './cycle-count-task/http/cycle-count-tasks.controller';
import { CycleCountTasksService } from './cycle-count-task/http/cycle-count-tasks.service';
import { GoodsReceiptLineOrmEntity } from './goods-receipt/persistence/goods-receipt-line.orm-entity';
import { GoodsReceiptOrmEntity } from './goods-receipt/persistence/goods-receipt.orm-entity';
import { GoodsReceiptsController } from './goods-receipt/http/goods-receipts.controller';
import { GoodsReceiptsService } from './goods-receipt/http/goods-receipts.service';
import { HandlingUnitOrmEntity } from './handling-unit/persistence/handling-unit.orm-entity';
import { HandlingUnitsController } from './handling-unit/http/handling-units.controller';
import { HandlingUnitsService } from './handling-unit/http/handling-units.service';
import { InventoryAdjustmentOrmEntity } from './inventory-adjustment/persistence/inventory-adjustment.orm-entity';
import { InventoryAdjustmentsController } from './inventory-adjustment/http/inventory-adjustments.controller';
import { InventoryAdjustmentsService } from './inventory-adjustment/http/inventory-adjustments.service';
import { InventoryBalanceOrmEntity } from './inventory-balance/persistence/inventory-balance.orm-entity';
import { InventoryBalancesController } from './inventory-balance/http/inventory-balances.controller';
import { InventoryBalancesService } from './inventory-balance/http/inventory-balances.service';
import { IntegrationsController } from './integrations/http/integrations.controller';
import { IntegrationsService } from './integrations/http/integrations.service';
import { LocationOrmEntity } from './location/persistence/location.orm-entity';
import { LocationsController } from './location/http/locations.controller';
import { LocationsService } from './location/http/locations.service';
import { PickLineOrmEntity } from './pick-line/persistence/pick-line.orm-entity';
import { PickLinesController } from './pick-line/http/pick-lines.controller';
import { PickLinesService } from './pick-line/http/pick-lines.service';
import { PickOrderOrmEntity } from './pick-order/persistence/pick-order.orm-entity';
import { PickOrdersController } from './pick-order/http/pick-orders.controller';
import { PickOrdersService } from './pick-order/http/pick-orders.service';
import { PickWavePickOrderOrmEntity } from './pick-wave/persistence/pick-wave-order.orm-entity';
import { PickWaveOrmEntity } from './pick-wave/persistence/pick-wave.orm-entity';
import { PickWavesController } from './pick-wave/http/pick-waves.controller';
import { PickWavesService } from './pick-wave/http/pick-waves.service';
import { ProductsModule } from './products/products.module';
import { PutawayController } from './putaway/http/putaway.controller';
import { PutawayService } from './putaway/http/putaway.service';
import { InventoryStockService } from './shared/inventory-stock.service';
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
  InventoryAdjustmentOrmEntity,
  PickOrderOrmEntity,
  PickLineOrmEntity,
  TransferOrderOrmEntity,
  TransferLineOrmEntity,
  GoodsReceiptOrmEntity,
  GoodsReceiptLineOrmEntity,
  CycleCountTaskOrmEntity,
  CycleCountLineOrmEntity,
  PickWaveOrmEntity,
  PickWavePickOrderOrmEntity,
];

const wmsControllers = [
  WmsUsersController,
  WarehousesController,
  ZonesController,
  LocationsController,
  HandlingUnitsController,
  InventoryBalancesController,
  InventoryAdjustmentsController,
  GoodsReceiptsController,
  PutawayController,
  CycleCountTasksController,
  PickWavesController,
  IntegrationsController,
  PickOrdersController,
  PickLinesController,
  TransferOrdersController,
  TransferLinesController,
];

const wmsProviders = [
  InventoryStockService,
  WmsUsersService,
  WarehousesService,
  ZonesService,
  LocationsService,
  HandlingUnitsService,
  InventoryBalancesService,
  InventoryAdjustmentsService,
  GoodsReceiptsService,
  PutawayService,
  CycleCountTasksService,
  PickWavesService,
  IntegrationsService,
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
