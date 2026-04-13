import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { WmsUserRole } from '../../../shared/domain/wms-user-role.enum';

export class CreateWmsUserDto {
  @ApiProperty({ example: 'U-001', maxLength: 64 })
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  code!: string;

  @ApiProperty({ example: 'João Silva' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  displayName!: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({ enum: WmsUserRole, default: WmsUserRole.OPERATOR })
  @IsOptional()
  @IsEnum(WmsUserRole)
  role?: WmsUserRole;
}

export class UpdateWmsUserDto {
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
  displayName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({ enum: WmsUserRole })
  @IsOptional()
  @IsEnum(WmsUserRole)
  role?: WmsUserRole;
}

export class WmsUserResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  displayName!: string;

  @ApiProperty({ enum: WmsUserRole })
  role!: WmsUserRole;

  @ApiProperty()
  active!: boolean;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
