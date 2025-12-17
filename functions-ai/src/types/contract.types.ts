/**
 * @fileOverview Contract Parsing Types for Firebase Functions
 * @description Type definitions for contract parsing Cloud Functions
 */

/**
 * Task Schema for Work Breakdown Structure
 */
export interface TaskSchema {
  /** Unique task identifier */
  id: string;
  /** Task title */
  title: string;
  /** Quantity */
  quantity: number;
  /** Unit price */
  unitPrice: number;
  /** Total value */
  value: number;
  /** Discount amount if any */
  discount?: number;
  /** Last updated timestamp */
  lastUpdated: string;
  /** Completed quantity */
  completedQuantity: number;
  /** Sub-tasks array */
  subTasks: TaskSchema[];
}

/**
 * Contract Parsing Input
 */
export interface ContractParsingInput {
  /** File data URI (data:mimetype;base64,data) */
  fileDataUri: string;
  /** Blueprint ID */
  blueprintId?: string;
  /** Contract ID */
  contractId?: string;
}

/**
 * Contract Parsing Output
 */
export interface ContractParsingOutput {
  /** Engagement/Contract name */
  name: string;
  /** Client name */
  client: string;
  /** Total value before tax */
  totalValue: number;
  /** Tax amount */
  tax?: number;
  /** Total value with tax */
  totalValueWithTax?: number;
  /** Work Breakdown Structure */
  tasks: TaskSchema[];
}

/**
 * Contract Parsing Request
 */
export interface ContractParsingRequest {
  /** Blueprint ID */
  blueprintId: string;
  /** Contract ID */
  contractId: string;
  /** Request ID */
  requestId: string;
  /** Files to parse */
  files: FileAttachment[];
}

/**
 * File Attachment
 */
export interface FileAttachment {
  /** File ID */
  id: string;
  /** File name */
  name: string;
  /** File URL or data URI */
  url?: string;
  /** File data URI */
  dataUri?: string;
  /** MIME type */
  mimeType: string;
  /** File size in bytes */
  size: number;
}

/**
 * Contract Parsing Response
 */
export interface ContractParsingResponse {
  /** Success flag */
  success: boolean;
  /** Request ID */
  requestId: string;
  /** Parsed data if successful */
  parsedData?: ContractParsingOutput;
  /** Error message if failed */
  errorMessage?: string;
}
