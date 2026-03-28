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
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import {
  CreateWarehouseDto,
  UpdateWarehouseDto,
  WarehouseResponseDto,
} from './dto/warehouse.dto';
import { WarehousesService } from './warehouses.service';

@ApiTags('warehouses')
@Controller('warehouses')
export class WarehousesController {
  constructor(private readonly service: WarehousesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar armazéns' })
  @ApiOkResponse({ type: WarehouseResponseDto, isArray: true })
  findAll(): Promise<WarehouseResponseDto[]> {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter armazém por id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: WarehouseResponseDto })
  findOne(@Param('id') id: string): Promise<WarehouseResponseDto> {
    return this.service.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar armazém' })
  @ApiCreatedResponse({ type: WarehouseResponseDto })
  create(@Body() dto: CreateWarehouseDto): Promise<WarehouseResponseDto> {
    return this.service.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar armazém' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: WarehouseResponseDto })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateWarehouseDto,
  ): Promise<WarehouseResponseDto> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover armazém' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiNoContentResponse()
  async remove(@Param('id') id: string): Promise<void> {
    await this.service.remove(id);
  }
}
