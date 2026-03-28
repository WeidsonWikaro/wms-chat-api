import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { TransferLineStatus } from '../../../shared/domain/wms.enums';

export class CreateTransferLineDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  transferOrderId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  productId!: string;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  @Max(2_000_000_000)
  quantity!: number;

  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  fromLocationId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  toLocationId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID('4')
  fromHandlingUnitId?: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID('4')
  toHandlingUnitId?: string | null;

  @ApiPropertyOptional({
    enum: TransferLineStatus,
    default: TransferLineStatus.OPEN,
  })
  @IsOptional()
  @IsEnum(TransferLineStatus)
  status?: TransferLineStatus;
}

export class TransferLineResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  transferOrderId!: string;

  @ApiProperty()
  productId!: string;

  @ApiProperty()
  quantity!: number;

  @ApiProperty()
  fromLocationId!: string;

  @ApiProperty()
  toLocationId!: string;

  @ApiProperty({ nullable: true })
  fromHandlingUnitId!: string | null;

  @ApiProperty({ nullable: true })
  toHandlingUnitId!: string | null;

  @ApiProperty({ enum: TransferLineStatus })
  status!: TransferLineStatus;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class ConfirmTransferLineDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Utilizador que confirma a execução da linha',
  })
  @IsUUID('4')
  executedByUserId!: string;
}
