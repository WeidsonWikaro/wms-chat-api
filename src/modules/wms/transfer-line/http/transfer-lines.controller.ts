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
  CreateTransferLineDto,
  TransferLineResponseDto,
} from './dto/transfer-line.dto';
import { TransferLinesService } from './transfer-lines.service';

@ApiTags('transfer-lines')
@Controller('transfer-lines')
export class TransferLinesController {
  constructor(private readonly service: TransferLinesService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar linhas de transferência (opcional: transferOrderId)',
  })
  @ApiQuery({ name: 'transferOrderId', required: false, format: 'uuid' })
  @ApiOkResponse({ type: TransferLineResponseDto, isArray: true })
  findAll(
    @Query('transferOrderId') transferOrderId?: string,
  ): Promise<TransferLineResponseDto[]> {
    return this.service.findAll(transferOrderId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter linha de transferência por id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: TransferLineResponseDto })
  findOne(@Param('id') id: string): Promise<TransferLineResponseDto> {
    return this.service.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar linha de transferência (simples)' })
  @ApiCreatedResponse({ type: TransferLineResponseDto })
  create(@Body() dto: CreateTransferLineDto): Promise<TransferLineResponseDto> {
    return this.service.create(dto);
  }
}
