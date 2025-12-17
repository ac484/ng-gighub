/**
 * @fileOverview AI Types for Firebase Functions
 * @description Type definitions for AI-related Cloud Functions
 */

/**
 * AI Text Generation Request
 */
export interface AIGenerateTextRequest {
  /** The prompt text */
  prompt: string;
  /** Maximum output tokens */
  maxTokens?: number;
  /** Temperature for randomness (0-1) */
  temperature?: number;
  /** Blueprint ID for context */
  blueprintId?: string;
}

/**
 * AI Text Generation Response
 */
export interface AIGenerateTextResponse {
  /** Generated text */
  text: string;
  /** Tokens used */
  tokensUsed: number;
  /** Model used */
  model: string;
  /** Timestamp */
  timestamp: number;
}

/**
 * AI Chat Message
 */
export interface AIChatMessage {
  /** Role: user or model */
  role: 'user' | 'model';
  /** Message content */
  content: string;
}

/**
 * AI Chat Generation Request
 */
export interface AIGenerateChatRequest {
  /** Chat messages history */
  messages: AIChatMessage[];
  /** Maximum output tokens */
  maxTokens?: number;
  /** Temperature for randomness (0-1) */
  temperature?: number;
  /** Blueprint ID for context */
  blueprintId?: string;
}

/**
 * AI Chat Generation Response
 */
export interface AIGenerateChatResponse {
  /** AI response text */
  response: string;
  /** Tokens used */
  tokensUsed: number;
  /** Model used */
  model: string;
  /** Timestamp */
  timestamp: number;
}
