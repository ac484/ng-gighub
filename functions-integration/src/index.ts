/**
 * Firebase Cloud Functions - Integration Layer
 *
 * Main entry point for all Firebase Cloud Functions.
 *
 * Import function triggers from their respective submodules:
 * - Contract OCR Pipeline (SETC-012)
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 *
 * @author GigHub Development Team
 * @date 2025-12-18
 */

import * as admin from 'firebase-admin';
import { setGlobalOptions } from 'firebase-functions';
import * as logger from 'firebase-functions/logger';

// Initialize Firebase Admin SDK
admin.initializeApp();

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

// =============================================================================
// Contract OCR Pipeline Functions (SETC-012)
// =============================================================================
// Step 2: Process contract file upload
// Step 4: Create normalized draft from OCR result
// Step 8: Confirm contract and create official document
export { processContractUpload, createParseDraft, confirmContract } from './contract';

// =============================================================================
// CWA Weather API Integration Functions
// =============================================================================
// Weather forecast functions
export {
  getForecast36Hour,
  getForecast7Day,
  getTownshipForecast
} from './weather/functions';

// Weather observation functions
export {
  getObservation,
  get10MinObservation,
  getRainfallObservation,
  getUvIndexObservation
} from './weather/functions';

// Weather alert functions
export { getWeatherWarnings } from './weather/functions';

// Utility functions
export { clearCache as clearWeatherCache } from './weather/functions';

logger.info('[functions-integration]', 'Functions loaded successfully');
