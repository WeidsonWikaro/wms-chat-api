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
  AddPickOrderToWaveDto,
  CreatePickWaveDto,
  PickWaveOrderResponseDto,
  PickWaveResponseDto,
} from './dto/pick-wave.dto';
import { PickWavesService } from './pick-waves.service';

@ApiTags('pick-waves')
@Controller('pick-waves')
export class PickWavesController {
  constructor(private readonly service: PickWavesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar ondas (opcional: warehouseId)' })
  @ApiQuery({ name: 'warehouseId', required: false, format: 'uuid' })
  @ApiOkResponse({ type: PickWaveResponseDto, isArray: true })
  findAll(
    @Query('warehouseId') warehouseId?: string,
  ): Promise<PickWaveResponseDto[]> {
    return this.service.findAll(warehouseId);
  }

  @Get(':id/orders')
  @ApiOperation({ summary: 'Listar ordens da onda (ordenado por sortOrder)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: PickWaveOrderResponseDto, isArray: true })
  listOrders(@Param('id') id: string): Promise<PickWaveOrderResponseDto[]> {
    return this.service.listOrders(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter onda por id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: PickWaveResponseDto })
  findOne(@Param('id') id: string): Promise<PickWaveResponseDto> {
    return this.service.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar onda de picking' })
  @ApiCreatedResponse({ type: PickWaveResponseDto })
  create(@Body() dto: CreatePickWaveDto): Promise<PickWaveResponseDto> {
    return this.service.create(dto);
  }

  @Post(':id/orders')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Associar ordem de picking à onda' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiCreatedResponse({ type: PickWaveOrderResponseDto })
  addPickOrder(
    @Param('id') id: string,
    @Body() dto: AddPickOrderToWaveDto,
  ): Promise<PickWaveOrderResponseDto> {
    return this.service.addPickOrder(id, dto);
  }

  @Post(':id/release')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Liberar onda (prioriza ordens associadas: priority sequencial a partir da prioridade da onda)',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: PickWaveResponseDto })
  release(@Param('id') id: string): Promise<PickWaveResponseDto> {
    return this.service.releaseWave(id);
  }
}
