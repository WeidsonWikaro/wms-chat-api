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
import { CreateZoneDto, UpdateZoneDto, ZoneResponseDto } from './dto/zone.dto';
import { ZonesService } from './zones.service';

@ApiTags('zones')
@Controller('zones')
export class ZonesController {
  constructor(private readonly service: ZonesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar zonas (opcional: filtrar por armazém)' })
  @ApiQuery({
    name: 'warehouseId',
    required: false,
    format: 'uuid',
  })
  @ApiOkResponse({ type: ZoneResponseDto, isArray: true })
  findAll(
    @Query('warehouseId') warehouseId?: string,
  ): Promise<ZoneResponseDto[]> {
    return this.service.findAll(warehouseId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter zona por id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: ZoneResponseDto })
  findOne(@Param('id') id: string): Promise<ZoneResponseDto> {
    return this.service.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar zona' })
  @ApiCreatedResponse({ type: ZoneResponseDto })
  create(@Body() dto: CreateZoneDto): Promise<ZoneResponseDto> {
    return this.service.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar zona' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: ZoneResponseDto })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateZoneDto,
  ): Promise<ZoneResponseDto> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover zona' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiNoContentResponse()
  async remove(@Param('id') id: string): Promise<void> {
    await this.service.remove(id);
  }
}
