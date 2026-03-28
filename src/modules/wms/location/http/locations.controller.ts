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
  CreateLocationDto,
  LocationResponseDto,
  UpdateLocationDto,
} from './dto/location.dto';
import { LocationsService } from './locations.service';

@ApiTags('locations')
@Controller('locations')
export class LocationsController {
  constructor(private readonly service: LocationsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar localizações (opcional: filtrar por zona)' })
  @ApiQuery({ name: 'zoneId', required: false, format: 'uuid' })
  @ApiOkResponse({ type: LocationResponseDto, isArray: true })
  findAll(@Query('zoneId') zoneId?: string): Promise<LocationResponseDto[]> {
    return this.service.findAll(zoneId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter localização por id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: LocationResponseDto })
  findOne(@Param('id') id: string): Promise<LocationResponseDto> {
    return this.service.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar localização' })
  @ApiCreatedResponse({ type: LocationResponseDto })
  create(@Body() dto: CreateLocationDto): Promise<LocationResponseDto> {
    return this.service.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar localização' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: LocationResponseDto })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateLocationDto,
  ): Promise<LocationResponseDto> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover localização' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiNoContentResponse()
  async remove(@Param('id') id: string): Promise<void> {
    await this.service.remove(id);
  }
}
