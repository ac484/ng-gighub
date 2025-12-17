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

// Export AI functions
export {generateText} from "./ai/generateText";
export {generateChat} from "./ai/generateChat";

// Export contract parsing functions
export {parseContract} from "./contract/parseContract";
