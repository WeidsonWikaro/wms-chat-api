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
  CreateHandlingUnitDto,
  HandlingUnitResponseDto,
  UpdateHandlingUnitDto,
} from './dto/handling-unit.dto';
import { HandlingUnitsService } from './handling-units.service';

@ApiTags('handling-units')
@Controller('handling-units')
export class HandlingUnitsController {
  constructor(private readonly service: HandlingUnitsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar unidades de manuseio' })
  @ApiOkResponse({ type: HandlingUnitResponseDto, isArray: true })
  findAll(): Promise<HandlingUnitResponseDto[]> {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter unidade de manuseio por id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: HandlingUnitResponseDto })
  findOne(@Param('id') id: string): Promise<HandlingUnitResponseDto> {
    return this.service.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar unidade de manuseio' })
  @ApiCreatedResponse({ type: HandlingUnitResponseDto })
  create(@Body() dto: CreateHandlingUnitDto): Promise<HandlingUnitResponseDto> {
    return this.service.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar unidade de manuseio' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: HandlingUnitResponseDto })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateHandlingUnitDto,
  ): Promise<HandlingUnitResponseDto> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover unidade de manuseio' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiNoContentResponse()
  async remove(@Param('id') id: string): Promise<void> {
    await this.service.remove(id);
  }
}
