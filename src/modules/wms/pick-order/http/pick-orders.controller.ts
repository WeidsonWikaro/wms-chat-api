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
  CancelPickOrderDto,
  CreatePickOrderDto,
  PickOrderResponseDto,
  ReleasePickOrderDto,
} from './dto/pick-order.dto';
import { PickOrdersService } from './pick-orders.service';

@ApiTags('pick-orders')
@Controller('pick-orders')
export class PickOrdersController {
  constructor(private readonly service: PickOrdersService) {}

  @Get()
  @ApiOperation({ summary: 'Listar ordens de picking (opcional: warehouseId)' })
  @ApiQuery({ name: 'warehouseId', required: false, format: 'uuid' })
  @ApiOkResponse({ type: PickOrderResponseDto, isArray: true })
  findAll(
    @Query('warehouseId') warehouseId?: string,
  ): Promise<PickOrderResponseDto[]> {
    return this.service.findAll(warehouseId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter ordem de picking por id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: PickOrderResponseDto })
  findOne(@Param('id') id: string): Promise<PickOrderResponseDto> {
    return this.service.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar ordem de picking (simples)' })
  @ApiCreatedResponse({ type: PickOrderResponseDto })
  create(@Body() dto: CreatePickOrderDto): Promise<PickOrderResponseDto> {
    return this.service.create(dto);
  }

  @Post(':id/release')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Liberar ordem (reserva quantity_ordered em cada linha no saldo de origem)',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: PickOrderResponseDto })
  release(
    @Param('id') id: string,
    @Body() dto: ReleasePickOrderDto,
  ): Promise<PickOrderResponseDto> {
    return this.service.releasePickOrder(id, dto);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancelar ordem (libera reservas pendentes quando aplicável)',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: PickOrderResponseDto })
  cancel(
    @Param('id') id: string,
    @Body() dto: CancelPickOrderDto,
  ): Promise<PickOrderResponseDto> {
    return this.service.cancelPickOrder(id, dto);
  }
}
