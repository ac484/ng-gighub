/**
 * Firebase Document AI Functions
 * Enterprise-standard document processing using Google Cloud Document AI
 *
 * Based on Firebase Functions v2 API and Document AI v1 API
 * Version: 1.0.0
 *
 * Features:
 * - Single document processing from Cloud Storage or raw content
 * - Batch document processing for multiple documents
 * - Automatic text extraction and OCR
 * - Entity extraction (if processor supports it)
 * - Form field extraction (if processor supports it)
 * - Comprehensive error handling and retry mechanisms
 * - Structured logging and monitoring
 * - Security validation and audit trails
 *
 * Required Secrets (set via Firebase CLI):
 * - DOCUMENTAI_LOCATION: Processor location (e.g., 'us', 'eu')
 * - DOCUMENTAI_PROCESSOR_ID: Processor ID from Cloud Console
 *
 * @see README.md for detailed usage instructions
 */

import { setGlobalOptions } from 'firebase-functions/v2/options';

// Set global options for all functions
setGlobalOptions({
  region: 'asia-east1',
  maxInstances: 10
});

// Export callable functions for document processing
export { processDocumentFromStorage, processDocumentFromContent } from './handlers/process-document-handler';

export { batchProcessDocuments } from './handlers/batch-process-handler';
