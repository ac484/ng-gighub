/**
 * Enhanced Parsing Converter
 *
 * Converts enhanced contract parsing output from AI to Contract model DTOs.
 * Implements SETC-018 Phase 3: Frontend Service Updates.
 *
 * @author GigHub Development Team
 * @date 2025-12-17
 */

import type { CreateContractDto, CreateWorkItemDto } from '../models/dtos';
import type { ContractParty, ContractTerm } from '../models/contract.model';
import { v4 as uuidv4 } from 'uuid';

/**
 * Enhanced Contract Parsing Output (from Firebase Function)
 * Matches the structure defined in functions-ai/src/types/contract-enhanced.types.ts
 */
export interface EnhancedContractParsingOutput {
  contractNumber: string;
  title: string;
  description?: string;
  owner: ContractPartySchema;
  contractor: ContractPartySchema;
  totalAmount: number;
  currency: string;
  startDate: string;
  endDate: string;
  signedDate?: string;
  workItems: EnhancedWorkItemSchema[];
  terms?: ContractTermSchema[];
  paymentTerms?: string;
  warrantyPeriod?: string;
}

export interface ContractPartySchema {
  name: string;
  type: 'owner' | 'contractor';
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  address?: string;
  taxId?: string;
  businessNumber?: string;
}

export interface EnhancedWorkItemSchema {
  code: string;
  title: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  discount?: number;
  category?: string;
  remarks?: string;
}

export interface ContractTermSchema {
  category: string;
  title: string;
  content: string;
  order: number;
}

/**
 * Convert enhanced parsing output to CreateContractDto
 * 
 * @param enhanced - Enhanced parsing output from AI
 * @param blueprintId - Blueprint ID
 * @param createdBy - User ID who creates the contract
 * @returns CreateContractDto for contract creation
 */
export function toContractCreateRequest(
  enhanced: EnhancedContractParsingOutput,
  blueprintId: string,
  createdBy: string
): CreateContractDto {
  // Convert party schemas to ContractParty with IDs
  const owner: ContractParty = {
    id: uuidv4(),
    name: enhanced.owner.name,
    type: 'owner',
    contactPerson: enhanced.owner.contactPerson,
    contactPhone: enhanced.owner.contactPhone,
    contactEmail: enhanced.owner.contactEmail,
    address: enhanced.owner.address,
    taxId: enhanced.owner.taxId,
    businessNumber: enhanced.owner.businessNumber
  };

  const contractor: ContractParty = {
    id: uuidv4(),
    name: enhanced.contractor.name,
    type: 'contractor',
    contactPerson: enhanced.contractor.contactPerson,
    contactPhone: enhanced.contractor.contactPhone,
    contactEmail: enhanced.contractor.contactEmail,
    address: enhanced.contractor.address,
    taxId: enhanced.contractor.taxId,
    businessNumber: enhanced.contractor.businessNumber
  };

  // Convert terms
  const terms: ContractTerm[] | undefined = enhanced.terms?.map(t => ({
    id: uuidv4(),
    category: t.category,
    title: t.title,
    content: t.content,
    order: t.order
  }));

  // Parse dates
  const startDate = parseDate(enhanced.startDate);
  const endDate = parseDate(enhanced.endDate);
  const signedDate = enhanced.signedDate ? parseDate(enhanced.signedDate) : undefined;

  return {
    blueprintId,
    contractNumber: enhanced.contractNumber,
    title: enhanced.title,
    description: enhanced.description,
    owner,
    contractor,
    totalAmount: enhanced.totalAmount,
    currency: enhanced.currency || 'TWD',
    startDate,
    endDate,
    signedDate,
    terms,
    createdBy
  };
}

/**
 * Convert enhanced work item schemas to CreateWorkItemDto array
 * 
 * @param workItems - Enhanced work item schemas from AI
 * @returns Array of CreateWorkItemDto for work item creation
 */
export function toWorkItemCreateRequests(
  workItems: EnhancedWorkItemSchema[]
): CreateWorkItemDto[] {
  return workItems.map(item => ({
    code: item.code,
    name: item.title,
    description: item.description || item.title,
    unit: item.unit,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    category: item.category
  }));
}

/**
 * Parse date string (ISO 8601 format) to Date object
 * 
 * @param dateString - Date string in ISO 8601 format (YYYY-MM-DD)
 * @returns Date object
 */
function parseDate(dateString: string): Date {
  // Handle ISO 8601 format: YYYY-MM-DD
  const date = new Date(dateString);
  
  // Validate date
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date format: ${dateString}`);
  }
  
  return date;
}

/**
 * Validate enhanced parsing output
 * 
 * @param data - Data to validate
 * @returns True if data is valid EnhancedContractParsingOutput
 */
export function isEnhancedParsingOutput(data: unknown): data is EnhancedContractParsingOutput {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const obj = data as Record<string, unknown>;

  // Check critical fields
  const hasCriticalFields =
    typeof obj['contractNumber'] === 'string' &&
    typeof obj['title'] === 'string' &&
    typeof obj['totalAmount'] === 'number' &&
    typeof obj['currency'] === 'string' &&
    typeof obj['startDate'] === 'string' &&
    typeof obj['endDate'] === 'string' &&
    typeof obj['owner'] === 'object' &&
    typeof obj['contractor'] === 'object' &&
    Array.isArray(obj['workItems']);

  if (!hasCriticalFields) {
    return false;
  }

  // Validate party objects
  const owner = obj['owner'] as Record<string, unknown>;
  const contractor = obj['contractor'] as Record<string, unknown>;

  const hasValidParties =
    typeof owner['name'] === 'string' &&
    typeof owner['contactPerson'] === 'string' &&
    typeof owner['contactPhone'] === 'string' &&
    typeof owner['contactEmail'] === 'string' &&
    typeof contractor['name'] === 'string' &&
    typeof contractor['contactPerson'] === 'string' &&
    typeof contractor['contactPhone'] === 'string' &&
    typeof contractor['contactEmail'] === 'string';

  return hasValidParties;
}

/**
 * Calculate total amount from work items
 * Used for verification and validation
 * 
 * @param workItems - Array of work items
 * @returns Total amount
 */
export function calculateTotalAmount(workItems: EnhancedWorkItemSchema[]): number {
  return workItems.reduce((sum, item) => {
    const itemTotal = item.totalPrice || item.quantity * item.unitPrice;
    const discount = item.discount || 0;
    return sum + itemTotal - discount;
  }, 0);
}

/**
 * Validate financial calculations
 * 
 * @param totalAmount - Declared total amount
 * @param workItems - Array of work items
 * @param tolerance - Acceptable difference tolerance (default: 1)
 * @returns Validation result
 */
export function validateFinancialCalculation(
  totalAmount: number,
  workItems: EnhancedWorkItemSchema[],
  tolerance: number = 1
): { valid: boolean; calculatedTotal: number; difference: number } {
  const calculatedTotal = calculateTotalAmount(workItems);
  const difference = Math.abs(totalAmount - calculatedTotal);
  const valid = difference <= tolerance;

  return {
    valid,
    calculatedTotal,
    difference
  };
}
