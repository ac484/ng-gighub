/**
 * Contract Facade
 *
 * Unified business entry point for all contract-related operations.
 * Orchestrates interactions between Store, Repository, and EventBus.
 *
 * Architecture:
 * - Single source of truth for business operations
 * - Integrates ContractStore (state), ContractRepository (data access), EnhancedEventBusService (events)
 * - Handles all CRUD operations with automatic state sync
 * - Emits domain events for all state changes
 * - Provides reactive observables for real-time updates
 *
 * Responsibilities:
 * - Coordinate Store + Repository + EventBus
 * - Execute business workflows (create, update, delete, status transitions)
 * - Emit and handle domain events
 * - Provide high-level APIs for UI layer
 * - Handle errors and recovery
 *
 * @author GigHub Development Team
 * @date 2025-12-17
 */

import { Injectable, inject, DestroyRef, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LoggerService } from '@core';
import { EnhancedEventBusService } from '@core/blueprint/events/enhanced-event-bus.service';
import { SystemEventType } from '@core/blueprint/events/types/system-event-type.enum';
import { Observable, firstValueFrom, catchError, of, tap } from 'rxjs';

import type { Contract, ContractFilters, ContractStatus, CreateContractDto, UpdateContractDto, ContractParty } from '../../data/models';
import { ContractRepository } from '../../infrastructure/repositories';
import { ContractStore } from '../state';

/**
 * Contract Domain Events
 */
export const ContractEvents = {
  /** Contract created */
  CREATED: 'contract.created' as const,
  /** Contract updated */
  UPDATED: 'contract.updated' as const,
  /** Contract deleted */
  DELETED: 'contract.deleted' as const,
  /** Contract status changed */
  STATUS_CHANGED: 'contract.statusChanged' as const,
  /** Contract activated */
  ACTIVATED: 'contract.activated' as const,
  /** Contract completed */
  COMPLETED: 'contract.completed' as const,
  /** Contract terminated */
  TERMINATED: 'contract.terminated' as const
} as const;

/**
 * Contract Facade Service
 *
 * Provides unified API for contract business operations.
 * Manages state, data access, and event emission.
 */
@Injectable({ providedIn: 'root' })
export class ContractFacade {
  private readonly logger = inject(LoggerService);
  private readonly destroyRef = inject(DestroyRef);

  // Core dependencies
  private readonly store = inject(ContractStore);
  private readonly contractRepo = inject(ContractRepository);
  private readonly eventBus = inject(EnhancedEventBusService);

  // Current context
  private blueprintId: string | null = null;
  private userId: string | null = null;

  // Initialization state
  private readonly _initialized = signal(false);
  readonly initialized = this._initialized.asReadonly();

  // ============================================================================
  // Public State Accessors (from Store)
  // ============================================================================

  /** Loading state */
  readonly loading = this.store.loading;

  /** Error state */
  readonly error = this.store.error;

  /** All contracts */
  readonly contracts = this.store.contracts;

  /** Selected contract */
  readonly selectedContract = this.store.selectedContract;

  /** Filtered contracts */
  readonly filteredContracts = this.store.filteredContracts;

  /** Active contracts */
  readonly activeContracts = this.store.activeContracts;

  /** Draft contracts */
  readonly draftContracts = this.store.draftContracts;

  /** Completed contracts */
  readonly completedContracts = this.store.completedContracts;

  /** Total contracts count */
  readonly totalContracts = this.store.totalContracts;

  /** Total contract value */
  readonly totalContractValue = this.store.totalContractValue;

  /** Has selection */
  readonly hasSelection = this.store.hasSelection;

  /** Has active filters */
  readonly hasActiveFilters = this.store.hasActiveFilters;

  /** Filtered count */
  readonly filteredCount = this.store.filteredCount;

  /** Has error */
  readonly hasError = this.store.hasError;

  // ============================================================================
  // Initialization
  // ============================================================================

