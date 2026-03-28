import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsController } from './http/products.controller';
import { ProductsService } from './http/products.service';
import { ProductOrmEntity } from './persistence/product.orm-entity';
import { TypeormProductsRepository } from './persistence/typeorm-products.repository';
import { PRODUCTS_REPOSITORY } from './products.tokens';

@Module({
  imports: [TypeOrmModule.forFeature([ProductOrmEntity])],
  controllers: [ProductsController],
  providers: [
    ProductsService,
    {
      provide: PRODUCTS_REPOSITORY,
      useClass: TypeormProductsRepository,
    },
  ],
  exports: [ProductsService, TypeOrmModule],
})
export class ProductsModule {}
