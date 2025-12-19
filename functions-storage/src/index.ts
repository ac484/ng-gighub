/**
 * Firebase Storage Functions
 * Enterprise-standard file management for Cloud Storage
 *
 * Based on Firebase Functions v2 API
 * Version: 1.0.0
 *
 * Features:
 * - Automated file upload processing and validation
 * - Automatic file deletion cleanup
 * - File metadata management
 * - Scheduled automated backups
 * - Comprehensive error handling and retry mechanisms
 * - Structured logging and monitoring
 * - Security validation and audit trails
 */

import { setGlobalOptions } from 'firebase-functions/v2/options';

// Set global options for all functions
setGlobalOptions({
  region: 'asia-east1',
  maxInstances: 10
});

// Export storage event handlers
export { onFileUpload } from './handlers/upload-handler';
export { onFileDeleted } from './handlers/delete-handler';

// Export callable functions
export { updateFileMetadata } from './handlers/metadata-handler';

// Export scheduled functions
export { backupFiles } from './handlers/backup-handler';
