import { Injectable, inject } from '@angular/core';
import { LoggerService } from '@core/services/logger';

import { QaInspection, QaStandard, QaStatistics } from './qa.model';
import { QaRepository } from './qa.repository';

@Injectable({ providedIn: 'root' })
export class QaService {
  private readonly repository = inject(QaRepository);
  private readonly logger = inject(LoggerService);

  listInspections(blueprintId: string): Promise<QaInspection[]> {
    return this.repository.listInspections(blueprintId);
  }

  listStandards(blueprintId: string): Promise<QaStandard[]> {
    return this.repository.listStandards(blueprintId);
  }

  async getStatistics(blueprintId: string): Promise<QaStatistics> {
    try {
      return await this.repository.getStatistics(blueprintId);
    } catch (error) {
      this.logger.error('[QaService]', 'getStatistics failed', error as Error, { blueprintId });
      throw error;
    }
  }
}
