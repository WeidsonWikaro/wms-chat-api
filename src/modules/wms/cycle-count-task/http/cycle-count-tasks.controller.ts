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
  CreateCycleCountLineDto,
  CreateCycleCountTaskDto,
  CycleCountLineResponseDto,
  CycleCountTaskResponseDto,
  PostCycleCountAdjustmentsDto,
  SubmitCycleCountsDto,
} from './dto/cycle-count-task.dto';
import { CycleCountTasksService } from './cycle-count-tasks.service';

@ApiTags('cycle-count-tasks')
@Controller('cycle-count-tasks')
export class CycleCountTasksController {
  constructor(private readonly service: CycleCountTasksService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar tarefas de contagem (opcional: warehouseId)',
  })
  @ApiQuery({ name: 'warehouseId', required: false, format: 'uuid' })
  @ApiOkResponse({ type: CycleCountTaskResponseDto, isArray: true })
  findAll(
    @Query('warehouseId') warehouseId?: string,
  ): Promise<CycleCountTaskResponseDto[]> {
    return this.service.findAll(warehouseId);
  }

  @Get(':id/lines')
  @ApiOperation({ summary: 'Listar linhas da tarefa' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: CycleCountLineResponseDto, isArray: true })
  findLines(@Param('id') id: string): Promise<CycleCountLineResponseDto[]> {
    return this.service.findLines(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter tarefa por id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: CycleCountTaskResponseDto })
  findOne(@Param('id') id: string): Promise<CycleCountTaskResponseDto> {
    return this.service.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar tarefa de contagem cíclica' })
  @ApiCreatedResponse({ type: CycleCountTaskResponseDto })
  create(
    @Body() dto: CreateCycleCountTaskDto,
  ): Promise<CycleCountTaskResponseDto> {
    return this.service.create(dto);
  }

  @Post(':id/lines')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Adicionar linha (snapshot quantityExpected do saldo)',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiCreatedResponse({ type: CycleCountLineResponseDto })
  addLine(
    @Param('id') id: string,
    @Body() dto: CreateCycleCountLineDto,
  ): Promise<CycleCountLineResponseDto> {
    return this.service.addLine(id, dto);
  }

  @Post(':id/submit-counts')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Registrar contagens físicas' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: CycleCountLineResponseDto, isArray: true })
  submitCounts(
    @Param('id') id: string,
    @Body() dto: SubmitCycleCountsDto,
  ): Promise<CycleCountLineResponseDto[]> {
    return this.service.submitCounts(id, dto);
  }

  @Post(':id/post-adjustments')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Gerar ajustes de inventário a partir das diferenças e concluir tarefa',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: CycleCountTaskResponseDto })
  postAdjustments(
    @Param('id') id: string,
    @Body() dto: PostCycleCountAdjustmentsDto,
  ): Promise<CycleCountTaskResponseDto> {
    return this.service.postAdjustments(id, dto);
  }
}