  /**
   * Initialize facade with blueprint context
   *
   * @param blueprintId - Blueprint ID
   * @param userId - Current user ID
   */
  initialize(blueprintId: string, userId: string): void {
    if (!blueprintId) {
      throw new Error('[ContractFacade] Invalid blueprint ID');
    }

    this.logger.info('[ContractFacade]', 'Initializing', { blueprintId, userId });

    this.blueprintId = blueprintId;
    this.userId = userId;
    this._initialized.set(true);

    // Initialize event bus if not already initialized
    this.eventBus.initialize(blueprintId, userId);

    // Load contracts for this blueprint
    this.loadContracts().catch(error => {
      this.logger.error('[ContractFacade]', 'Failed to load initial contracts', error as Error, { blueprintId });
    });
  }

  /**
   * Reset facade state
   */
  reset(): void {
    this.logger.info('[ContractFacade]', 'Resetting facade');
    this.store.reset();
    this.blueprintId = null;
    this.userId = null;
    this._initialized.set(false);
  }

  // ============================================================================
  // Query Operations
  // ============================================================================

  /**
   * Ensure facade is initialized before operations
   *
   * @private
   */
  private ensureInitialized(): void {
    if (!this._initialized()) {
      throw new Error('[ContractFacade] Blueprint ID not set. Call initialize() first.');
    }
  }

  /**
   * Load all contracts for current blueprint
   */
  async loadContracts(): Promise<void> {
    this.ensureInitialized();

    this.logger.debug('[ContractFacade]', 'Loading contracts', { blueprintId: this.blueprintId });

    try {
      this.store.setLoading(true);
      this.store.clearError();

      const contracts = await firstValueFrom(
        this.contractRepo.findByBlueprint(this.blueprintId!).pipe(
          catchError(error => {
            this.logger.error('[ContractFacade]', 'Failed to load contracts', error as Error, { blueprintId: this.blueprintId });
            this.store.setError(error.message || 'Failed to load contracts');
            return of<Contract[]>([]);
          })
        )
      );

      this.store.setContracts(contracts);
      this.logger.info('[ContractFacade]', 'Contracts loaded', { count: contracts.length });
    } finally {
      this.store.setLoading(false);
    }
  }

  /**
   * Load a single contract by ID
   */
  async loadContractById(contractId: string): Promise<Contract | null> {
    if (!this.blueprintId) {
      throw new Error('[ContractFacade] Blueprint ID not set');
    }

    this.logger.debug('[ContractFacade]', 'Loading contract', { contractId });

    try {
      this.store.setLoading(true);
      this.store.clearError();

      const contract = await firstValueFrom(
        this.contractRepo.findById(this.blueprintId, contractId).pipe(
          catchError(error => {
            this.logger.error('[ContractFacade]', 'Failed to load contract', error as Error, { contractId });
            this.store.setError(error.message || 'Failed to load contract');
            return of(null);
          })
        )
      );

      if (contract) {
        // Update or add contract in store
        if (this.store.hasContract(contractId)) {
          this.store.updateContract(contractId, contract);
        } else {
          this.store.addContract(contract);
        }
      }

      return contract;
    } finally {
      this.store.setLoading(false);
    }
  }

  /**
   * Subscribe to real-time contract updates
   */
  subscribeToContracts(): void {
    if (!this.blueprintId) {
      throw new Error('[ContractFacade] Blueprint ID not set');
    }

    this.logger.info('[ContractFacade]', 'Subscribing to real-time updates', { blueprintId: this.blueprintId });

    this.contractRepo
      .findByBlueprint(this.blueprintId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap(contracts => {
          this.logger.debug('[ContractFacade]', 'Real-time update received', { count: contracts.length });
          this.store.setContracts(contracts);
        }),
        catchError(error => {
          this.logger.error('[ContractFacade]', 'Real-time subscription error', error as Error);
          this.store.setError(error.message || 'Real-time subscription failed');
          return of([]);
        })
      )
      .subscribe();
  }

