/**
 * Contract OCR Pipeline Types
 *
 * Type definitions for the contract OCR processing pipeline.
 * SETC-012: Contract Upload & Parsing Service
 *
 * @author GigHub Development Team
 * @date 2025-12-18
 */

import { Timestamp } from 'firebase-admin/firestore';

// ===== Request/Response Types =====

/**
 * Request to process a contract file upload
 */
export interface ProcessContractUploadRequest {
  blueprintId: string;
  contractId: string;
  fileUrl: string;
  filePath: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  requestedBy: string;
}

/**
 * Response from processing a contract upload
 */
export interface ProcessContractUploadResponse {
  success: boolean;
  draftId: string;
  status: ContractDraftStatus;
  error?: string;
}

/**
 * Request to confirm a contract draft
 */
export interface ConfirmContractRequest {
  blueprintId: string;
  draftId: string;
  selectedFields: Partial<NormalizedContractData>;
  confirmedBy: string;
}

/**
 * Response from confirming a contract
 */
export interface ConfirmContractResponse {
  success: boolean;
  contractId?: string;
  error?: string;
}

// ===== Contract Draft Types =====

/**
 * Contract draft status
 */
export type ContractDraftStatus =
  | 'uploaded' // File uploaded, awaiting OCR
  | 'parsing' // OCR in progress
  | 'parsed' // OCR completed
  | 'draft' // Draft created with normalized data
  | 'user_reviewed' // User has reviewed the draft
  | 'confirmed' // Contract confirmed and created
  | 'rejected' // Draft rejected
  | 'archived' // Archived after confirmation
  | 'error'; // Error occurred

/**
 * Contract draft document stored in Firestore
 */
export interface ContractDraft {
  id: string;
  blueprintId: string;
  contractId?: string; // Set after confirmation
  status: ContractDraftStatus;
  originalFile: {
    url: string;
    path: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    uploadedAt: Timestamp;
    uploadedBy: string;
  };
  ocrResult?: OcrParseResult;
  normalizedData?: NormalizedContractData;
  userSelections?: UserSelections;
  confirmedContractId?: string;
  errorMessage?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

// ===== OCR Result Types =====

/**
 * OCR parsing result
 */
export interface OcrParseResult {
  success: boolean;
  parsedAt: Timestamp;
  engine: 'gemini' | 'vision' | 'manual';
  parsedData: ParsedContractData;
  confidence: ConfidenceScores;
  rawText?: string;
  processingTimeMs?: number;
}

/**
 * Raw parsed contract data from OCR
 */
export interface ParsedContractData {
  contractNumber?: string;
  contractTitle?: string;
  partyA?: PartyInfo;
  partyB?: PartyInfo;
  totalAmount?: number;
  currency?: string;
  startDate?: string;
  endDate?: string;
  signDate?: string;
  workItems?: ParsedWorkItem[];
  terms?: ParsedTerms;
  additionalInfo?: Record<string, unknown>;
}

/**
 * Party information
 */
export interface PartyInfo {
  name?: string;
  representative?: string;
  address?: string;
  phone?: string;
  taxId?: string;
  type?: 'owner' | 'contractor' | 'subcontractor' | 'other';
}

/**
 * Parsed work item from contract
 */
export interface ParsedWorkItem {
  itemNo?: string;
  description?: string;
  unit?: string;
  quantity?: number;
  unitPrice?: number;
  totalPrice?: number;
  notes?: string;
}

/**
 * Parsed contract terms
 */
export interface ParsedTerms {
  paymentTerms?: string;
  warrantyPeriod?: string;
  penaltyClause?: string;
  specialConditions?: string[];
}

/**
 * Confidence scores for parsed fields
 */
export interface ConfidenceScores {
  overall: number;
  fields: Record<string, number>;
}

// ===== Normalized Data Types =====

/**
 * Normalized contract data for user review
 */
export interface NormalizedContractData {
  contractNumber?: string;
  contractTitle?: string;
  owner?: NormalizedParty;
  contractor?: NormalizedParty;
  totalAmount?: number;
  currency?: string;
  startDate?: string;
  endDate?: string;
  signDate?: string;
  workItems?: NormalizedWorkItem[];
  terms?: NormalizedTerms;
}

/**
 * Normalized party information
 */
export interface NormalizedParty {
  name: string;
  representative?: string;
  address?: string;
  phone?: string;
  taxId?: string;
}

/**
 * Normalized work item
 */
export interface NormalizedWorkItem {
  id: string;
  itemNo: string;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
}

/**
 * Normalized contract terms
 */
export interface NormalizedTerms {
  paymentTerms?: string;
  warrantyPeriod?: string;
  penaltyClause?: string;
  specialConditions?: string[];
}

// ===== User Selection Types =====

/**
 * User selections during review
 */
export interface UserSelections {
  selectedFields: string[];
  modifiedFields: Record<string, unknown>;
  reviewedAt: Timestamp;
  reviewedBy: string;
  notes?: string;
}

// ===== Status Transition Types =====

/**
 * Valid status transitions
 */
export const VALID_STATUS_TRANSITIONS: Record<ContractDraftStatus, ContractDraftStatus[]> = {
  uploaded: ['parsing', 'error'],
  parsing: ['parsed', 'error'],
  parsed: ['draft', 'error'],
  draft: ['user_reviewed', 'rejected', 'error'],
  user_reviewed: ['confirmed', 'draft', 'rejected', 'error'],
  confirmed: ['archived'],
  rejected: ['uploaded', 'archived'],
  archived: [],
  error: ['uploaded', 'archived']
};

/**
 * Check if a status transition is valid
 */
export function isValidStatusTransition(from: ContractDraftStatus, to: ContractDraftStatus): boolean {
  return VALID_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}
