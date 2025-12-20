/**
 * Utility functions for Document AI processing
 * Enterprise-standard document validation and processing helpers
 */

import {
  SUPPORTED_MIME_TYPES,
  SupportedMimeType,
  DocumentValidationResult,
  ProcessorConfig,
  DocumentProcessingResult,
  DocumentAIDocument
} from '../types';

/**
 * Maximum document size in bytes (32MB - Document AI limit)
 */
export const MAX_DOCUMENT_SIZE = 32 * 1024 * 1024;

/**
 * Validates document before processing
 *
 * @param mimeType - Document MIME type
 * @param size - Document size in bytes
 * @returns Validation result
 */
export function validateDocument(mimeType: string, size: number): DocumentValidationResult {
  // Check MIME type
  if (!isSupportedMimeType(mimeType)) {
    return {
      valid: false,
      reason: `Unsupported MIME type: ${mimeType}. Supported types: ${SUPPORTED_MIME_TYPES.join(', ')}`
    };
  }

  // Check size
  if (size > MAX_DOCUMENT_SIZE) {
    return {
      valid: false,
      reason: `Document size ${formatFileSize(size)} exceeds maximum allowed size of ${formatFileSize(MAX_DOCUMENT_SIZE)}`
    };
  }

  if (size === 0) {
    return {
      valid: false,
      reason: 'Document is empty (0 bytes)'
    };
  }

  return { valid: true };
}

/**
 * Checks if MIME type is supported
 *
 * @param mimeType - MIME type to check
 * @returns True if supported
 */
export function isSupportedMimeType(mimeType: string): mimeType is SupportedMimeType {
  return SUPPORTED_MIME_TYPES.includes(mimeType as SupportedMimeType);
}

/**
 * Formats file size in human-readable format
 *
 * @param bytes - Size in bytes
 * @returns Formatted size string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Gets processor resource name
 *
 * @param config - Processor configuration
 * @returns Full processor resource name
 */
export function getProcessorName(config: ProcessorConfig): string {
  return `projects/${config.projectId}/locations/${config.location}/processors/${config.processorId}`;
}

/**
 * Extracts text from Document AI document
 *
 * @param document - Document AI document
 * @returns Extracted text
 */
export function extractText(document: DocumentAIDocument): string {
  return document.text || '';
}

/**
 * Extracts text from text anchor
 *
 * @param text - Full document text
 * @param textAnchor - Text anchor object
 * @returns Extracted text segment
 */
export function getTextFromAnchor(text: string, textAnchor: any): string {
  if (!textAnchor?.textSegments || textAnchor.textSegments.length === 0) {
    return '';
  }

  // First segment in document might not have startIndex property
  const startIndex = textAnchor.textSegments[0].startIndex || 0;
  const endIndex = textAnchor.textSegments[0].endIndex;

  return text.substring(startIndex, endIndex);
}

/**
 * Extracts pages from Document AI document
 *
 * @param document - Document AI document
 * @returns Array of page information
 */
export function extractPages(document: DocumentAIDocument): Array<{
  pageNumber: number;
  width: number;
  height: number;
  paragraphs?: string[];
}> {
  if (!document.pages) {
    return [];
  }

  const text = document.text || '';

  return document.pages.map((page, index) => {
    const paragraphs = page.paragraphs?.map(paragraph => getTextFromAnchor(text, paragraph.layout?.textAnchor)) || [];

    return {
      pageNumber: index + 1,
      width: page.dimension?.width || 0,
      height: page.dimension?.height || 0,
      paragraphs
    };
  });
}

/**
 * Extracts entities from Document AI document
 *
 * @param document - Document AI document
 * @returns Array of extracted entities
 */
export function extractEntities(document: DocumentAIDocument): Array<{
  type: string;
  mentionText: string;
  confidence?: number;
  normalizedValue?: string;
}> {
  if (!document.entities) {
    return [];
  }

  const text = document.text || '';

  return document.entities.map(entity => ({
    type: entity.type || 'unknown',
    mentionText: getTextFromAnchor(text, entity.textAnchor),
    confidence: entity.confidence || undefined,
    normalizedValue: entity.normalizedValue?.text || undefined
  }));
}

/**
 * Extracts form fields from Document AI document
 *
 * @param document - Document AI document
 * @returns Array of key-value pairs
 */
