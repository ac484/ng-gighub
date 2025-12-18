/**
 * Contract Functions Index
 *
 * Exports all contract-related Cloud Functions for the OCR pipeline.
 *
 * SETC-012: Contract Upload & Parsing Service
 *
 * @author GigHub Development Team
 * @date 2025-12-18
 */

// Step 2: Process contract file upload
export { processContractUpload } from './processContractUpload';

// Step 4: Create normalized draft from OCR result
export { createParseDraft } from './createParseDraft';

// Step 8: Confirm contract and create official document
export { confirmContract } from './confirmContract';

// Types
export * from './types';
