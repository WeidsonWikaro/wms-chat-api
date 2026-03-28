import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateProductDto {
  @ApiProperty({
    description:
      'New name (optional). If sent, must be non-empty. Send only fields you want to change.',
    example: 'Notebook Dell — updated',
    minLength: 1,
    maxLength: 200,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name?: string;

  @ApiProperty({
    description: 'New barcode (optional). Must stay unique if changed.',
    example: '7891234567891',
    minLength: 1,
    maxLength: 64,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  barcode?: string;

  @ApiProperty({
    description:
      'New description (optional). Omit if unchanged. Empty string clears description.',
    example: 'Refurbished, warranty 12 months',
    maxLength: 2000,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}
