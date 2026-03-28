import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreatePickWaveDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  warehouseId!: string;

  @ApiProperty({ example: 'WAVE-2026-01' })
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  code!: string;

  @ApiPropertyOptional({ minimum: 0, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(9999)
  priority?: number;
}

export class AddPickOrderToWaveDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  pickOrderId!: string;

  @ApiPropertyOptional({ minimum: 0, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(9999)
  sortOrder?: number;
}

export class PickWaveResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  warehouseId!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  priority!: number;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class PickWaveOrderResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  pickWaveId!: string;

  @ApiProperty()
  pickOrderId!: string;

  @ApiProperty()
  sortOrder!: number;
}
