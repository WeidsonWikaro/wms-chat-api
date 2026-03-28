import { ApiProperty } from '@nestjs/swagger';

export class ProductResponseDto {
  @ApiProperty({
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Unique id (use in GET/PUT/DELETE /products/:id)',
  })
  id!: string;

  @ApiProperty({
    example: 'Notebook Dell',
    description: 'Product name',
  })
  name!: string;

  @ApiProperty({
    example: '7891234567890',
    description: 'Unique barcode',
  })
  barcode!: string;

  @ApiProperty({
    nullable: true,
    type: String,
    example: '15 inches, 16GB RAM',
    description: 'Optional text, or null',
  })
  description!: string | null;

  @ApiProperty({
    format: 'date-time',
    example: '2026-03-27T14:30:00.000Z',
    description: 'ISO 8601 creation time',
  })
  createdAt!: string;

  @ApiProperty({
    format: 'date-time',
    example: '2026-03-27T15:00:00.000Z',
    description: 'ISO 8601 last update time',
  })
  updatedAt!: string;
}
