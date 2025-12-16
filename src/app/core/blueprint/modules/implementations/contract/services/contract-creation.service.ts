/**
 * Contract Creation Service
 *
 * Handles contract creation workflow, data validation,
 * and auto-generation of contract numbers.
 *
 * @author GigHub Development Team
 * @date 2025-12-15
 */

import { Injectable, inject, signal } from '@angular/core';
import { LoggerService } from '@core';
import { firstValueFrom } from 'rxjs';

import type { Contract, ContractParty, ContractWorkItem, ValidationResult, CreateContractDto, CreateWorkItemDto } from '../models';
import { ContractRepository } from '../repositories/contract.repository';
import { ContractWorkItemRepository } from '../repositories/work-item.repository';

/**
 * Work item totals calculation result
 */
export interface WorkItemTotals {
  totalQuantity: number;
  totalAmount: number;
  itemCount: number;
}

@Injectable({ providedIn: 'root' })
export class ContractCreationService {
  private readonly contractRepository = inject(ContractRepository);
  private readonly workItemRepository = inject(ContractWorkItemRepository);
  private readonly logger = inject(LoggerService);

  // Service state signals
  private _creating = signal(false);
  private _error = signal<string | null>(null);

  // Public readonly signals
  creating = this._creating.asReadonly();
  error = this._error.asReadonly();

  /**
   * Create a new draft contract
   */
  async createDraft(blueprintId: string, data: CreateContractDto): Promise<Contract> {
    try {
      this._creating.set(true);
      this._error.set(null);

      // Validate contract data
      const validation = this.validateContractData(data);
      if (!validation.valid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Generate contract number if not provided
      const contractNumber = data.contractNumber || (await this.generateContractNumber(blueprintId));

      // Ensure contract number is unique
      const isUnique = await this.isContractNumberUnique(blueprintId, contractNumber);
      if (!isUnique) {
        throw new Error(`Contract number ${contractNumber} already exists`);
      }

      // Create the contract
      const contractData: CreateContractDto = {
        ...data,
        contractNumber
      };

      const contract = await this.contractRepository.create(blueprintId, contractData);

      this.logger.info('[ContractCreationService]', `Draft contract created: ${contract.id}`);
      return contract;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create draft contract';
      this._error.set(message);
      this.logger.error('[ContractCreationService]', 'createDraft failed', error as Error);
      throw error;
    } finally {
      this._creating.set(false);
    }
  }

  /**
   * Create a contract with work items in one operation
   */
  async createWithWorkItems(
    blueprintId: string,
    contractData: CreateContractDto,
    workItems: CreateWorkItemDto[]
  ): Promise<{ contract: Contract; workItems: ContractWorkItem[] }> {
    try {
      this._creating.set(true);
      this._error.set(null);

      // Validate contract data
      const contractValidation = this.validateContractData(contractData);
      if (!contractValidation.valid) {
        throw new Error(`Contract validation failed: ${contractValidation.errors.join(', ')}`);
      }

      // Validate work items
      for (let i = 0; i < workItems.length; i++) {
        const itemValidation = this.validateWorkItemData(workItems[i]);
        if (!itemValidation.valid) {
          throw new Error(`Work item ${i + 1} validation failed: ${itemValidation.errors.join(', ')}`);
        }
      }

      // Validate work items total matches contract amount
      const totals = this.calculateWorkItemTotals(workItems);
      if (Math.abs(totals.totalAmount - contractData.totalAmount) > 0.01) {
        throw new Error(`Work items total (${totals.totalAmount}) must equal contract amount (${contractData.totalAmount})`);
      }

      // Create the contract
      const contract = await this.createDraft(blueprintId, contractData);

      // Create work items
      const createdWorkItems: ContractWorkItem[] = [];
      for (const item of workItems) {
        const workItem = await this.workItemRepository.create(blueprintId, contract.id, item);
        createdWorkItems.push(workItem);
      }

      this.logger.info('[ContractCreationService]', `Contract created with ${createdWorkItems.length} work items: ${contract.id}`);

      return { contract, workItems: createdWorkItems };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create contract with work items';
      this._error.set(message);
      this.logger.error('[ContractCreationService]', 'createWithWorkItems failed', error as Error);
      throw error;
    } finally {
      this._creating.set(false);
    }
  }

  /**
   * Validate contract creation data
   */
  validateContractData(data: CreateContractDto): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!data.title?.trim()) {
      errors.push('Contract title is required');
    } else if (data.title.length > 200) {
      errors.push('Contract title must be 200 characters or less');
    }

    if (!data.blueprintId) {
      errors.push('Blueprint ID is required');
    }

    // Owner validation
    const ownerValidation = this.validateContractParty(data.owner, 'Owner');
    errors.push(...ownerValidation.errors);
    warnings.push(...ownerValidation.warnings);

    // Contractor validation
    const contractorValidation = this.validateContractParty(data.contractor, 'Contractor');
    errors.push(...contractorValidation.errors);
    warnings.push(...contractorValidation.warnings);

