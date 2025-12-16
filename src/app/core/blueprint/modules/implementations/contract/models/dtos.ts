/**
 * Contract Module - DTO (Data Transfer Objects)
 *
 * Defines DTOs for creating and updating contracts and work items.
 *
 * @author GigHub Development Team
 * @date 2025-12-15
 */

import type { ContractParty, ContractTerm, ContractStatus, FileAttachment, ContractParsedData } from './contract.model';

/**
 * Create Contract DTO
 */
export interface CreateContractDto {
  /** Blueprint ID */
  blueprintId: string;
  /** Contract number (optional, auto-generated if not provided) */
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
  /** Contract signature date */
  signedDate?: Date;
  /** Contract start date */
  startDate: Date;
  /** Contract end date */
  endDate: Date;

  // Terms
  /** Contract terms */
  terms?: ContractTerm[];

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
  /** Contract signature date */
  signedDate?: Date;
  /** Contract start date */
  startDate?: Date;
  /** Contract end date */
  endDate?: Date;

  // Terms
  /** Contract terms */
  terms?: ContractTerm[];

  // Files
  /** Original contract files */
  originalFiles?: FileAttachment[];
  /** Parsed data */
  parsedData?: ContractParsedData;

  // User
  /** User who updates the contract */
  updatedBy?: string;
}

/**
 * Create Work Item DTO
 */
export interface CreateWorkItemDto {
  /** Work item code */
  code: string;
  /** Work item name */
  name: string;
  /** Work item description */
  description: string;
  /** Category */
  category?: string;

  // Quantity and pricing
  /** Unit of measurement */
  unit: string;
  /** Total quantity */
  quantity: number;
  /** Unit price */
  unitPrice: number;
}

/**
 * Update Work Item DTO
 */
export interface UpdateWorkItemDto {
  /** Work item code */
  code?: string;
  /** Work item name */
  name?: string;
  /** Work item description */
  description?: string;
  /** Category */
  category?: string;

  // Quantity and pricing
  /** Unit of measurement */
  unit?: string;
  /** Total quantity */
  quantity?: number;
  /** Unit price */
  unitPrice?: number;

  // Task linkage
  /** IDs of tasks linked to this work item */
  linkedTaskIds?: string[];
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

/**
 * Contract Party DTO (for creation)
 */
export interface CreateContractPartyDto {
  /** Party name */
  name: string;
  /** Party type */
  type: 'owner' | 'contractor' | 'subcontractor';
  /** Contact person */
  contactPerson: string;
  /** Contact phone */
  contactPhone: string;
  /** Contact email */
  contactEmail: string;
  /** Address */
  address?: string;
  /** Tax ID */
  taxId?: string;
  /** Business number */
  businessNumber?: string;
}

/**
 * File Upload DTO
 */
export interface FileUploadDto {
  /** File name */
  fileName: string;
  /** File type (MIME) */
  fileType: string;
  /** File size in bytes */
  fileSize: number;
  /** User who uploads */
  uploadedBy: string;
}
