import { Injectable } from '@nestjs/common';

export interface IntegrationsStatusResponseDto {
  erp: string;
  carrierApis: string;
  labelPrinting: string;
  barcodeScanners: string;
  webhooksConfigured: boolean;
  notes: string;
}

/**
 * Camada de integrações externas — contratos stub para evolução futura (ERP, transporte, etc.).
 */
@Injectable()
export class IntegrationsService {
  getStatus(): IntegrationsStatusResponseDto {
    return {
      erp: 'stub',
      carrierApis: 'stub',
      labelPrinting: 'stub',
      barcodeScanners: 'stub',
      webhooksConfigured: false,
      notes:
        'Nenhuma integração real configurada. Use este módulo para futuros conectores e webhooks.',
    };
  }
}
