import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { PickOrderStatus } from '../../../shared/domain/wms.enums';

export class CreatePickOrderDto {
  @ApiProperty({ example: 'PO-2026-0001', maxLength: 64 })
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  orderNumber!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  warehouseId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  createdByUserId!: string;

  @ApiPropertyOptional({
    enum: PickOrderStatus,
    default: PickOrderStatus.DRAFT,
  })
  @IsOptional()
  @IsEnum(PickOrderStatus)
  status?: PickOrderStatus;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(9999)
  priority?: number | null;
}

export class PickOrderResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  orderNumber!: string;

  @ApiProperty()
  warehouseId!: string;

  @ApiProperty({ enum: PickOrderStatus })
  status!: PickOrderStatus;

  @ApiProperty({ nullable: true })
  priority!: number | null;

  @ApiProperty()
  createdByUserId!: string;

  @ApiProperty({ nullable: true })
  releasedByUserId!: string | null;

  @ApiProperty({ nullable: true })
  releasedAt!: string | null;

  @ApiProperty({ nullable: true })
  completedByUserId!: string | null;

  @ApiProperty({ nullable: true })
  completedAt!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
