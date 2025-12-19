/**
 * Contract Service - 合約管理服務
 *
 * Business logic layer for contract management.
 * Coordinates between repositories and provides domain-specific operations.
 *
 * Responsibilities:
 * - Business logic validation
 * - Contract lifecycle management
 * - Domain event coordination
 * - Transaction orchestration
 *
 * @author GigHub Development Team
 * @date 2025-12-19
 */

import { Injectable, inject } from '@angular/core';
import { LoggerService } from '@core';
import { EnhancedEventBusService } from '@core/blueprint/events/enhanced-event-bus.service';
import { SystemEventType } from '@core/blueprint/events/types/system-event-type.enum';

import type { Contract, ContractStatus, CreateContractDto, UpdateContractDto, ContractFilters, ContractStatistics } from '../models';
import { ContractRepository } from '../repositories';

/**
 * Contract Status Transition Rules
 */
const STATUS_TRANSITIONS: Record<ContractStatus, ContractStatus[]> = {
  draft: ['pending_activation'],
  pending_activation: ['active', 'draft'],
  active: ['completed', 'terminated'],
  completed: [],
  terminated: []
};

/**
 * Contract Service
 *
 * Provides business logic for contract operations.
 * Uses ContractRepository for data access.
 */
@Injectable({ providedIn: 'root' })
export class ContractService {
  private readonly contractRepo = inject(ContractRepository);
  private readonly eventBus = inject(EnhancedEventBusService);
  private readonly logger = inject(LoggerService);

  // ============================================================================
  // Query Operations
  // ============================================================================

  /**
   * Get all contracts for a blueprint
   */
  async getContractsByBlueprint(blueprintId: string, filters?: ContractFilters): Promise<Contract[]> {
    this.logger.debug('[ContractService]', 'getContractsByBlueprint', { blueprintId, filters });

    try {
      const contracts = await this.contractRepo.findByBlueprint(blueprintId, filters).toPromise();
      return contracts || [];
    } catch (error) {
      this.logger.error('[ContractService]', 'Failed to get contracts', error as Error, { blueprintId });
      throw error;
    }
  }

  /**
   * Get a single contract by ID
   */
  async getContractById(blueprintId: string, contractId: string): Promise<Contract | null> {
    this.logger.debug('[ContractService]', 'getContractById', { blueprintId, contractId });

    try {
      return await this.contractRepo.findByIdOnce(blueprintId, contractId);
    } catch (error) {
      this.logger.error('[ContractService]', 'Failed to get contract', error as Error, { contractId });
      throw error;
    }
  }

  /**
   * Get contract statistics for a blueprint
   */
  async getContractStatistics(blueprintId: string): Promise<ContractStatistics> {
    this.logger.debug('[ContractService]', 'getContractStatistics', { blueprintId });

    try {
      const counts = await this.contractRepo.countByStatus(blueprintId);
      const contracts = await this.getContractsByBlueprint(blueprintId);

      const activeContracts = contracts.filter(c => c.status === 'active');
      const totalValue = contracts.reduce((sum, c) => sum + c.totalAmount, 0);
      const activeValue = activeContracts.reduce((sum, c) => sum + c.totalAmount, 0);

      return {
        total: counts.draft + counts.pending_activation + counts.active + counts.completed + counts.terminated,
        draft: counts.draft,
        pendingActivation: counts.pending_activation,
        active: counts.active,
        completed: counts.completed,
        terminated: counts.terminated,
        totalValue,
        activeValue
      };
    } catch (error) {
      this.logger.error('[ContractService]', 'Failed to get statistics', error as Error, { blueprintId });
      throw error;
    }
  }

  // ============================================================================
  // Create Operations
  // ============================================================================

  /**
   * Create a new contract
   */
  async createContract(blueprintId: string, dto: CreateContractDto, actorId: string): Promise<Contract> {
    this.logger.info('[ContractService]', 'Creating contract', { blueprintId, title: dto.title });

    try {
      // Validate input
      this.validateCreateContract(dto);

      // Create contract in repository
      const contract = await this.contractRepo.create(blueprintId, {
        ...dto,
        createdBy: actorId
      });

      // TODO: Emit domain event when EventBus API is updated

      this.logger.info('[ContractService]', 'Contract created successfully', {
        contractId: contract.id,
        contractNumber: contract.contractNumber
      });

      return contract;
    } catch (error) {
      this.logger.error('[ContractService]', 'Failed to create contract', error as Error, { blueprintId });
      throw error;
    }
  }

