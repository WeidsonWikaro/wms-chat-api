import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class SuggestPutawayDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  productId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  warehouseId!: string;

  @ApiPropertyOptional({
    minimum: 1,
    description:
      'Quantidade prevista (reserva futura de capacidade — heurística simples)',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(2_000_000_000)
  quantity?: number;
}

export class PutawaySuggestionResponseDto {
  @ApiProperty({ format: 'uuid' })
  suggestedLocationId!: string;

  @ApiProperty()
  reason!: string;
}
