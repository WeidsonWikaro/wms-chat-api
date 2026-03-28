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
import { TransferOrderStatus } from '../../shared/domain/wms.enums';
import {
  CancelTransferOrderDto,
  CreateTransferOrderDto,
  ReleaseTransferOrderDto,
  TransferOrderDetailResponseDto,
  TransferOrderResponseDto,
} from './dto/transfer-order.dto';
import { TransferOrdersService } from './transfer-orders.service';

@ApiTags('transfer-orders')
@Controller('transfer-orders')
export class TransferOrdersController {
  constructor(private readonly service: TransferOrdersService) {}

  @Get('by-reference')
  @ApiOperation({
    summary:
      'Obter transferência por código de referência com linhas (produtos e quantidades)',
  })
  @ApiQuery({ name: 'referenceCode', required: true })
  @ApiOkResponse({ type: TransferOrderDetailResponseDto })
  findByReference(
    @Query('referenceCode') referenceCode: string,
  ): Promise<TransferOrderDetailResponseDto> {
    return this.service.findOneByReference(referenceCode);
  }

  @Get()
  @ApiOperation({
    summary:
      'Listar ordens de transferência (warehouseId, status, referenceCode parcial, completedByUserId)',
  })
  @ApiQuery({ name: 'warehouseId', required: false, format: 'uuid' })
  @ApiQuery({ name: 'status', required: false, enum: TransferOrderStatus })
  @ApiQuery({
    name: 'referenceCode',
    required: false,
    description: 'Busca parcial (ILIKE) no código de referência',
  })
  @ApiQuery({
    name: 'completedByUserId',
    required: false,
    format: 'uuid',
    description: 'Filtrar transferências concluídas por este utilizador',
  })
  @ApiOkResponse({ type: TransferOrderResponseDto, isArray: true })
  findAll(
    @Query('warehouseId') warehouseId?: string,
    @Query('status', new ParseEnumPipe(TransferOrderStatus, { optional: true }))
    status?: TransferOrderStatus,
    @Query('referenceCode') referenceCode?: string,
    @Query('completedByUserId') completedByUserId?: string,
  ): Promise<TransferOrderResponseDto[]> {
    return this.service.findAll({
      warehouseId,
      status,
      referenceCode,
      completedByUserId,
    });
  }

  @Get(':id/detail')
  @ApiOperation({
    summary: 'Transferência com linhas (produtos e quantidades)',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: TransferOrderDetailResponseDto })
  findDetail(@Param('id') id: string): Promise<TransferOrderDetailResponseDto> {
    return this.service.findDetail(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter transferência por id (cabeçalho)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: TransferOrderResponseDto })
  findOne(@Param('id') id: string): Promise<TransferOrderResponseDto> {
    return this.service.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar ordem de transferência (simples)' })
  @ApiCreatedResponse({ type: TransferOrderResponseDto })
  create(
    @Body() dto: CreateTransferOrderDto,
  ): Promise<TransferOrderResponseDto> {
    return this.service.create(dto);
  }

  @Post(':id/release')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Liberar transferência (reserva na origem para cada linha em aberto)',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: TransferOrderResponseDto })
  release(
    @Param('id') id: string,
    @Body() dto: ReleaseTransferOrderDto,
  ): Promise<TransferOrderResponseDto> {
    return this.service.releaseTransferOrder(id, dto);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Cancelar transferência em rascunho ou liberada (libera reservas na origem)',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: TransferOrderResponseDto })
  cancel(
    @Param('id') id: string,
    @Body() dto: CancelTransferOrderDto,
  ): Promise<TransferOrderResponseDto> {
    return this.service.cancelTransferOrder(id, dto);
  }
}