  // ============================================================================
  // Update Operations
  // ============================================================================

  /**
   * Update an existing contract
   */
  async updateContract(blueprintId: string, contractId: string, dto: UpdateContractDto, actorId: string): Promise<Contract> {
    this.logger.info('[ContractService]', 'Updating contract', { blueprintId, contractId });

    try {
      // Validate input
      this.validateUpdateContract(dto);

      // Get existing contract to verify it exists
      const existing = await this.getContractById(blueprintId, contractId);
      if (!existing) {
        throw new Error(`Contract not found: ${contractId}`);
      }

      // Update contract in repository
      const updated = await this.contractRepo.update(blueprintId, contractId, {
        ...dto,
        updatedBy: actorId
      });

      // TODO: Emit domain event when EventBus API is updated

      this.logger.info('[ContractService]', 'Contract updated successfully', { contractId });

      return updated;
    } catch (error) {
      this.logger.error('[ContractService]', 'Failed to update contract', error as Error, { contractId });
      throw error;
    }
  }

  /**
   * Update contract status with validation
   */
  async updateContractStatus(blueprintId: string, contractId: string, newStatus: ContractStatus, actorId: string): Promise<void> {
    this.logger.info('[ContractService]', 'Updating contract status', { contractId, newStatus });

    try {
      // Get existing contract
      const contract = await this.getContractById(blueprintId, contractId);
      if (!contract) {
        throw new Error(`Contract not found: ${contractId}`);
      }

      // Validate status transition
      const allowedTransitions = STATUS_TRANSITIONS[contract.status];
      if (!allowedTransitions.includes(newStatus)) {
        throw new Error(
          `Invalid status transition from ${contract.status} to ${newStatus}. ` + `Allowed transitions: ${allowedTransitions.join(', ')}`
        );
      }

      // Update status in repository
      await this.contractRepo.updateStatus(blueprintId, contractId, newStatus);

      // TODO: Emit domain event when EventBus API is updated

      this.logger.info('[ContractService]', 'Contract status updated successfully', {
        contractId,
        oldStatus: contract.status,
        newStatus
      });
    } catch (error) {
      this.logger.error('[ContractService]', 'Failed to update contract status', error as Error, {
        contractId,
        newStatus
      });
      throw error;
    }
  }

  /**
   * Activate a contract (from draft or pending_activation to active)
   */
  async activateContract(blueprintId: string, contractId: string, actorId: string): Promise<void> {
    this.logger.info('[ContractService]', 'Activating contract', { contractId });

    try {
      const contract = await this.getContractById(blueprintId, contractId);
      if (!contract) {
        throw new Error(`Contract not found: ${contractId}`);
      }

      if (contract.status !== 'draft' && contract.status !== 'pending_activation') {
        throw new Error(`Cannot activate contract in status: ${contract.status}`);
      }

      // Validate contract is ready for activation
      this.validateContractForActivation(contract);

      await this.updateContractStatus(blueprintId, contractId, 'active', actorId);

      this.logger.info('[ContractService]', 'Contract activated successfully', { contractId });
    } catch (error) {
      this.logger.error('[ContractService]', 'Failed to activate contract', error as Error, { contractId });
      throw error;
    }
  }

  /**
   * Complete a contract (from active to completed)
   */
  async completeContract(blueprintId: string, contractId: string, actorId: string): Promise<void> {
    this.logger.info('[ContractService]', 'Completing contract', { contractId });

    try {
      await this.updateContractStatus(blueprintId, contractId, 'completed', actorId);
      this.logger.info('[ContractService]', 'Contract completed successfully', { contractId });
    } catch (error) {
      this.logger.error('[ContractService]', 'Failed to complete contract', error as Error, { contractId });
      throw error;
    }
  }

