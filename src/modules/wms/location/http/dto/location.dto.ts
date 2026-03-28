import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateLocationDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  zoneId!: string;

  @ApiProperty({ example: 'A-01-01', maxLength: 64 })
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  code!: string;

  @ApiPropertyOptional({ nullable: true, maxLength: 64 })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  aisle?: string | null;

  @ApiPropertyOptional({ nullable: true, maxLength: 64 })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  bay?: string | null;

  @ApiPropertyOptional({ nullable: true, maxLength: 32 })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  level?: string | null;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateLocationDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4')
  zoneId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  code?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  aisle?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  bay?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  level?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class LocationResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  zoneId!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty({ nullable: true })
  aisle!: string | null;

  @ApiProperty({ nullable: true })
  bay!: string | null;

  @ApiProperty({ nullable: true })
  level!: string | null;

  @ApiProperty()
  active!: boolean;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
