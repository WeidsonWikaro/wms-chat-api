import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({
    description: 'Product display name (required in JSON)',
    example: 'Notebook Dell',
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @ApiProperty({
    description: 'Barcode (unique per product)',
    example: '7891234567890',
    minLength: 1,
    maxLength: 64,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(64)
  barcode!: string;

  @ApiProperty({
    description: 'Optional details (omit key or leave empty if none)',
    example: '15 inches, 16GB RAM',
    maxLength: 2000,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}