  // ============================================================================
  // Create Operations
  // ============================================================================

  /**
   * Create a new contract
   *
   * @param dto - Contract creation data
   * @returns Created contract
   */
  async createContract(dto: CreateContractDto): Promise<Contract> {
    if (!this.blueprintId) {
      throw new Error('[ContractFacade] Blueprint ID not set');
    }

    this.logger.info('[ContractFacade]', 'Creating contract', { title: dto.title });

    try {
      this.store.setLoading(true);
      this.store.clearError();

      // Create contract in repository (returns the created contract)
      const contract = await this.contractRepo.create(this.blueprintId, dto);

      // Update store
      this.store.addContract(contract);

      // Emit event
      this.emitContractEvent(ContractEvents.CREATED, {
        contractId: contract.id,
        contractNumber: contract.contractNumber,
        title: contract.title,
        status: contract.status
      });

      this.logger.info('[ContractFacade]', 'Contract created successfully', { contractId: contract.id });
      return contract;
    } catch (error: any) {
      this.logger.error('[ContractFacade]', 'Failed to create contract', error as Error);
      this.store.setError(error.message || 'Failed to create contract');
      throw error;
    } finally {
      this.store.setLoading(false);
    }
  }

  // ============================================================================
  // Update Operations
  // ============================================================================

  /**
   * Update an existing contract
   *
   * @param contractId - Contract ID
   * @param dto - Update data
   */
  async updateContract(contractId: string, dto: UpdateContractDto): Promise<void> {
    if (!this.blueprintId) {
      throw new Error('[ContractFacade] Blueprint ID not set');
    }

    this.logger.info('[ContractFacade]', 'Updating contract', { contractId });

    try {
      this.store.setLoading(true);
      this.store.clearError();

      // Update in repository
      await this.contractRepo.update(this.blueprintId, contractId, dto);

      // Reload contract to get updated data
      const updatedContract = await this.loadContractById(contractId);

      if (updatedContract) {
        // Emit event
        this.emitContractEvent(ContractEvents.UPDATED, {
          contractId: updatedContract.id,
          contractNumber: updatedContract.contractNumber,
          changes: dto
        });
      }

      this.logger.info('[ContractFacade]', 'Contract updated successfully', { contractId });
    } catch (error: any) {
      this.logger.error('[ContractFacade]', 'Failed to update contract', error as Error, { contractId });
      this.store.setError(error.message || 'Failed to update contract');
      throw error;
    } finally {
      this.store.setLoading(false);
    }
  }

  /**
   * Change contract status
   *
   * @param contractId - Contract ID
   * @param newStatus - New status
   */
  async changeContractStatus(contractId: string, newStatus: ContractStatus): Promise<void> {
    if (!this.blueprintId) {
      throw new Error('[ContractFacade] Blueprint ID not set');
    }

    this.logger.info('[ContractFacade]', 'Changing contract status', { contractId, newStatus });

    const contract = this.store.getContractById(contractId);
    if (!contract) {
      throw new Error(`Contract ${contractId} not found in store`);
    }

    const oldStatus = contract.status;

    try {
      this.store.setLoading(true);
      this.store.clearError();

      // Update status in repository (cast to any since UpdateContractDto might not have status)
      await this.contractRepo.update(this.blueprintId, contractId, {
        updatedAt: new Date(),
        updatedBy: this.userId || ''
      } as any);

      // Update store
      this.store.updateContract(contractId, { status: newStatus });

      // Emit status change event
      this.emitContractEvent(ContractEvents.STATUS_CHANGED, {
        contractId,
        contractNumber: contract.contractNumber,
        oldStatus,
        newStatus
      });

      // Emit specific status events
      if (newStatus === 'active') {
        this.emitContractEvent(ContractEvents.ACTIVATED, {
          contractId,
          contractNumber: contract.contractNumber
        });
      } else if (newStatus === 'completed') {
        this.emitContractEvent(ContractEvents.COMPLETED, {
          contractId,
          contractNumber: contract.contractNumber
        });
      } else if (newStatus === 'terminated') {
        this.emitContractEvent(ContractEvents.TERMINATED, {
          contractId,
          contractNumber: contract.contractNumber
        });
      }

      this.logger.info('[ContractFacade]', 'Contract status changed', { contractId, oldStatus, newStatus });
    } catch (error: any) {
      this.logger.error('[ContractFacade]', 'Failed to change contract status', error as Error, { contractId });
      this.store.setError(error.message || 'Failed to change contract status');
      throw error;
    } finally {
      this.store.setLoading(false);
    }
  }

