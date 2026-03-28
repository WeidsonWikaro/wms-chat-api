import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import {
  CreateInventoryAdjustmentDto,
  InventoryAdjustmentResponseDto,
} from './dto/inventory-adjustment.dto';
import { InventoryAdjustmentsService } from './inventory-adjustments.service';

@ApiTags('inventory-adjustments')
@Controller('inventory-adjustments')
export class InventoryAdjustmentsController {
  constructor(private readonly service: InventoryAdjustmentsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar ajustes de inventário' })
  @ApiOkResponse({ type: InventoryAdjustmentResponseDto, isArray: true })
  findAll(): Promise<InventoryAdjustmentResponseDto[]> {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter ajuste por id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: InventoryAdjustmentResponseDto })
  findOne(@Param('id') id: string): Promise<InventoryAdjustmentResponseDto> {
    return this.service.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar ajuste (atualiza saldo e grava motivo / auditoria)',
  })
  @ApiCreatedResponse({ type: InventoryAdjustmentResponseDto })
  create(
    @Body() dto: CreateInventoryAdjustmentDto,
  ): Promise<InventoryAdjustmentResponseDto> {
    return this.service.create(dto);
  }
}
