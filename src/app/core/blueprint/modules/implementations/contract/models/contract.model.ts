/**
 * Contract Module - Core Data Models
 *
 * Defines the domain models for the Contract management system.
 * Contract is the foundation of SETC workflow (Phase 0).
 *
 * @author GigHub Development Team
 * @date 2025-12-15
 */

/**
 * Contract Status
 * - draft: 草稿（建立中）
 * - pending_activation: 待生效（等待確認）
 * - active: 已生效（可建立任務）
 * - completed: 已完成（所有工項完成）
 * - terminated: 已終止（提前終止）
 */
export type ContractStatus = 'draft' | 'pending_activation' | 'active' | 'completed' | 'terminated';

/**
 * Contract Party Type
 */
export type ContractPartyType = 'owner' | 'contractor' | 'subcontractor';

/**
 * Contract Party (合約方資訊)
 */
export interface ContractParty {
  /** Unique identifier */
  id: string;
  /** Party name */
  name: string;
  /** Party type */
  type: ContractPartyType;

  // Contact information
  /** Primary contact person */
  contactPerson: string;
  /** Contact phone number */
  contactPhone: string;
  /** Contact email */
  contactEmail: string;

  // Address
  /** Business address */
  address?: string;

  // Tax information
  /** Tax identification number */
  taxId?: string;
  /** Business registration number */
  businessNumber?: string;
}

/**
 * Contract Term (合約條款)
 */
export interface ContractTerm {
  /** Term identifier */
  id: string;
  /** Term category */
  category: string;
  /** Term title */
  title: string;
  /** Term content */
  content: string;
  /** Display order */
  order: number;
}

/**
 * File Attachment (檔案附件)
 */
export interface FileAttachment {
  /** File identifier */
  id: string;
  /** Original file name */
  fileName: string;
  /** File MIME type */
  fileType: string;
  /** File size in bytes */
  fileSize: number;
  /** File storage URL */
  fileUrl: string;
  /** Storage path for file operations */
  storagePath?: string;
  /** User who uploaded */
  uploadedBy: string;
  /** Upload timestamp */
  uploadedAt: Date;
}

/**
 * Contract Parsing Status
 * - pending: 等待解析
 * - processing: 解析中
 * - completed: 解析完成
 * - failed: 解析失敗
 * - skipped: 跳過解析（手動建檔）
 */
export type ContractParsingStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'skipped';

/**
 * Contract Parsing Request (解析請求)
 */
export interface ContractParsingRequest {
  /** Request identifier */
  id: string;
  /** Contract ID */
  contractId: string;
  /** Blueprint ID */
  blueprintId: string;
  /** Files to parse */
  fileIds: string[];
  /** Parsing engine preference */
  enginePreference: 'ocr' | 'ai' | 'auto';
  /** Request status */
  status: ContractParsingStatus;
  /** User who requested */
  requestedBy: string;
  /** Request timestamp */
  requestedAt: Date;
  /** Completion timestamp */
  completedAt?: Date;
  /** Error message if failed */
  errorMessage?: string;
}

/**
 * Contract Parsed Data (OCR/AI 解析資料)
 */
export interface ContractParsedData {
  /** Parsing engine used */
  parsingEngine: 'ocr' | 'ai' | 'manual';
  /** Parsing timestamp */
  parsedAt: Date;
  /** Confidence score (0-1) */
  confidence: number;
  /** Extracted data */
  extractedData: {
    contractNumber?: string;
    contractTitle?: string;
    totalAmount?: number;
    currency?: string;
    parties?: Array<Partial<ContractParty>>;
    workItems?: Array<Partial<ContractWorkItem>>;
    terms?: Array<Partial<ContractTerm>>;
    startDate?: string;
    endDate?: string;
  };
  /** Flag indicating if verification is needed */
  needsVerification: boolean;
  /** Verification status */
  verificationStatus?: 'pending' | 'confirmed' | 'modified';
  /** User who verified */
  verifiedBy?: string;
  /** Verification timestamp */
  verifiedAt?: Date;
}

/**
 * Contract Work Item (合約工項)
 */
export interface ContractWorkItem {
  /** Work item identifier */
  id: string;
  /** Parent contract ID */
  contractId: string;
  /** Work item code */
  code: string;
  /** Work item name */
  name: string;
  /** Work item description */
  description: string;
  /** Category classification */
  category?: string;

