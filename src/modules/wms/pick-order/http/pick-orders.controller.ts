import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseEnumPipe,
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
import { PickOrderStatus } from '../../shared/domain/wms.enums';
import {
  CancelPickOrderDto,
  CreatePickOrderDto,
  PickOrderDetailResponseDto,
  PickOrderResponseDto,
  ReleasePickOrderDto,
} from './dto/pick-order.dto';
import { PickOrdersService } from './pick-orders.service';

@ApiTags('pick-orders')
@Controller('pick-orders')
export class PickOrdersController {
  constructor(private readonly service: PickOrdersService) {}

  @Get('by-order-number')
  @ApiOperation({
    summary:
      'Obter ordem de picking por número (código) com linhas (produtos e quantidades)',
  })
  @ApiQuery({ name: 'orderNumber', required: true })
  @ApiOkResponse({ type: PickOrderDetailResponseDto })
  findByOrderNumber(
    @Query('orderNumber') orderNumber: string,
  ): Promise<PickOrderDetailResponseDto> {
    return this.service.findOneByOrderNumber(orderNumber);
  }

  @Get()
  @ApiOperation({
    summary:
      'Listar ordens de picking (warehouseId, status, orderNumber parcial, completedByUserId)',
  })
  @ApiQuery({ name: 'warehouseId', required: false, format: 'uuid' })
  @ApiQuery({ name: 'status', required: false, enum: PickOrderStatus })
  @ApiQuery({
    name: 'orderNumber',
    required: false,
    description: 'Busca parcial (ILIKE) no número da ordem',
  })
  @ApiQuery({
    name: 'completedByUserId',
    required: false,
    format: 'uuid',
    description: 'Filtrar ordens concluídas por este utilizador',
  })
  @ApiOkResponse({ type: PickOrderResponseDto, isArray: true })
  findAll(
    @Query('warehouseId') warehouseId?: string,
    @Query('status', new ParseEnumPipe(PickOrderStatus, { optional: true }))
    status?: PickOrderStatus,
    @Query('orderNumber') orderNumber?: string,
    @Query('completedByUserId') completedByUserId?: string,
  ): Promise<PickOrderResponseDto[]> {
    return this.service.findAll({
      warehouseId,
      status,
      orderNumber,
      completedByUserId,
    });
  }

  @Get(':id/detail')
  @ApiOperation({
    summary: 'Ordem de picking com linhas (produtos e quantidades)',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: PickOrderDetailResponseDto })
  findDetail(@Param('id') id: string): Promise<PickOrderDetailResponseDto> {
    return this.service.findDetail(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter ordem de picking por id (cabeçalho)' })
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
