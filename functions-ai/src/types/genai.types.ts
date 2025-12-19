/**
 * Enterprise TypeScript types for Google GenAI integration
 * Based on @google/genai v1.34.0 SDK
 */

/**
 * Configuration for initializing GenAI client
 * Supports both Gemini Developer API and Vertex AI
 */
export interface GenAIConfig {
  /**
   * API key for Gemini Developer API (required for Gemini API)
   * Can be set via GOOGLE_API_KEY environment variable
   */
  apiKey?: string;

  /**
   * Use Vertex AI (true) or Gemini API (false)
   * Default: false (Gemini API)
   */
  vertexai?: boolean;

  /**
   * Google Cloud Project ID (required for Vertex AI)
   * Can be set via GOOGLE_CLOUD_PROJECT environment variable
   */
  project?: string;

  /**
   * Google Cloud location (required for Vertex AI)
   * Example: 'us-central1'
   * Can be set via GOOGLE_CLOUD_LOCATION environment variable
   */
  location?: string;

  /**
   * API version to use
   * Default: SDK's default (usually 'v1beta')
   * Options: 'v1', 'v1beta', 'v1alpha'
   */
  apiVersion?: string;

  /**
   * HTTP request timeout in milliseconds
   * Default: 60000 (60 seconds)
   */
  timeout?: number;
}

/**
 * Model identifiers supported by the SDK
 */
export enum GenAIModel {
  // Gemini 2.x models (latest)
  GEMINI_2_5_FLASH = 'gemini-2.5-flash',
  GEMINI_2_0_FLASH = 'gemini-2.0-flash-001',

  // Gemini 1.5 models
  GEMINI_1_5_PRO = 'gemini-1.5-pro',
  GEMINI_1_5_FLASH = 'gemini-1.5-flash',

  // Legacy models
  GEMINI_PRO = 'gemini-pro'
}

/**
 * Generation configuration for content generation
 */
export interface GenerationConfig {
  /**
   * Maximum number of tokens to generate
   * Range: 1-8192 (model dependent)
   */
  maxOutputTokens?: number;

  /**
   * Temperature for sampling
   * Range: 0.0-2.0
   * Lower = more deterministic, Higher = more creative
   */
  temperature?: number;

  /**
   * Top-p nucleus sampling
   * Range: 0.0-1.0
   */
  topP?: number;

  /**
   * Top-k sampling
   * Range: 1-40
   */
  topK?: number;

  /**
   * Stop sequences to end generation
   */
  stopSequences?: string[];

  /**
   * Response MIME type
   * Options: 'text/plain', 'application/json'
   */
  responseMimeType?: string;
}

/**
 * Function calling configuration mode
 */
export enum FunctionCallingMode {
  AUTO = 'AUTO',
  ANY = 'ANY',
  NONE = 'NONE'
}

/**
 * Function declaration for tool use
 */
export interface FunctionDeclaration {
  /**
   * Function name
   */
  name: string;

  /**
   * Function description for the model
   */
  description?: string;

  /**
   * JSON Schema for function parameters
   */
  parametersJsonSchema?: Record<string, any>;
}

/**
 * Tool configuration for function calling
 */
export interface ToolConfig {
  functionCallingConfig?: {
    mode: FunctionCallingMode;
    allowedFunctionNames?: string[];
  };
}

/**
 * Request parameters for content generation
 */
export interface GenerateContentRequest {
  /**
   * Model identifier
   */
  model: string;

  /**
   * Input content (text or structured content)
   */
  contents: string | any[];

  /**
   * Generation configuration
   */
  config?: {
    maxOutputTokens?: number;
    temperature?: number;
    topP?: number;
    topK?: number;
    stopSequences?: string[];
    tools?: Array<{ functionDeclarations: FunctionDeclaration[] }>;
    toolConfig?: ToolConfig;
  };
}

/**
 * Response from content generation
 */
export interface GenerateContentResponse {
  /**
   * Generated text content
   */
  text?: string;

  /**
   * Function calls suggested by the model
   */
  functionCalls?: Array<{
    name: string;
    args: Record<string, any>;
  }>;

  /**
   * Usage metadata
   */
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };

  /**
   * Finish reason
   */
  finishReason?: string;

  /**
   * Full response candidates
   */
  candidates?: any[];
}

/**
 * Error types for GenAI operations
 */
export enum GenAIErrorType {
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  INVALID_ARGUMENT = 'INVALID_ARGUMENT',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  RESOURCE_EXHAUSTED = 'RESOURCE_EXHAUSTED',
  MODEL_NOT_FOUND = 'MODEL_NOT_FOUND',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN = 'UNKNOWN'
}

/**
 * Custom error class for GenAI operations
 */
export class GenAIError extends Error {
  constructor(
    message: string,
    public type: GenAIErrorType,
    public statusCode?: number,
    public originalError?: any
  ) {
    super(message);
    this.name = 'GenAIError';
  }
}

/**
 * Streaming chunk from generateContentStream
 */
export interface StreamChunk {
  text?: string;
  content?: any;
  done?: boolean;
}

/**
 * Metrics for monitoring GenAI usage
 */
export interface GenAIMetrics {
  requestId: string;
  model: string;
  operation: 'generateContent' | 'generateContentStream' | 'chat';
  startTime: number;
  endTime?: number;
  duration?: number;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  success: boolean;
  errorType?: GenAIErrorType;
  errorMessage?: string;
}
