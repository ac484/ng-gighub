/**
 * Parsed Contract Data Model
 *
 * Represents structured data extracted from contract documents
 * using AI document processing (functions-ai-document)
 *
 * @author GigHub Development Team
 * @date 2025-12-19
 */

/**
 * Confidence level for extracted data
 */
export type ConfidenceLevel = 'high' | 'medium' | 'low';

/**
 * Extracted party information
 */
export interface ExtractedPartyInfo {
  /** Party name */
  name?: string;
  /** Tax ID / Business registration */
  taxId?: string;
  /** Contact person */
  contactPerson?: string;
  /** Phone number */
  phone?: string;
  /** Email address */
  email?: string;
  /** Address */
  address?: string;
  /** Extraction confidence */
  confidence: ConfidenceLevel;
}

/**
 * Extracted financial information
 */
export interface ExtractedFinancialInfo {
  /** Total amount */
  totalAmount?: number;
  /** Currency */
  currency?: string;
  /** Payment terms */
  paymentTerms?: string;
  /** Extraction confidence */
  confidence: ConfidenceLevel;
}

/**
 * Extracted date information
 */
export interface ExtractedDateInfo {
  /** Signing date */
  signingDate?: Date;
  /** Start date */
  startDate?: Date;
  /** End date */
  endDate?: Date;
  /** Extraction confidence */
  confidence: ConfidenceLevel;
}

/**
 * Extracted line item from contract
 */
export interface ExtractedLineItem {
  /** Item number */
  itemNumber?: number;
  /** Item code */
  itemCode?: string;
  /** Item name */
  name?: string;
  /** Quantity */
  quantity?: number;
  /** Unit */
  unit?: string;
  /** Unit price */
  unitPrice?: number;
  /** Amount */
  amount?: number;
  /** Remarks */
  remarks?: string;
  /** Extraction confidence */
  confidence: ConfidenceLevel;
}

/**
 * Extracted text section from contract
 */
export interface ExtractedTextSection {
  /** Section title */
  title: string;
  /** Section content */
  content: string;
  /** Page number */
  pageNumber?: number;
  /** Extraction confidence */
  confidence: ConfidenceLevel;
}

/**
 * Parsed Contract Data
 *
 * Structured data extracted from contract document using AI
 */
export interface ParsedContractData {
  /** Parse session ID */
  id: string;

  /** Source file reference */
  sourceFileId: string;

  /** Parse timestamp */
  parsedAt: Date;

  /** Parse status */
  status: 'pending' | 'processing' | 'completed' | 'failed';

  /** Overall confidence score (0-100) */
  confidenceScore: number;

  // Extracted structured data
  /** Contract number */
  contractNumber?: string;

  /** Contract title */
  title?: string;

  /** Owner/Party A information */
  owner?: ExtractedPartyInfo;

  /** Contractor/Party B information */
  contractor?: ExtractedPartyInfo;

  /** Financial information */
  financial?: ExtractedFinancialInfo;

  /** Date information */
  dates?: ExtractedDateInfo;

  /** Extracted line items */
  lineItems?: ExtractedLineItem[];

  /** Extracted text sections (terms, clauses, etc.) */
  textSections?: ExtractedTextSection[];

  /** Full extracted text (raw) */
  fullText?: string;

  // Metadata
  /** Page count */
  pageCount?: number;

  /** Processing time in milliseconds */
  processingTime?: number;

  /** Error message if parsing failed */
  errorMessage?: string;

  /** Warnings during parsing */
  warnings?: string[];

  // User actions
  /** Has user reviewed and approved the parsed data */
  isReviewed: boolean;

  /** User who reviewed */
  reviewedBy?: string;

  /** Review timestamp */
  reviewedAt?: Date;

  /** User notes on parsed data */
  notes?: string;
}

/**
 * Parse request for AI document processing
 */
export interface ParseContractRequest {
  /** File ID to parse */
  fileId: string;

  /** Storage path of file */
  storagePath: string;

  /** File name */
  fileName: string;

  /** Optional: specify document type for better parsing */
  documentType?: 'construction_contract' | 'general_contract' | 'service_agreement';

  /** Optional: language hint */
  languageHint?: 'zh-TW' | 'zh-CN' | 'en-US';
}

/**
 * Parse result from AI document processing
 */
export interface ParseContractResult {
  /** Parse session ID */
  parseId: string;

  /** Parsed data */
  data: ParsedContractData;

  /** Success status */
  success: boolean;

  /** Error message if failed */
  error?: string;
}
