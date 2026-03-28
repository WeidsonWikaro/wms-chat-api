import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateInventoryAdjustmentDto {
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

  @ApiProperty({
    description: 'Positivo = entrada; negativo = saída',
  })
  @IsInt()
  @Min(-2_000_000_000)
  @Max(2_000_000_000)
  quantityDelta!: number;

  @ApiProperty({ maxLength: 500 })
  @IsString()
  @MaxLength(500)
  reason!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  createdByUserId!: string;
}

export class InventoryAdjustmentResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  productId!: string;

  @ApiProperty()
  locationId!: string;

  @ApiProperty({ nullable: true })
  handlingUnitId!: string | null;

  @ApiProperty()
  quantityDelta!: number;

  @ApiProperty()
  reason!: string;

  @ApiProperty()
  createdByUserId!: string;

  @ApiProperty()
  createdAt!: string;
}
