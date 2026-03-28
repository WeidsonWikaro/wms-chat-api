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
  CreateWmsUserDto,
  UpdateWmsUserDto,
  WmsUserResponseDto,
} from './dto/wms-user.dto';
import { WmsUsersService } from './wms-users.service';

@ApiTags('wms-users')
@Controller('wms-users')
export class WmsUsersController {
  constructor(private readonly service: WmsUsersService) {}

  @Get()
  @ApiOperation({ summary: 'Listar utilizadores WMS' })
  @ApiOkResponse({ type: WmsUserResponseDto, isArray: true })
  findAll(): Promise<WmsUserResponseDto[]> {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter utilizador WMS por id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: WmsUserResponseDto })
  findOne(@Param('id') id: string): Promise<WmsUserResponseDto> {
    return this.service.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar utilizador WMS' })
  @ApiCreatedResponse({ type: WmsUserResponseDto })
  create(@Body() dto: CreateWmsUserDto): Promise<WmsUserResponseDto> {
    return this.service.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar utilizador WMS' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: WmsUserResponseDto })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateWmsUserDto,
  ): Promise<WmsUserResponseDto> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover utilizador WMS' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiNoContentResponse()
  async remove(@Param('id') id: string): Promise<void> {
    await this.service.remove(id);
  }
}
