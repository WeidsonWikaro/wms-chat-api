import { Module } from '@nestjs/common';
import { ProductsModule } from '../modules/wms/products/products.module';
import { WmsModule } from '../modules/wms/wms.module';
import { DatabaseSeedService } from './database-seed.service';

@Module({
  imports: [WmsModule, ProductsModule],
  providers: [DatabaseSeedService],
  exports: [DatabaseSeedService],
})
export class DatabaseSeedModule {}