  /**
   * Terminate a contract (from active to terminated)
   */
  async terminateContract(blueprintId: string, contractId: string, actorId: string, reason?: string): Promise<void> {
    this.logger.info('[ContractService]', 'Terminating contract', { contractId, reason });

    try {
      await this.updateContractStatus(blueprintId, contractId, 'terminated', actorId);

      // TODO: Emit additional event with termination reason when EventBus API is updated

      this.logger.info('[ContractService]', 'Contract terminated successfully', { contractId });
    } catch (error) {
      this.logger.error('[ContractService]', 'Failed to terminate contract', error as Error, { contractId });
      throw error;
    }
  }

  // ============================================================================
  // Delete Operations
  // ============================================================================

  /**
   * Delete a contract
   */
  async deleteContract(blueprintId: string, contractId: string, actorId: string): Promise<void> {
    this.logger.info('[ContractService]', 'Deleting contract', { contractId });

    try {
      // Get contract before deletion for event metadata
      const contract = await this.getContractById(blueprintId, contractId);
      if (!contract) {
        throw new Error(`Contract not found: ${contractId}`);
      }

      // Only allow deletion of draft contracts
      if (contract.status !== 'draft') {
        throw new Error(`Cannot delete contract in status: ${contract.status}. Only draft contracts can be deleted.`);
      }

      // Delete contract
      await this.contractRepo.delete(blueprintId, contractId);

      // TODO: Emit domain event when EventBus API is updated

      this.logger.info('[ContractService]', 'Contract deleted successfully', { contractId });
    } catch (error) {
      this.logger.error('[ContractService]', 'Failed to delete contract', error as Error, { contractId });
      throw error;
    }
  }

  // ============================================================================
  // Validation Methods
  // ============================================================================

  /**
   * Validate contract creation data
   */
  private validateCreateContract(dto: CreateContractDto): void {
    if (!dto.title || dto.title.trim().length === 0) {
      throw new Error('Contract title is required');
    }

    if (dto.title.length > 200) {
      throw new Error('Contract title must be less than 200 characters');
    }

    if (!dto.owner || !dto.owner.id || !dto.owner.name) {
      throw new Error('Contract owner information is required');
    }

    if (!dto.contractor || !dto.contractor.id || !dto.contractor.name) {
      throw new Error('Contract contractor information is required');
    }

    if (!dto.totalAmount || dto.totalAmount <= 0) {
      throw new Error('Contract total amount must be greater than zero');
    }

    if (!dto.startDate || !dto.endDate) {
      throw new Error('Contract start date and end date are required');
    }

    if (dto.startDate >= dto.endDate) {
      throw new Error('Contract end date must be after start date');
    }
  }

  /**
   * Validate contract update data
   */
  private validateUpdateContract(dto: UpdateContractDto): void {
    if (dto.title !== undefined && dto.title.trim().length === 0) {
      throw new Error('Contract title cannot be empty');
    }

    if (dto.title !== undefined && dto.title.length > 200) {
      throw new Error('Contract title must be less than 200 characters');
    }

    if (dto.totalAmount !== undefined && dto.totalAmount <= 0) {
      throw new Error('Contract total amount must be greater than zero');
    }

    if (dto.startDate && dto.endDate && dto.startDate >= dto.endDate) {
      throw new Error('Contract end date must be after start date');
    }
  }

  /**
   * Validate contract is ready for activation
   */
  private validateContractForActivation(contract: Contract): void {
    if (!contract.owner || !contract.contractor) {
      throw new Error('Contract must have both owner and contractor information');
    }

    if (!contract.totalAmount || contract.totalAmount <= 0) {
      throw new Error('Contract must have a valid total amount');
    }

    if (!contract.startDate || !contract.endDate) {
      throw new Error('Contract must have start and end dates');
    }

    if (new Date(contract.startDate) >= new Date(contract.endDate)) {
      throw new Error('Contract end date must be after start date');
    }

    // Optional: Check if contract has required terms
    // if (!contract.terms || contract.terms.length === 0) {
    //   throw new Error('Contract must have terms and conditions');
    // }
  }
}