    // Amount validation
    if (data.totalAmount === undefined || data.totalAmount === null) {
      errors.push('Contract amount is required');
    } else if (data.totalAmount <= 0) {
      errors.push('Contract amount must be greater than 0');
    } else if (data.totalAmount > 999999999999) {
      errors.push('Contract amount exceeds maximum allowed');
    }

    // Date validation
    if (!data.startDate) {
      errors.push('Start date is required');
    }
    if (!data.endDate) {
      errors.push('End date is required');
    }
    if (data.startDate && data.endDate) {
      if (data.startDate >= data.endDate) {
        errors.push('End date must be after start date');
      }

      const durationDays = Math.ceil((data.endDate.getTime() - data.startDate.getTime()) / (1000 * 60 * 60 * 24));
      if (durationDays < 1) {
        errors.push('Contract duration must be at least 1 day');
      }

      // Check for unreasonably long contracts
      if (durationDays > 3650) {
        warnings.push('Contract duration exceeds 10 years');
      }
    }

    // Signed date validation
    if (data.signedDate && data.startDate) {
      if (data.signedDate > data.startDate) {
        warnings.push('Signed date is after start date');
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate contract party data
   */
  validateContractParty(party: ContractParty | undefined, partyType: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!party) {
      errors.push(`${partyType} information is required`);
      return { valid: false, errors, warnings };
    }

    if (!party.name?.trim()) {
      errors.push(`${partyType} name is required`);
    }

    if (!party.contactPerson?.trim()) {
      errors.push(`${partyType} contact person is required`);
    }

    if (!party.contactPhone?.trim()) {
      errors.push(`${partyType} contact phone is required`);
    } else if (!this.isValidPhoneNumber(party.contactPhone)) {
      warnings.push(`${partyType} phone number format may be invalid`);
    }

    if (!party.contactEmail?.trim()) {
      errors.push(`${partyType} contact email is required`);
    } else if (!this.isValidEmail(party.contactEmail)) {
      errors.push(`${partyType} email format is invalid`);
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate contract amount against work items
   */
  validateContractAmount(totalAmount: number, workItems: CreateWorkItemDto[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const totals = this.calculateWorkItemTotals(workItems);

    if (workItems.length === 0) {
      warnings.push('No work items provided');
      return { valid: true, errors, warnings };
    }

    const difference = Math.abs(totals.totalAmount - totalAmount);
    if (difference > 0.01) {
      errors.push(`Work items total (${totals.totalAmount.toFixed(2)}) does not match contract amount (${totalAmount.toFixed(2)})`);
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate work item data
   */
  validateWorkItemData(item: CreateWorkItemDto): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!item.code?.trim()) {
      errors.push('Work item code is required');
    }

    if (!item.name?.trim()) {
      errors.push('Work item name is required');
    }

    if (!item.unit?.trim()) {
      errors.push('Work item unit is required');
    }

    if (item.quantity === undefined || item.quantity <= 0) {
      errors.push('Work item quantity must be greater than 0');
    }

    if (item.unitPrice === undefined || item.unitPrice < 0) {
      errors.push('Work item unit price must be 0 or greater');
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * Generate a new contract number
   * Format: CON-{YYYYMMDD}-{序號}
   */
  async generateContractNumber(blueprintId: string): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

    // Try to find existing contracts with today's date prefix
    const contracts = await firstValueFrom(this.contractRepository.findByBlueprint(blueprintId));

    const todayPrefix = `CON-${dateStr}-`;
    const todayContracts = contracts.filter(c => c.contractNumber.startsWith(todayPrefix));

    let sequence = 1;
    if (todayContracts.length > 0) {
      // Find the highest sequence number
      const sequences = todayContracts.map(c => {
        const parts = c.contractNumber.split('-');
        return parts.length === 3 ? parseInt(parts[2], 10) : 0;
      });
      sequence = Math.max(...sequences) + 1;
    }

    return `${todayPrefix}${sequence.toString().padStart(3, '0')}`;
  }

  /**
   * Calculate totals from work items
   */
  calculateWorkItemTotals(workItems: CreateWorkItemDto[]): WorkItemTotals {
    let totalQuantity = 0;
    let totalAmount = 0;

    for (const item of workItems) {
      totalQuantity += item.quantity || 0;
      totalAmount += (item.quantity || 0) * (item.unitPrice || 0);
    }

    return {
      totalQuantity,
      totalAmount,
      itemCount: workItems.length
    };
  }

  /**
   * Check if contract number is unique within blueprint
   */
  private async isContractNumberUnique(blueprintId: string, contractNumber: string): Promise<boolean> {
    const contracts = await firstValueFrom(this.contractRepository.findByBlueprint(blueprintId));
    return !contracts.some(c => c.contractNumber === contractNumber);
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone number format (basic check)
   */
  private isValidPhoneNumber(phone: string): boolean {
    // Allow digits, spaces, dashes, parentheses, plus sign
    const phoneRegex = /^[\d\s\-()+ ]{7,20}$/;
    return phoneRegex.test(phone);
  }
}
