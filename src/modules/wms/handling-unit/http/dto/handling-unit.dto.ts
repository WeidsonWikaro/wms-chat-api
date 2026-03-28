import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  HandlingUnitStatus,
  HandlingUnitType,
} from '../../../shared/domain/wms.enums';

export class CreateHandlingUnitDto {
  @ApiProperty({ example: 'SSCC-123', maxLength: 128 })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  code!: string;

  @ApiProperty({ enum: HandlingUnitType })
  @IsEnum(HandlingUnitType)
  type!: HandlingUnitType;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID('4')
  currentLocationId?: string | null;

  @ApiProperty({ enum: HandlingUnitStatus })
  @IsEnum(HandlingUnitStatus)
  status!: HandlingUnitStatus;
}

export class UpdateHandlingUnitDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  code?: string;

  @ApiPropertyOptional({ enum: HandlingUnitType })
  @IsOptional()
  @IsEnum(HandlingUnitType)
  type?: HandlingUnitType;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID('4')
  currentLocationId?: string | null;

  @ApiPropertyOptional({ enum: HandlingUnitStatus })
  @IsOptional()
  @IsEnum(HandlingUnitStatus)
  status?: HandlingUnitStatus;
}

export class HandlingUnitResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty({ enum: HandlingUnitType })
  type!: HandlingUnitType;

  @ApiProperty({ nullable: true })
  currentLocationId!: string | null;

  @ApiProperty({ enum: HandlingUnitStatus })
  status!: HandlingUnitStatus;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
