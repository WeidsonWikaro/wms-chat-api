import { BadRequestException, ConflictException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';

/**
 * Maps common PostgreSQL errors to HTTP exceptions (unique / FK violations).
 */
export function rethrowDbError(err: unknown): never {
  if (err instanceof QueryFailedError) {
    const code = (err as QueryFailedError & { driverError?: { code?: string } })
      .driverError?.code;
    if (code === '23505') {
      throw new ConflictException('Valor duplicado (restrição única).');
    }
    if (code === '23503') {
      throw new BadRequestException(
        'Referência inválida ou registro ainda utilizado por outra tabela.',
      );
    }
  }
  throw err;
}
