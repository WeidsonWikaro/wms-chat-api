import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class CreateInventoryBalanceDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  productId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  locationId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID('4')
  handlingUnitId?: string | null;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(2_000_000_000)
  quantityOnHand?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(2_000_000_000)
  quantityReserved?: number;
}

export class UpdateInventoryBalanceDto {
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID('4')
  handlingUnitId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(2_000_000_000)
  quantityOnHand?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(2_000_000_000)
  quantityReserved?: number;
}

export class InventoryBalanceResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  productId!: string;

  @ApiProperty()
  locationId!: string;

  @ApiProperty({ nullable: true })
  handlingUnitId!: string | null;

  @ApiProperty()
  quantityOnHand!: number;

  @ApiProperty()
  quantityReserved!: number;

  @ApiProperty({
    description: 'Disponível para novas reservas: on_hand - reserved',
  })
  quantityAvailable!: number;

  @ApiProperty()
  updatedAt!: string;
}

export class ProductInventorySummaryDto {
  @ApiProperty({ format: 'uuid' })
  productId!: string;

  @ApiProperty({
    description: 'Soma de (on_hand - reserved) em todas as linhas do produto',
  })
  totalQuantityAvailable!: number;

  @ApiProperty()
  totalQuantityOnHand!: number;

  @ApiProperty()
  totalQuantityReserved!: number;

  @ApiProperty({ type: [InventoryBalanceResponseDto] })
  balances!: InventoryBalanceResponseDto[];
}
