import { inject, Injectable, signal } from '@angular/core';
import { ContractRepository } from '../data-access/repositories/contract.repository';
import { ContractModel } from '../data-access/models/contract.model';

@Injectable({ providedIn: 'root' })
export class ContractFacade {
  private readonly repository = inject(ContractRepository);

  private readonly contracts = signal<ContractModel[]>([]);
  private readonly loading = signal(false);

  readonly contractsState = {
    data: this.contracts.asReadonly(),
    loading: this.loading.asReadonly()
  };

  async loadByBlueprint(blueprintId: string): Promise<void> {
    this.loading.set(true);
    try {
      const result = await this.repository.findByBlueprintId(blueprintId);
      this.contracts.set(result);
    } finally {
      this.loading.set(false);
    }
  }
}
