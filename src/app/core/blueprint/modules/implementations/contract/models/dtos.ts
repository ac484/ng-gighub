/**
 * Contract Module - DTO (Data Transfer Objects) (Simplified)
 *
 * Basic DTOs for creating and updating contracts.
 *
 * @author GigHub Development Team
 * @date 2025-12-18
 */

import type { ContractParty, ContractTerm, ContractStatus, ContractLineItem, FileAttachment } from './contract.model';

/**
 * Create Contract DTO
 */
export interface CreateContractDto {
  /** Blueprint ID */
  blueprintId: string;
  /** Contract number */
  contractNumber?: string;
  /** Contract title */
  title: string;
  /** Contract description */
  description?: string;

  // Parties
  /** Owner party */
  owner: ContractParty;
  /** Contractor party */
  contractor: ContractParty;

  // Financial
  /** Total contract amount */
  totalAmount: number;
  /** Currency code */
  currency?: string;

  // Dates
  /** Contract start date */
  startDate: Date;
  /** Contract end date */
  endDate: Date;

  // Line Items
  /** Contract line items */
  lineItems?: ContractLineItem[];

  // Terms
  /** Contract terms */
  terms?: ContractTerm[];

  // Files
  /** Original contract files */
  originalFiles?: FileAttachment[];

  // User
  /** User who creates the contract */
  createdBy: string;
}

/**
 * Update Contract DTO
 */
export interface UpdateContractDto {
  /** Contract title */
  title?: string;
  /** Contract description */
  description?: string;

  // Parties
  /** Owner party */
  owner?: ContractParty;
  /** Contractor party */
  contractor?: ContractParty;

  // Financial
  /** Total contract amount */
  totalAmount?: number;
  /** Currency code */
  currency?: string;

  // Dates
  /** Contract start date */
  startDate?: Date;
  /** Contract end date */
  endDate?: Date;

  // Line Items
  /** Contract line items */
  lineItems?: ContractLineItem[];

  // Terms
  /** Contract terms */
  terms?: ContractTerm[];

  // AI Parsing
  /** Parsed contract data (JSON string) */
  parsedData?: string;

  // User
  /** User who updates the contract */
  updatedBy?: string;
}

/**
 * Contract Status Change DTO
 */
export interface ContractStatusChangeDto {
  /** New status */
  newStatus: ContractStatus;
  /** Change reason */
  reason?: string;
  /** User who changes the status */
  changedBy: string;
}