  // Quantity and pricing
  /** Unit of measurement */
  unit: string;
  /** Total quantity */
  quantity: number;
  /** Unit price */
  unitPrice: number;
  /** Total price (quantity * unitPrice) */
  totalPrice: number;

  // Task linkage
  /** IDs of tasks linked to this work item */
  linkedTaskIds?: string[];

  // Execution status
  /** Completed quantity */
  completedQuantity: number;
  /** Completed amount */
  completedAmount: number;
  /** Completion percentage (0-100) */
  completionPercentage: number;

  // Audit
  /** Creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
}

/**
 * Work Item Progress (工項進度)
 */
export interface WorkItemProgress {
  /** Completed quantity */
  completedQuantity: number;
  /** Completed amount */
  completedAmount: number;
  /** Completion percentage (0-100) */
  completionPercentage: number;
}

/**
 * Contract Status History Entry
 */
export interface ContractStatusHistory {
  /** History entry ID */
  id: string;
  /** Previous status */
  fromStatus: ContractStatus;
  /** New status */
  toStatus: ContractStatus;
  /** Change reason */
  reason?: string;
  /** User who made the change */
  changedBy: string;
  /** Change timestamp */
  changedAt: Date;
}

/**
 * Main Contract Interface
 * Represents a construction contract between parties
 */
export interface Contract {
  /** Unique identifier */
  id: string;
  /** Blueprint this contract belongs to */
  blueprintId: string;
  /** Human-readable contract number */
  contractNumber: string;
  /** Contract title */
  title: string;
  /** Contract description */
  description?: string;

  // Contract parties
  /** Owner party (甲方/業主) */
  owner: ContractParty;
  /** Contractor party (乙方/承商) */
  contractor: ContractParty;

  // Financial
  /** Total contract amount */
  totalAmount: number;
  /** Currency code (e.g., 'TWD', 'USD') */
  currency: string;

  // Work items
  /** List of work items */
  workItems: ContractWorkItem[];

  // Terms
  /** Contract terms and conditions */
  terms?: ContractTerm[];

  // Status
  /** Current contract status */
  status: ContractStatus;

  // Dates
  /** Contract signature date */
  signedDate?: Date;
  /** Contract start date */
  startDate: Date;
  /** Contract end date */
  endDate: Date;

  // Files
  /** Original contract files (PDF/images) */
  originalFiles: FileAttachment[];
  /** Parsed data from OCR/AI (if any) */
  parsedData?: ContractParsedData;

  // Audit
  /** User who created the contract */
  createdBy: string;
  /** Creation timestamp */
  createdAt: Date;
  /** User who last updated */
  updatedBy?: string;
  /** Last update timestamp */
  updatedAt: Date;
  
  // Activation tracking
  /** User who activated the contract */
  activatedBy?: string;
  /** Activation timestamp */
  activatedAt?: Date;
  
  // File attachments (additional documents beyond original contract files)
  /** Additional attachments (reports, photos, etc.) */
  attachments?: FileAttachment[];
}

/**
 * Validation Result
 */
export interface ValidationResult {
  /** Whether validation passed */
  valid: boolean;
  /** Validation errors (if any) */
  errors: string[];
  /** Validation warnings (if any) */
  warnings: string[];
}

/**
 * Work Item Progress Update
 */
export interface WorkItemProgress {
  /** Updated completed quantity */
  completedQuantity: number;
  /** Updated completed amount */
  completedAmount: number;
}

/**
 * Contract Statistics
 */
export interface ContractStatistics {
  /** Total number of contracts */
  total: number;
  /** Number of draft contracts */
  draft: number;
  /** Number of pending activation contracts */
  pendingActivation: number;
  /** Number of active contracts */
  active: number;
  /** Number of completed contracts */
  completed: number;
  /** Number of terminated contracts */
  terminated: number;
  /** Total contract value */
  totalValue: number;
  /** Active contract value */
  activeValue: number;
}

/**
 * Contract Filters
 */
export interface ContractFilters {
  /** Filter by status */
  status?: ContractStatus[];
  /** Filter by owner ID */
  ownerId?: string;
  /** Filter by contractor ID */
  contractorId?: string;
  /** Filter by start date (after) */
  startDateAfter?: Date;
  /** Filter by start date (before) */
  startDateBefore?: Date;
  /** Filter by end date (after) */
  endDateAfter?: Date;
  /** Filter by end date (before) */
  endDateBefore?: Date;
  /** Maximum number of results */
  limit?: number;
}
