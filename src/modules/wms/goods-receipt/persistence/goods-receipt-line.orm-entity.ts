import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ProductOrmEntity } from '../../products/persistence/product.orm-entity';
import { GoodsReceiptOrmEntity } from './goods-receipt.orm-entity';

@Entity({ name: 'goods_receipt_lines' })
export class GoodsReceiptLineOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  goodsReceiptId!: string;

  @ManyToOne(() => GoodsReceiptOrmEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'goodsReceiptId' })
  goodsReceipt!: GoodsReceiptOrmEntity;

  @Column({ type: 'uuid' })
  productId!: string;

  @ManyToOne(() => ProductOrmEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'productId' })
  product!: ProductOrmEntity;

  @Column({ type: 'int' })
  quantity!: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
