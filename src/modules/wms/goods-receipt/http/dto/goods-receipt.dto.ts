import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateGoodsReceiptDto {
  @ApiProperty({ example: 'GR-2026-0001' })
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  referenceCode!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  warehouseId!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Local de recebimento (doca / área)',
  })
  @IsUUID('4')
  receivingLocationId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  createdByUserId!: string;
}

export class CreateGoodsReceiptLineDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  productId!: string;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  @Max(2_000_000_000)
  quantity!: number;
}

export class PostGoodsReceiptDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  postedByUserId!: string;
}

export class GoodsReceiptResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  referenceCode!: string;

  @ApiProperty()
  warehouseId!: string;

  @ApiProperty()
  receivingLocationId!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  createdByUserId!: string;

  @ApiProperty({ nullable: true })
  postedByUserId!: string | null;

  @ApiProperty({ nullable: true })
  postedAt!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class GoodsReceiptLineResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  goodsReceiptId!: string;

  @ApiProperty()
  productId!: string;

  @ApiProperty()
  quantity!: number;

  @ApiProperty()
  createdAt!: string;
}
