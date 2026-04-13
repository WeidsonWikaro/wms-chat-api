import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class RefreshRequestDto {
  @ApiProperty({
    description: 'Refresh JWT emitido no login ou no refresh anterior',
  })
  @IsString()
  @MinLength(1)
  refreshToken!: string;
}
