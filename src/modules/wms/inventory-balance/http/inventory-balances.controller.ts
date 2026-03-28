import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  CreateInventoryBalanceDto,
  InventoryBalanceResponseDto,
  ProductInventorySummaryDto,
  UpdateInventoryBalanceDto,
} from './dto/inventory-balance.dto';
import { InventoryBalancesService } from './inventory-balances.service';

@ApiTags('inventory-balances')
@Controller('inventory-balances')
export class InventoryBalancesController {
  constructor(private readonly service: InventoryBalancesService) {}

  @Get('summary-by-product')
  @ApiOperation({
    summary:
      'Resumo de estoque por produto (totais e detalhe por local/HU, com disponível)',
  })
  @ApiQuery({ name: 'productId', required: true, format: 'uuid' })
  @ApiOkResponse({ type: ProductInventorySummaryDto })
  summaryByProduct(
    @Query('productId') productId: string,
  ): Promise<ProductInventorySummaryDto> {
    return this.service.findProductSummary(productId);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar saldos (opcional: productId, locationId)',
  })
  @ApiQuery({ name: 'productId', required: false, format: 'uuid' })
  @ApiQuery({ name: 'locationId', required: false, format: 'uuid' })
  @ApiOkResponse({ type: InventoryBalanceResponseDto, isArray: true })
  findAll(
    @Query('productId') productId?: string,
    @Query('locationId') locationId?: string,
  ): Promise<InventoryBalanceResponseDto[]> {
    return this.service.findAll({ productId, locationId });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter saldo por id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: InventoryBalanceResponseDto })
  findOne(@Param('id') id: string): Promise<InventoryBalanceResponseDto> {
    return this.service.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar saldo de inventário' })
  @ApiCreatedResponse({ type: InventoryBalanceResponseDto })
  create(
    @Body() dto: CreateInventoryBalanceDto,
  ): Promise<InventoryBalanceResponseDto> {
    return this.service.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar saldo de inventário' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: InventoryBalanceResponseDto })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateInventoryBalanceDto,
  ): Promise<InventoryBalanceResponseDto> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover saldo de inventário' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiNoContentResponse()
  async remove(@Param('id') id: string): Promise<void> {
    await this.service.remove(id);
  }
}
