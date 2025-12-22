import { computed, inject, Injectable, signal } from '@angular/core';
import { ContractRepository } from '../data-access/repositories/contract.repository';
import { ContractModel } from '../data-access/models/contract.model';
import { ContractStatus } from '../shared/types/contract.types';

@Injectable({ providedIn: 'root' })
export class ContractStore {
  private readonly repository = inject(ContractRepository);

  private readonly _contracts = signal<ContractModel[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _selectedId = signal<string | null>(null);

  readonly contracts = this._contracts.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly selectedId = this._selectedId.asReadonly();

  readonly selectedContract = computed(() => {
    const id = this._selectedId();
    if (!id) return null;
    return this._contracts().find(item => item.id === id) ?? null;
  });

  readonly contractsByStatus = computed(() => {
    const grouped: Record<ContractStatus, ContractModel[]> = {
      draft: [],
      under_review: [],
      active: [],
      completed: [],
      terminated: [],
      suspended: []
    };
    this._contracts().forEach(contract => {
      const key = contract.status ?? 'draft';
      (grouped as any)[key]?.push(contract);
    });
    return grouped;
  });

  async loadByBlueprint(blueprintId: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    try {
      const result = await this.repository.findByBlueprintId(blueprintId);
      this._contracts.set(result);
    } catch (error) {
      this._error.set(error instanceof Error ? error.message : 'Unknown error');
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  select(id: string | null): void {
    this._selectedId.set(id);
  }
}
