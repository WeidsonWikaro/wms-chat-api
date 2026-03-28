import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { PickLineStatus } from '../../../shared/domain/wms.enums';

export class CreatePickLineDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  pickOrderId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  productId!: string;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  @Max(2_000_000_000)
  quantityOrdered!: number;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID('4')
  sourceLocationId?: string | null;

  @ApiPropertyOptional({ enum: PickLineStatus, default: PickLineStatus.OPEN })
  @IsOptional()
  @IsEnum(PickLineStatus)
  status?: PickLineStatus;
}

export class PickLineResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  pickOrderId!: string;

  @ApiProperty()
  productId!: string;

  @ApiProperty()
  quantityOrdered!: number;

  @ApiProperty()
  quantityPicked!: number;

  @ApiProperty({ nullable: true })
  sourceLocationId!: string | null;

  @ApiProperty({ enum: PickLineStatus })
  status!: PickLineStatus;

  @ApiProperty({ nullable: true })
  pickedByUserId!: string | null;

  @ApiProperty({ nullable: true })
  pickedAt!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
