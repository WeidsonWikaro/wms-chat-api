import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  PutawaySuggestionResponseDto,
  SuggestPutawayDto,
} from './dto/putaway.dto';
import { PutawayService } from './putaway.service';

@ApiTags('putaway')
@Controller('putaway')
export class PutawayController {
  constructor(private readonly service: PutawayService) {}

  @Post('suggest')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      'Sugerir localização de armazenagem (zona STORAGE, menor saldo do produto)',
  })
  @ApiCreatedResponse({ type: PutawaySuggestionResponseDto })
  suggest(
    @Body() dto: SuggestPutawayDto,
  ): Promise<PutawaySuggestionResponseDto> {
    return this.service.suggest(dto);
  }
}
