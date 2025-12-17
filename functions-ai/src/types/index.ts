/**
 * Unified Contract Types for Firebase Functions
 * 
 * Consolidates all contract-related type definitions into a single source of truth.
 * Aligns with frontend Contract model and follows ⭐.md architecture principles.
 * 
 * @module types/index
 * @author GigHub Development Team
 * @date 2025-12-17
 */

// ============================================================================
// Core Contract Types
// ============================================================================

/**
 * Contract Party Information (合約方資訊)
 * 
 * Represents owner, contractor, or subcontractor details
 */
export interface ContractParty {
  /** Party name (company name) */
  name: string;
  
  /** Primary contact person */
  contactPerson: string;
  
  /** Contact phone number */
  contactPhone: string;
  
  /** Contact email address */
  contactEmail: string;
  
  /** Business address (optional) */
  address?: string;
  
  /** Tax ID / 統一編號 (optional) */
  taxId?: string;
}

/**
 * Work Item Schema (工項)
 * 
 * Represents a single work item in the contract
 */
export interface WorkItem {
  /** Work item code */
  code?: string;
  
  /** Work item title */
  title: string;
  
  /** Work item description */
  description?: string;
  
  /** Quantity */
  quantity: number;
  
  /** Unit (e.g., 式, 個, m², 公尺) */
  unit: string;
  
  /** Unit price */
  unitPrice: number;
  
  /** Total price (quantity × unitPrice) */
  totalPrice: number;
}

/**
 * Confidence Scores for Parsed Fields
 * 
 * Represents AI's confidence in extracted data (0-1 scale)
 */
export interface ConfidenceScores {
  /** Contract number confidence */
  contractNumber: number;
  
  /** Title confidence */
  title: number;
  
  /** Total amount confidence */
  totalAmount: number;
  
  /** Dates confidence (startDate, endDate, signedDate) */
  dates: number;
  
  /** Parties confidence (owner, contractor) */
  parties: number;
  
  /** Work items confidence */
  workItems: number;
  
  /** Overall confidence (average) */
  overall?: number;
}

/**
 * Contract Parsing Output (Enhanced)
 * 
 * Complete structure returned by AI parsing function.
 * Covers 60-70% of frontend Contract model fields.
 */
export interface ContractParsingOutput {
  /** Contract number / 合約編號 */
  contractNumber?: string;
  
  /** Contract title / 合約名稱 */
  title: string;
  
  /** Contract description / 合約描述 */
  description?: string;
  
  /** Total contract amount / 合約總金額 */
  totalAmount: number;
  
  /** Currency code (TWD, USD, CNY, EUR, JPY) */
  currency: 'TWD' | 'USD' | 'CNY' | 'EUR' | 'JPY';
  
  /** Contract start date (YYYY-MM-DD) */
  startDate?: string;
  
  /** Contract end date (YYYY-MM-DD) */
  endDate?: string;
  
  /** Contract signing date (YYYY-MM-DD) */
  signedDate?: string;
  
  /** Owner/Client information */
  owner: ContractParty;
  
  /** Contractor information */
  contractor: ContractParty;
  
  /** Work items list */
  workItems: WorkItem[];
  
  /** Confidence scores for each field category */
  confidenceScores: ConfidenceScores;
}

/**
 * Contract Parsing Input
 * 
 * Request payload for parseContract Cloud Function
 */
export interface ContractParsingInput {
  /** File data URI (base64 encoded) or Cloud Storage URL */
  fileDataUri: string;
  
  /** Blueprint ID for context (optional) */
  blueprintId?: string;
  
  /** Additional parsing context (optional) */
  additionalContext?: string;
}

// ============================================================================
// AI Client Types
// ============================================================================

/**
 * Retry Configuration
 * 
 * Options for exponential backoff retry logic
 */
export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  
  /** Initial delay in milliseconds (default: 1000) */
  initialDelay?: number;
  
  /** Maximum delay in milliseconds (default: 10000) */
  maxDelay?: number;
  
  /** Backoff multiplier (default: 2) */
  multiplier?: number;
}

/**
 * AI Generation Configuration
 * 
 * Model generation parameters
 */
export interface GenerationConfig {
  /** Temperature (0-2, lower = more deterministic) */
  temperature?: number;
  
  /** Maximum output tokens */
  maxOutputTokens?: number;
  
  /** Top-p sampling (0-1) */
  topP?: number;
  
  /** Top-k sampling */
  topK?: number;
}

/**
 * Retryable Error
 * 
 * Errors that should trigger retry logic
 */
export type RetryableErrorCode =
  | 'UNAVAILABLE'
  | 'DEADLINE_EXCEEDED'
  | 'RESOURCE_EXHAUSTED'
  | 'INTERNAL';

/**
 * AI Error Response
 * 
 * Structured error from AI operations
 */
export interface AIError {
  /** Error code */
  code: string;
  
  /** Error message */
  message: string;
  
  /** HTTP status code */
  status?: number;
  
  /** Additional error details */
  details?: any;
  
  /** Is error retryable */
  retryable: boolean;
}

// ============================================================================
// HTTP Error Types (Firebase Functions)
// ============================================================================

/**
 * Firebase Functions HttpsError Codes
 * 
 * Standard error codes for callable functions
 */
export type HttpsErrorCode =
  | 'ok'
  | 'cancelled'
  | 'unknown'
  | 'invalid-argument'
  | 'deadline-exceeded'
  | 'not-found'
  | 'already-exists'
  | 'permission-denied'
  | 'resource-exhausted'
  | 'failed-precondition'
  | 'aborted'
  | 'out-of-range'
  | 'unimplemented'
  | 'internal'
  | 'unavailable'
  | 'data-loss'
  | 'unauthenticated';

/**
 * Structured Error Response
 * 
 * Standard error format for all Cloud Functions
 */
export interface ErrorResponse {
  /** Error code */
  code: HttpsErrorCode;
  
  /** Error message */
  message: string;
  
  /** Additional error details */
  details?: Record<string, any>;
  
  /** Timestamp */
  timestamp: number;
  
  /** Request ID for tracing */
  requestId?: string;
}

// ============================================================================
// Legacy Types (for backward compatibility)
// ============================================================================

/**
 * @deprecated Use WorkItem instead
 * Legacy task schema from old implementation
 */
export interface TaskSchema {
  id: string;
  title: string;
  quantity: number;
  unitPrice: number;
  value: number;
  discount?: number;
  lastUpdated: string;
  completedQuantity: number;
  subTasks: TaskSchema[];
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard to check if error is retryable
 */
export function isRetryableError(error: any): boolean {
  const retryableCodes: RetryableErrorCode[] = [
    'UNAVAILABLE',
    'DEADLINE_EXCEEDED',
    'RESOURCE_EXHAUSTED',
    'INTERNAL'
  ];
  
  return retryableCodes.includes(error?.code || error?.status);
}

/**
 * Type guard to check if response is valid ContractParsingOutput
 */
export function isValidContractOutput(data: any): data is ContractParsingOutput {
  return (
    typeof data === 'object' &&
    typeof data.title === 'string' &&
    typeof data.totalAmount === 'number' &&
    typeof data.currency === 'string' &&
    typeof data.owner === 'object' &&
    typeof data.contractor === 'object' &&
    Array.isArray(data.workItems)
  );
}

/**
 * Calculate overall confidence score
 */
export function calculateOverallConfidence(scores: ConfidenceScores): number {
  const values = [
    scores.contractNumber,
    scores.title,
    scores.totalAmount,
    scores.dates,
    scores.parties,
    scores.workItems
  ];
  
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}
