import { effect, inject, Injectable, Signal, computed } from '@angular/core';
import { ContractStore } from '../state/contract.store';
import { ContractModel } from '../data-access/models/contract.model';

@Injectable({ providedIn: 'root' })
export class ContractFacade {
  private readonly store = inject(ContractStore);

  readonly contractsState = {
    data: this.store.contracts,
    loading: this.store.loading,
    error: this.store.error
  };

  readonly statistics = computed(() => {
    const contracts = this.store.contracts();
    const totalAmount = contracts.reduce((sum, item) => sum + (item.totalAmount ?? 0), 0);
    return {
      count: contracts.length,
      totalAmount
    };
  });
  readonly selectedContract = this.store.selectedContract;

  ensureLoaded(blueprintId: Signal<string>): void {
    effect(
      () => {
        const id = blueprintId();
        void this.loadByBlueprint(id);
      },
      { allowSignalWrites: true }
    );
  }

  async loadByBlueprint(blueprintId: string): Promise<void> {
    await this.store.loadByBlueprint(blueprintId);
  }

  select(contractId: string | null): void {
    this.store.select(contractId);
  }
}
