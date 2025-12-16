/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { setGlobalOptions } from 'firebase-functions';

import * as aiFunctions from './ai';

// Import notification triggers
export * from './notifications';

// Global options for cost control
// Per-function limits can be overridden in individual function definitions
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

// Export AI Functions
// Callable Functions for Google Generative AI integration
export const ai = {
  generateText: aiFunctions.generateText,
  generateChat: aiFunctions.generateChat
};
