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
  CreateTransferOrderDto,
  TransferOrderResponseDto,
} from './dto/transfer-order.dto';
import { TransferOrdersService } from './transfer-orders.service';

@ApiTags('transfer-orders')
@Controller('transfer-orders')
export class TransferOrdersController {
  constructor(private readonly service: TransferOrdersService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar ordens de transferência (opcional: warehouseId)',
  })
  @ApiQuery({ name: 'warehouseId', required: false, format: 'uuid' })
  @ApiOkResponse({ type: TransferOrderResponseDto, isArray: true })
  findAll(
    @Query('warehouseId') warehouseId?: string,
  ): Promise<TransferOrderResponseDto[]> {
    return this.service.findAll(warehouseId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter ordem de transferência por id' })
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
}