export function extractFormFields(document: DocumentAIDocument): Array<{
  fieldName: string;
  fieldValue: string;
  confidence?: number;
}> {
  if (!document.pages) {
    return [];
  }

  const text = document.text || '';
  const formFields: Array<{
    fieldName: string;
    fieldValue: string;
    confidence?: number;
  }> = [];

  document.pages.forEach(page => {
    if (page.formFields) {
      page.formFields.forEach(field => {
        const fieldName = getTextFromAnchor(text, field.fieldName?.textAnchor);
        const fieldValue = getTextFromAnchor(text, field.fieldValue?.textAnchor);

        formFields.push({
          fieldName,
          fieldValue,
          confidence: field.fieldValue?.confidence || undefined
        });
      });
    }
  });

  return formFields;
}

/**
 * Converts Document AI document to standardized result format
 *
 * @param document - Document AI document
 * @param processingTime - Processing duration in milliseconds
 * @param mimeType - Document MIME type
 * @returns Standardized processing result
 */
export function convertToProcessingResult(
  document: DocumentAIDocument,
  processingTime: number,
  mimeType: string
): DocumentProcessingResult {
  const text = extractText(document);
  const pages = extractPages(document);
  const entities = extractEntities(document);
  const formFields = extractFormFields(document);

  return {
    text,
    pages,
    entities: entities.length > 0 ? entities : undefined,
    formFields: formFields.length > 0 ? formFields : undefined,
    metadata: {
      processorVersion: document.revisions?.[0]?.id || 'unknown',
      processingTime,
      pageCount: document.pages?.length || 0,
      mimeType
    }
  };
}

/**
 * Validates GCS URI format
 *
 * @param uri - GCS URI to validate
 * @returns Validation result
 */
export function validateGcsUri(uri: string): DocumentValidationResult {
  const gcsPattern = /^gs:\/\/[a-z0-9][\w.-]+[a-z0-9]\/.+$/;

  if (!gcsPattern.test(uri)) {
    return {
      valid: false,
      reason: 'Invalid GCS URI format. Expected: gs://bucket-name/path/to/file'
    };
  }

  return { valid: true };
}

/**
 * Parses GCS URI into bucket and path components
 *
 * @param uri - GCS URI
 * @returns Bucket and path
 */
export function parseGcsUri(uri: string): { bucket: string; path: string } {
  const match = uri.match(/^gs:\/\/([^/]+)\/(.+)$/);

  if (!match) {
    throw new Error(`Invalid GCS URI: ${uri}`);
  }

  return {
    bucket: match[1],
    path: match[2]
  };
}

/**
 * Gets processor configuration from environment variables
 *
 * Note: When running in Firebase Cloud Functions, GCLOUD_PROJECT is automatically
 * set by the Firebase runtime. No manual configuration needed for authentication
 * or project ID - Application Default Credentials (ADC) handle authentication
 * automatically in Google Cloud environments.
 *
 * Firebase Functions v7+ Migration:
 * - Removed functions.config() API (deprecated in v7)
 * - Use environment variables directly via process.env
 * - Set via .env file or Firebase Functions environment configuration
 *
 * @returns Processor configuration
 * @throws Error if required configuration values are missing
 */
export function getProcessorConfigFromEnv(): ProcessorConfig {
  // GCLOUD_PROJECT is automatically set by Firebase Cloud Functions runtime
  // No manual configuration needed - uses Application Default Credentials (ADC)
  const projectId = process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT;
  
  // Firebase Functions v7+: Use environment variables directly
  // Set these via .env file or Firebase Functions environment configuration
  const location = process.env.DOCUMENTAI_LOCATION;
  const processorId = process.env.DOCUMENTAI_PROCESSOR_ID;
  const apiEndpoint = process.env.DOCUMENTAI_API_ENDPOINT;

  // Project ID is automatically available in Firebase Cloud Functions
  // This check is mainly for local development scenarios
  if (!projectId) {
    throw new Error('Missing GCLOUD_PROJECT environment variable (automatically set in Firebase Cloud Functions)');
  }

  if (!location) {
    throw new Error('Missing DOCUMENTAI_LOCATION environment variable (set via .env or Firebase Functions config)');
  }

  if (!processorId) {
    throw new Error('Missing DOCUMENTAI_PROCESSOR_ID environment variable (set via .env or Firebase Functions config)');
  }

  return {
    projectId,
    location,
    processorId,
    apiEndpoint
  };
}
