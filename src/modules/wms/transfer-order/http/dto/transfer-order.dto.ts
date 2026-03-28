import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { TransferOrderStatus } from '../../../shared/domain/wms.enums';

export class CreateTransferOrderDto {
  @ApiProperty({ example: 'TRF-2026-0001', maxLength: 64 })
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  referenceCode!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  createdByUserId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID('4')
  warehouseId?: string | null;

  @ApiPropertyOptional({
    enum: TransferOrderStatus,
    default: TransferOrderStatus.DRAFT,
  })
  @IsOptional()
  @IsEnum(TransferOrderStatus)
  status?: TransferOrderStatus;
}

export class TransferOrderResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  referenceCode!: string;

  @ApiProperty({ nullable: true })
  warehouseId!: string | null;

  @ApiProperty({ enum: TransferOrderStatus })
  status!: TransferOrderStatus;

  @ApiProperty()
  createdByUserId!: string;

  @ApiProperty({ nullable: true })
  completedByUserId!: string | null;

  @ApiProperty({ nullable: true })
  completedAt!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
