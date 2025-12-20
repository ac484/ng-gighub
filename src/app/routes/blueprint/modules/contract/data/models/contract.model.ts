/**
 * Contract Module - Core Data Models (Simplified)
 *
 * Basic domain models for Contract management system.
 *
 * @author GigHub Development Team
 * @date 2025-12-18
 */

/**
 * Contract Status
 * - draft: 草稿（建立中）
 * - pending_activation: 待生效（等待確認）
 * - active: 已生效（可建立任務）
 * - completed: 已完成
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
 * Contract Line Item (合約細項)
 * Detailed breakdown of contract items
 */
export interface ContractLineItem {
  /** Line item identifier */
  id: string;
  /** 號碼 - Item number for ordering */
  itemNumber: number;
  /** 項次 - Item sequence/code */
  itemCode: string;
  /** 名稱 - Item name/description */
  name: string;
  /** 數量 - Quantity */
  quantity: number;
  /** 單位 - Unit of measurement (e.g., '個', '件', '式', 'm²') */
  unit: string;
  /** 單價 - Unit price */
  unitPrice: number;
  /** 金額 - Amount (quantity × unitPrice) */
  amount: number;
  /** 折扣 - Discount percentage (0-100) */
  discountPercent?: number;
  /** 小記 - Subtotal after discount */
  subtotal: number;
  /** 備註 - Notes/remarks */
  remarks?: string;
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
  /** Total value of all contracts */
  totalValue: number;
  /** Total value of active contracts */
  activeValue: number;
}

/**
 * Main Contract Interface (Simplified)
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

  // Line Items (細項)
  /** Contract line items - detailed breakdown */
  lineItems?: ContractLineItem[];

  // Terms
  /** Contract terms and conditions */
  terms?: ContractTerm[];

  // Status
  /** Current contract status */
  status: ContractStatus;

  // Dates
  /** Contract signature date */
  signingDate: Date;
  /** Contract start date */
  startDate: Date;
  /** Contract end date */
  endDate: Date;

  // Files
  /** Original contract files (PDF/images) */
  originalFiles: FileAttachment[];

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

  // File attachments (additional documents)
  /** Additional attachments (reports, photos, etc.) */
  attachments?: FileAttachment[];

  // AI-parsed data
  /** Parsed contract data from AI document processing */
  parsedData?: string; // JSON string of ParsedContractData, stored separately to avoid large documents
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
