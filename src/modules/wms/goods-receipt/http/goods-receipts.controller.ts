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
  CreateGoodsReceiptDto,
  CreateGoodsReceiptLineDto,
  GoodsReceiptLineResponseDto,
  GoodsReceiptResponseDto,
  PostGoodsReceiptDto,
} from './dto/goods-receipt.dto';
import { GoodsReceiptsService } from './goods-receipts.service';

@ApiTags('goods-receipts')
@Controller('goods-receipts')
export class GoodsReceiptsController {
  constructor(private readonly service: GoodsReceiptsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar recebimentos (opcional: warehouseId)' })
  @ApiQuery({ name: 'warehouseId', required: false, format: 'uuid' })
  @ApiOkResponse({ type: GoodsReceiptResponseDto, isArray: true })
  findAll(
    @Query('warehouseId') warehouseId?: string,
  ): Promise<GoodsReceiptResponseDto[]> {
    return this.service.findAll(warehouseId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter recebimento por id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: GoodsReceiptResponseDto })
  findOne(@Param('id') id: string): Promise<GoodsReceiptResponseDto> {
    return this.service.findOne(id);
  }

  @Get(':id/lines')
  @ApiOperation({ summary: 'Listar linhas do recebimento' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: GoodsReceiptLineResponseDto, isArray: true })
  findLines(@Param('id') id: string): Promise<GoodsReceiptLineResponseDto[]> {
    return this.service.findLines(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar recebimento em rascunho' })
  @ApiCreatedResponse({ type: GoodsReceiptResponseDto })
  create(@Body() dto: CreateGoodsReceiptDto): Promise<GoodsReceiptResponseDto> {
    return this.service.create(dto);
  }

  @Post(':id/lines')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Adicionar linha ao recebimento' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiCreatedResponse({ type: GoodsReceiptLineResponseDto })
  addLine(
    @Param('id') id: string,
    @Body() dto: CreateGoodsReceiptLineDto,
  ): Promise<GoodsReceiptLineResponseDto> {
    return this.service.addLine(id, dto);
  }

  @Post(':id/post')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Lançar recebimento (entrada no local de recebimento, sem HU — saldo agregado)',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: GoodsReceiptResponseDto })
  postReceipt(
    @Param('id') id: string,
    @Body() dto: PostGoodsReceiptDto,
  ): Promise<GoodsReceiptResponseDto> {
    return this.service.postReceipt(id, dto);
  }
}
