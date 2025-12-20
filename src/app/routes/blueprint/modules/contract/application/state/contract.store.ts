/**
 * Contract Store
 *
 * Centralized Signal-based state management for the Contract module.
 * Implements reactive state with computed selectors following Angular 20+ patterns.
 *
 * Architecture:
 * - Private writable signals for internal state management
 * - Public readonly signals exposed via asReadonly()
 * - Computed signals for derived state (filtering, sorting, aggregations)
 * - Action methods that update state and emit events via BlueprintEventBus
 *
 * State Shape:
 * - loading: boolean (async operation status)
 * - error: string | null (error messages)
 * - contracts: Contract[] (all loaded contracts)
 * - selectedContractId: string | null (currently selected contract)
 * - filters: ContractFilters (active filter criteria)
 *
 * @author GigHub Development Team
 * @date 2025-12-17
 */

import { Injectable, inject, signal, computed } from '@angular/core';
import type { Signal } from '@angular/core';
import { LoggerService } from '@core';

import type { Contract, ContractFilters, ContractStatus } from '../../data/models';

/**
 * Contract Store State Interface
 */
export interface ContractStoreState {
  /** Loading indicator for async operations */
  loading: boolean;
  /** Error message if operation failed */
  error: string | null;
  /** All loaded contracts */
  contracts: Contract[];
  /** Currently selected contract ID */
  selectedContractId: string | null;
  /** Active filter criteria */
  filters: ContractFilters;
}

/**
 * Contract Store - Signal-based state management
 *
 * Provides centralized state management for contracts with reactive updates.
 * All state mutations are tracked and logged for debugging.
 */
@Injectable({ providedIn: 'root' })
export class ContractStore {
  private readonly logger = inject(LoggerService);

  // ============================================================================
  // Private State Signals (Writable)
  // ============================================================================

  /** Loading state for async operations */
  private readonly _loading = signal<boolean>(false);

  /** Error state for failed operations */
  private readonly _error = signal<string | null>(null);

  /** All contracts loaded from repository */
  private readonly _contracts = signal<Contract[]>([]);

  /** Currently selected contract ID */
  private readonly _selectedContractId = signal<string | null>(null);

  /** Active filter criteria */
  private readonly _filters = signal<ContractFilters>({
    status: undefined
  });

  // ============================================================================
  // Public Readonly State Signals
  // ============================================================================

  /** Read-only loading state */
  readonly loading: Signal<boolean> = this._loading.asReadonly();

  /** Read-only error state */
  readonly error: Signal<string | null> = this._error.asReadonly();

  /** Read-only contracts array */
  readonly contracts: Signal<readonly Contract[]> = this._contracts.asReadonly();

  /** Read-only selected contract ID */
  readonly selectedContractId: Signal<string | null> = this._selectedContractId.asReadonly();

  /** Read-only active filters */
  readonly filters: Signal<ContractFilters> = this._filters.asReadonly();

  // ============================================================================
  // Computed Selectors (Derived State)
  // ============================================================================

  /**
   * Get currently selected contract
   */
  readonly selectedContract = computed<Contract | undefined>(() => {
    const id = this._selectedContractId();
    if (!id) return undefined;
    return this._contracts().find(c => c.id === id);
  });

  /**
   * Get filtered contracts based on active filters
   */
  readonly filteredContracts = computed<Contract[]>(() => {
    const contracts = this._contracts();
    const filters = this._filters();

    return contracts.filter(contract => {
      // Status filter (filters.status is an array, contract.status is a string)
      if (filters.status && filters.status.length > 0 && !filters.status.includes(contract.status)) {
        return false;
      }

      return true;
    });
  });

  /**
   * Get active contracts (status = 'active')
   */
  readonly activeContracts = computed<Contract[]>(() => {
    return this._contracts().filter(c => c.status === 'active');
  });

  /**
   * Get draft contracts (status = 'draft')
   */
  readonly draftContracts = computed<Contract[]>(() => {
    return this._contracts().filter(c => c.status === 'draft');
  });

  /**
   * Get completed contracts (status = 'completed')
   */
  readonly completedContracts = computed<Contract[]>(() => {
    return this._contracts().filter(c => c.status === 'completed');
  });

  /**
   * Get total number of contracts
   */
  readonly totalContracts = computed<number>(() => {
    return this._contracts().length;
  });

