/**
 * @fileOverview Firebase Functions Entry Point
 * @description Exports all Cloud Functions for AI and Contract Parsing
 *
 * Functions:
 * - ai-generateText: Generate text from prompts
 * - ai-generateChat: Generate chat responses
 * - contract-parseContract: Parse contract documents
 */

import {setGlobalOptions} from "firebase-functions/v2";

// Set global options for all functions
setGlobalOptions({
  maxInstances: 10,
  region: "asia-east1",
});

// Import AI functions
import {generateText} from "./ai/generateText";
import {generateChat} from "./ai/generateChat";

// Import contract parsing functions
import {parseContract} from "./contract/parseContract";

// Export AI functions with 'ai-' prefix
// This matches the frontend expectation (ai-generateText, ai-generateChat)
export const ai = {
  generateText,
  generateChat,
};

// Export contract functions with 'contract-' prefix
export const contract = {
  parseContract,
};