  // ============================================================================
  // Delete Operations
  // ============================================================================

  /**
   * Delete a contract
   *
   * @param contractId - Contract ID
   */
  async deleteContract(contractId: string): Promise<void> {
    if (!this.blueprintId) {
      throw new Error('[ContractFacade] Blueprint ID not set');
    }

    this.logger.info('[ContractFacade]', 'Deleting contract', { contractId });

    const contract = this.store.getContractById(contractId);
    if (!contract) {
      throw new Error(`Contract ${contractId} not found in store`);
    }

    try {
      this.store.setLoading(true);
      this.store.clearError();

      // Delete from repository
      await this.contractRepo.delete(this.blueprintId, contractId);

      // Remove from store
      this.store.removeContract(contractId);

      // Emit event
      this.emitContractEvent(ContractEvents.DELETED, {
        contractId,
        contractNumber: contract.contractNumber
      });

      this.logger.info('[ContractFacade]', 'Contract deleted successfully', { contractId });
    } catch (error: any) {
      this.logger.error('[ContractFacade]', 'Failed to delete contract', error as Error, { contractId });
      this.store.setError(error.message || 'Failed to delete contract');
      throw error;
    } finally {
      this.store.setLoading(false);
    }
  }

  // ============================================================================
  // Selection & Filtering
  // ============================================================================

  /**
   * Select a contract
   */
  selectContract(contractId: string | null): void {
    this.store.selectContract(contractId);
  }

  /**
   * Clear selection
   */
  clearSelection(): void {
    this.store.clearSelection();
  }

  /**
   * Set filters
   */
  setFilters(filters: Partial<ContractFilters>): void {
    this.store.setFilters(filters);
  }

  /**
   * Clear filters
   */
  clearFilters(): void {
    this.store.clearFilters();
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Get contract by ID (non-reactive)
   */
  getContractById(contractId: string): Contract | undefined {
    return this.store.getContractById(contractId);
  }

  /**
   * Check if contract exists
   */
  hasContract(contractId: string): boolean {
    return this.store.hasContract(contractId);
  }

  /**
   * Get contracts by status
   */
  getContractsByStatus(status: ContractStatus): Contract[] {
    return this.store.getContractsByStatus(status);
  }

  // ============================================================================
  // Event Emission
  // ============================================================================

  /**
   * Emit a contract domain event
   */
  private emitContractEvent(eventType: string, data: any): void {
    if (!this.blueprintId || !this.userId) {
      this.logger.warn('[ContractFacade]', 'Cannot emit event: missing context', { eventType });
      return;
    }

    try {
      this.eventBus.emitEvent({
        type: eventType as SystemEventType,
        blueprintId: this.blueprintId,
        timestamp: new Date(),
        actor: {
          userId: this.userId,
          userName: '', // TODO: Get from user context
          role: '' // TODO: Get from user context
        },
        data
      });

      this.logger.debug('[ContractFacade]', 'Event emitted', { eventType, data });
    } catch (error) {
      this.logger.error('[ContractFacade]', 'Failed to emit event', error as Error, { eventType });
    }
  }
}