  /**
   * Get total contract value (sum of all contract amounts)
   */
  readonly totalContractValue = computed<number>(() => {
    return this._contracts().reduce((sum, contract) => {
      return sum + (contract.totalAmount || 0);
    }, 0);
  });

  /**
   * Check if any contract is selected
   */
  readonly hasSelection = computed<boolean>(() => {
    return this._selectedContractId() !== null;
  });

  /**
   * Check if filters are active
   */
  readonly hasActiveFilters = computed<boolean>(() => {
    const filters = this._filters();
    return !!(filters.status && filters.status.length > 0);
  });

  /**
   * Get count of filtered results
   */
  readonly filteredCount = computed<number>(() => {
    return this.filteredContracts().length;
  });

  /**
   * Check if store is in error state
   */
  readonly hasError = computed<boolean>(() => {
    return this._error() !== null;
  });

  // ============================================================================
  // State Actions (Mutations)
  // ============================================================================

  /**
   * Set loading state
   */
  setLoading(loading: boolean): void {
    this.logger.debug('[ContractStore]', 'setLoading', { loading });
    this._loading.set(loading);
  }

  /**
   * Set error state
   */
  setError(error: string | null): void {
    this.logger.error('[ContractStore]', 'setError', error ? new Error(error) : undefined, { error });
    this._error.set(error);
  }

  /**
   * Clear error state
   */
  clearError(): void {
    this.logger.debug('[ContractStore]', 'clearError');
    this._error.set(null);
  }

  /**
   * Set all contracts (replaces existing array)
   */
  setContracts(contracts: Contract[]): void {
    this.logger.debug('[ContractStore]', 'setContracts', { count: contracts.length });
    this._contracts.set(contracts);
  }

  /**
   * Add a single contract to the store
   */
  addContract(contract: Contract): void {
    this.logger.debug('[ContractStore]', 'addContract', { contractId: contract.id });
    this._contracts.update(current => [...current, contract]);
  }

  /**
   * Update a contract in the store
   */
  updateContract(contractId: string, updates: Partial<Contract>): void {
    this.logger.debug('[ContractStore]', 'updateContract', { contractId, updates });
    this._contracts.update(current => current.map(c => (c.id === contractId ? { ...c, ...updates } : c)));
  }

  /**
   * Remove a contract from the store
   */
  removeContract(contractId: string): void {
    this.logger.debug('[ContractStore]', 'removeContract', { contractId });
    this._contracts.update(current => current.filter(c => c.id !== contractId));

    // Clear selection if removed contract was selected
    if (this._selectedContractId() === contractId) {
      this._selectedContractId.set(null);
    }
  }

  /**
   * Select a contract by ID
   */
  selectContract(contractId: string | null): void {
    this.logger.debug('[ContractStore]', 'selectContract', { contractId });
    this._selectedContractId.set(contractId);
  }

  /**
   * Clear contract selection
   */
  clearSelection(): void {
    this.logger.debug('[ContractStore]', 'clearSelection');
    this._selectedContractId.set(null);
  }

  /**
   * Set active filters
   */
  setFilters(filters: Partial<ContractFilters>): void {
    this.logger.debug('[ContractStore]', 'setFilters', { filters });
    this._filters.update(current => ({ ...current, ...filters }));
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.logger.debug('[ContractStore]', 'clearFilters');
    this._filters.set({
      status: undefined
    });
  }

  /**
   * Reset entire store to initial state
   */
  reset(): void {
    this.logger.debug('[ContractStore]', 'reset');
    this._loading.set(false);
    this._error.set(null);
    this._contracts.set([]);
    this._selectedContractId.set(null);
    this._filters.set({
      status: undefined
    });
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Get contract by ID (non-reactive)
   */
  getContractById(contractId: string): Contract | undefined {
    return this._contracts().find(c => c.id === contractId);
  }

  /**
   * Check if contract exists in store
   */
  hasContract(contractId: string): boolean {
    return this._contracts().some(c => c.id === contractId);
  }

  /**
   * Get contracts by status (non-reactive)
   */
  getContractsByStatus(status: ContractStatus): Contract[] {
    return this._contracts().filter(c => c.status === status);
  }

  /**
   * Get current store state snapshot (for debugging)
   */
  getStateSnapshot(): ContractStoreState {
    return {
      loading: this._loading(),
      error: this._error(),
      contracts: this._contracts(),
      selectedContractId: this._selectedContractId(),
      filters: this._filters()
    };
  }
}
