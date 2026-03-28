import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  ConfirmPickLineDto,
  CreatePickLineDto,
  PickLineResponseDto,
} from './dto/pick-line.dto';
import { PickLinesService } from './pick-lines.service';

@ApiTags('pick-lines')
@Controller('pick-lines')
export class PickLinesController {
  constructor(private readonly service: PickLinesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar linhas de picking (opcional: pickOrderId)' })
  @ApiQuery({ name: 'pickOrderId', required: false, format: 'uuid' })
  @ApiOkResponse({ type: PickLineResponseDto, isArray: true })
  findAll(
    @Query('pickOrderId') pickOrderId?: string,
  ): Promise<PickLineResponseDto[]> {
    return this.service.findAll(pickOrderId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter linha de picking por id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: PickLineResponseDto })
  findOne(@Param('id') id: string): Promise<PickLineResponseDto> {
    return this.service.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar linha de picking (simples)' })
  @ApiCreatedResponse({ type: PickLineResponseDto })
  create(@Body() dto: CreatePickLineDto): Promise<PickLineResponseDto> {
    return this.service.create(dto);
  }

  @Post(':id/confirm-pick')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Confirmar picking (baixa física + libera reserva proporcional à quantidade)',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: PickLineResponseDto })
  confirmPick(
    @Param('id') id: string,
    @Body() dto: ConfirmPickLineDto,
  ): Promise<PickLineResponseDto> {
    return this.service.confirmPick(id, dto);
  }
}
