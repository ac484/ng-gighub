/**
 * Type definitions for Document AI Functions
 * Enterprise-standard type safety for document processing operations
 */

import { protos } from '@google-cloud/documentai';

/**
 * Supported document MIME types for Document AI processing
 */
export const SUPPORTED_MIME_TYPES = [
  // Images
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/bmp',
  'image/tiff',
  'image/webp',
  // Documents
  'application/pdf'
  // Note: Add more MIME types as needed based on your processor capabilities
] as const;

export type SupportedMimeType = (typeof SUPPORTED_MIME_TYPES)[number];

/**
 * Document processing request from Cloud Storage
 */
export interface ProcessDocumentFromStorageRequest {
  /** GCS URI of the document (e.g., gs://bucket/path/to/file.pdf) */
  gcsUri: string;
  /** MIME type of the document */
  mimeType: SupportedMimeType;
  /** Optional: Skip human review step */
  skipHumanReview?: boolean;
  /** Optional: Field mask to control which fields to return */
  fieldMask?: string;
}

/**
 * Document processing request from raw content
 */
export interface ProcessDocumentFromContentRequest {
  /** Base64 encoded document content */
  content: string;
  /** MIME type of the document */
  mimeType: SupportedMimeType;
  /** Optional: Skip human review step */
  skipHumanReview?: boolean;
  /** Optional: Field mask to control which fields to return */
  fieldMask?: string;
}

/**
 * Batch document processing request
 */
export interface BatchProcessDocumentsRequest {
  /** Array of GCS URIs for documents to process */
  inputDocuments: Array<{
    gcsUri: string;
    mimeType: SupportedMimeType;
  }>;
  /** GCS URI prefix for output location (e.g., gs://bucket/output/) */
  outputGcsUri: string;
  /** Optional: Skip human review step */
  skipHumanReview?: boolean;
}

/**
 * Document processing result
 */
export interface DocumentProcessingResult {
  /** Extracted text from the document */
  text: string;
  /** Document pages with structured information */
  pages?: Array<{
    pageNumber: number;
    width: number;
    height: number;
    paragraphs?: string[];
    tables?: Array<{
      headerRows: string[][];
      bodyRows: string[][];
    }>;
  }>;
  /** Extracted entities (if processor supports entity extraction) */
  entities?: Array<{
    type: string;
    mentionText: string;
    confidence?: number;
    normalizedValue?: string;
  }>;
  /** Key-value pairs (if processor supports form parsing) */
  formFields?: Array<{
    fieldName: string;
    fieldValue: string;
    confidence?: number;
  }>;
  /** Processing metadata */
  metadata: {
    processorVersion: string;
    processingTime: number;
    pageCount: number;
    mimeType: string;
  };
}

/**
 * Batch processing operation result
 */
export interface BatchProcessingResult {
  /** Operation name for tracking */
  operationName: string;
  /** Operation status */
  status: 'pending' | 'running' | 'completed' | 'failed';
  /** Output GCS URI where results will be stored */
  outputGcsUri: string;
  /** Total number of documents in the batch */
  totalDocuments: number;
  /** Metadata about the operation */
  metadata?: {
    startTime: string;
    completedTime?: string;
    processedDocuments?: number;
    failedDocuments?: number;
  };
}

/**
 * Document AI event log for Firestore audit trail
 */
export interface DocumentAIEventLog {
  /** Type of operation */
  eventType: 'process_document' | 'batch_process' | 'operation_status';
  /** GCS URI or document identifier */
  documentPath: string;
  /** MIME type of the document */
  mimeType?: string;
  /** Processing status */
  status: 'success' | 'failed' | 'pending';
  /** Timestamp of the event */
  timestamp: FirebaseFirestore.Timestamp;
  /** Error message if failed */
  errorMessage?: string;
  /** User ID who initiated the operation */
  userId?: string;
  /** Additional metadata */
  metadata?: Record<string, any>;
  /** Processing duration in milliseconds */
  duration?: number;
  /** Processor information */
  processorInfo?: {
    processorId: string;
    location: string;
    projectId: string;
  };
}

/**
 * Document AI operation context for logging
 */
export interface DocumentAIOperationContext {
  /** Operation type */
  operation: string;
  /** Document path or GCS URI */
  documentPath: string;
  /** MIME type */
  mimeType?: string;
  /** User ID */
  userId?: string;
  /** Timestamp */
  timestamp: Date;
  /** Processor configuration */
  processorInfo: {
    processorId: string;
    location: string;
    projectId: string;
  };
}

/**
 * Document AI processor configuration
 */
export interface ProcessorConfig {
  /** Google Cloud Project ID */
  projectId: string;
  /** Processor location (e.g., 'us', 'eu') */
  location: string;
  /** Processor ID from Cloud Console */
  processorId: string;
  /** Optional: API endpoint override */
  apiEndpoint?: string;
}

/**
 * Validation result for document processing request
 */
export interface DocumentValidationResult {
  /** Whether the document is valid for processing */
  valid: boolean;
  /** Validation error message if invalid */
  reason?: string;
}

/**
 * Re-export Document AI types for convenience
 */
export type DocumentAIDocument = protos.google.cloud.documentai.v1.IDocument;
export type ProcessRequest = protos.google.cloud.documentai.v1.IProcessRequest;
export type ProcessResponse = protos.google.cloud.documentai.v1.IProcessResponse;
export type BatchProcessRequest = protos.google.cloud.documentai.v1.IBatchProcessRequest;
export type BatchProcessResponse = protos.google.cloud.documentai.v1.IBatchProcessResponse;
export type BatchProcessMetadata = protos.google.cloud.documentai.v1.IBatchProcessMetadata;
