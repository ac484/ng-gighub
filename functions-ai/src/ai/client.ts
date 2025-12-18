/**
 * @fileOverview Google GenAI Client Configuration
 * @description Centralized configuration for @google/genai client with modern best practices
 */

import { GoogleGenAI } from '@google/genai';
import * as logger from 'firebase-functions/logger';
import { HttpsError } from 'firebase-functions/v2/https';

/**
 * Get the GenAI client instance
 * Uses API key from environment variable
 *
 * @return {GoogleGenAI} Configured GenAI client
 * @throws {HttpsError} If API key is not configured
 */
export function getGenAIClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    logger.error('GEMINI_API_KEY environment variable is not set');
    throw new HttpsError('failed-precondition', 'GEMINI_API_KEY is not configured. Please set it in Firebase Functions config.');
  }

  return new GoogleGenAI({ apiKey });
}

/**
 * Default model to use for text generation
 * Using latest Gemini 2.0 Flash model for optimal performance
 */
export const DEFAULT_TEXT_MODEL = 'gemini-2.0-flash-exp';

/**
 * Default model to use for chat
 */
export const DEFAULT_CHAT_MODEL = 'gemini-2.0-flash-exp';

/**
 * Default model to use for contract parsing with vision
 * Using Gemini 2.0 Flash for multimodal capabilities
 */
export const DEFAULT_VISION_MODEL = 'gemini-2.0-flash-exp';

/**
 * Default generation config for contract parsing
 * - Lower temperature for consistent, deterministic parsing
 * - Higher max tokens for comprehensive contract analysis
 */
export const DEFAULT_GENERATION_CONFIG = {
  temperature: 0.2, // Lower for more consistent parsing
  topP: 0.9,
  topK: 40,
  maxOutputTokens: 8192 // Support long contracts
};

/**
 * Safety settings for content generation
 * Adjust based on your use case
 */
export const DEFAULT_SAFETY_SETTINGS = [
  {
    category: 'HARM_CATEGORY_HARASSMENT',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE'
  },
  {
    category: 'HARM_CATEGORY_HATE_SPEECH',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE'
  },
  {
    category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE'
  },
  {
    category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE'
  }
];
