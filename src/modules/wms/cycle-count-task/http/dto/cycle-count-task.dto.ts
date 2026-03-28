import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateCycleCountTaskDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  warehouseId!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    nullable: true,
    description: 'Opcional: limitar contagem a uma zona',
  })
  @IsOptional()
  @IsUUID('4')
  zoneId?: string | null;

  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  createdByUserId!: string;
}

export class CreateCycleCountLineDto {
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
}

export class CycleCountCountEntryDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  lineId!: string;

  @ApiProperty({ minimum: 0 })
  @IsInt()
  @Min(0)
  @Max(2_000_000_000)
  quantityCounted!: number;
}

export class SubmitCycleCountsDto {
  @ApiProperty({ type: [CycleCountCountEntryDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CycleCountCountEntryDto)
  entries!: CycleCountCountEntryDto[];
}

export class PostCycleCountAdjustmentsDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  postedByUserId!: string;
}

export class CycleCountTaskResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  warehouseId!: string;

  @ApiProperty({ nullable: true })
  zoneId!: string | null;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  createdByUserId!: string;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class CycleCountLineResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  cycleCountTaskId!: string;

  @ApiProperty()
  productId!: string;

  @ApiProperty()
  locationId!: string;

  @ApiProperty({ nullable: true })
  handlingUnitId!: string | null;

  @ApiProperty()
  quantityExpected!: number;

  @ApiProperty({ nullable: true })
  quantityCounted!: number | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
