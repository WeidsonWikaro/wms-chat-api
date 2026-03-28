import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ZoneType } from '../../../shared/domain/wms.enums';

export class CreateZoneDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  warehouseId!: string;

  @ApiProperty({ example: 'STOR-A', maxLength: 64 })
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  code!: string;

  @ApiProperty({ example: 'Armazenagem A' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @ApiProperty({ enum: ZoneType })
  @IsEnum(ZoneType)
  zoneType!: ZoneType;
}

export class UpdateZoneDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4')
  warehouseId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  code?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({ enum: ZoneType })
  @IsOptional()
  @IsEnum(ZoneType)
  zoneType?: ZoneType;
}

export class ZoneResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  warehouseId!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ enum: ZoneType })
  zoneType!: ZoneType;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
