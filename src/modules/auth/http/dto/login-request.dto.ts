import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class LoginRequestDto {
  @ApiProperty({
    example: 'U-ALICE',
    description: 'Código único do utilizador WMS',
  })
  @IsString()
  @MinLength(1)
  code!: string;

  @ApiProperty({ format: 'password' })
  @IsString()
  @MinLength(1)
  password!: string;
}
