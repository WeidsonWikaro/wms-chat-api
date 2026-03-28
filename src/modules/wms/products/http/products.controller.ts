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
  ApiBody,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductResponseDto } from './dto/product-response.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

const PRODUCT_ID_EXAMPLE = '550e8400-e29b-41d4-a716-446655440000';

const PRODUCT_RESPONSE_EXAMPLE: ProductResponseDto = {
  id: PRODUCT_ID_EXAMPLE,
  name: 'Notebook Dell',
  barcode: '7891234567890',
  description: '15 inches, 16GB RAM',
  createdAt: '2026-03-27T14:30:00.000Z',
  updatedAt: '2026-03-27T14:30:00.000Z',
};

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('by-barcode')
  @ApiOperation({
    summary: 'Obter produto pelo código de barras (exato)',
  })
  @ApiQuery({
    name: 'barcode',
    required: true,
    description: 'Código de barras',
  })
  @ApiOkResponse({ type: ProductResponseDto })
  findByBarcode(
    @Query('barcode') barcode: string,
  ): Promise<ProductResponseDto> {
    return this.productsService.findByBarcode(barcode);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar produtos',
    description:
      'Query opcional `q`: busca por nome ou descrição (ILIKE). Sem `q`, retorna todos.',
  })
  @ApiQuery({
    name: 'q',
    required: false,
    description: 'Texto para buscar em nome ou descrição',
  })
  @ApiOkResponse({
    type: ProductResponseDto,
    isArray: true,
    example: [PRODUCT_RESPONSE_EXAMPLE],
  })
  findAll(@Query('q') q?: string): Promise<ProductResponseDto[]> {
    return this.productsService.findAll({ q });
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get one product by id',
    description:
      'No request body. Use the product id from POST or from GET /products.',
  })
  @ApiParam({
    name: 'id',
    format: 'uuid',
    example: PRODUCT_ID_EXAMPLE,
    description: 'Product id (UUID)',
  })
  @ApiOkResponse({
    type: ProductResponseDto,
    example: PRODUCT_RESPONSE_EXAMPLE,
  })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a product',
    description:
      'Send JSON body. Required: `name`, `barcode` (unique). Optional: `description`.',
  })
  @ApiBody({
    type: CreateProductDto,
    examples: {
      full: {
        summary: 'Name + barcode + description',
        description: 'Typical payload',
        value: {
          name: 'Notebook Dell',
          barcode: '7891234567890',
          description: '15 inches, 16GB RAM',
        },
      },
      minimal: {
        summary: 'Name + barcode only',
        description: '`description` can be omitted',
        value: {
          name: 'Blue pen',
          barcode: '7890001112223',
        },
      },
    },
  })
  @ApiCreatedResponse({
    type: ProductResponseDto,
    example: PRODUCT_RESPONSE_EXAMPLE,
  })
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update a product',
    description:
      'Send JSON with any fields to change (`name`, `barcode`, and/or `description`). Barcode must remain unique.',
  })
  @ApiParam({
    name: 'id',
    format: 'uuid',
    example: PRODUCT_ID_EXAMPLE,
    description: 'Product id to update (UUID)',
  })
  @ApiBody({
    type: UpdateProductDto,
    examples: {
      all: {
        summary: 'Update all optional fields',
        value: {
          name: 'Notebook Dell — refurbished',
          barcode: '7891234567891',
          description: 'Warranty 12 months',
        },
      },
      nameOnly: {
        summary: 'Only name',
        value: {
          name: 'New name only',
        },
      },
      barcodeOnly: {
        summary: 'Only barcode',
        value: {
          barcode: '7899998887776',
        },
      },
      descriptionOnly: {
        summary: 'Only description',
        value: {
          description: 'Only description changed',
        },
      },
    },
  })
  @ApiOkResponse({
    type: ProductResponseDto,
    example: {
      ...PRODUCT_RESPONSE_EXAMPLE,
      name: 'Notebook Dell — refurbished',
      barcode: '7891234567891',
      description: 'Warranty 12 months',
      updatedAt: '2026-03-27T16:00:00.000Z',
    },
  })
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a product',
    description: 'No request body. Returns 204 with empty body on success.',
  })
  @ApiParam({
    name: 'id',
    format: 'uuid',
    example: PRODUCT_ID_EXAMPLE,
    description: 'Product id to delete (UUID)',
  })
  @ApiNoContentResponse({ description: 'Product removed; no JSON body' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.productsService.remove(id);
  }
}
