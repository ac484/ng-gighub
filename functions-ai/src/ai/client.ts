/**
 * @fileOverview Google GenAI Client Configuration
 * @description Centralized configuration for @google/genai client
 */

import {GoogleGenAI} from "@google/genai";
import * as logger from "firebase-functions/logger";

/**
 * Get the GenAI client instance
 * Uses API key from environment variable
 *
 * @returns {GoogleGenAI} Configured GenAI client
 * @throws {Error} If API key is not configured
 */
export function getGenAIClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    logger.error("GEMINI_API_KEY environment variable is not set");
    throw new Error(
      "GEMINI_API_KEY is not configured. Please set it in Firebase Functions config."
    );
  }

  return new GoogleGenAI({apiKey});
}

/**
 * Default model to use for text generation
 */
export const DEFAULT_TEXT_MODEL = "gemini-2.5-flash";

/**
 * Default model to use for chat
 */
export const DEFAULT_CHAT_MODEL = "gemini-2.5-flash";

/**
 * Default model to use for contract parsing
 */
export const DEFAULT_VISION_MODEL = "gemini-2.5-flash";

/**
 * Default generation config
 */
export const DEFAULT_GENERATION_CONFIG = {
  temperature: 0.7,
  topP: 0.9,
  topK: 40,
};
