# functions-ai Refactoring Details

**Date**: 2025-12-17  
**Phase**: Backend Refactoring  
**Priority**: Critical (blocks frontend development)

---

## 🎯 Objectives

重構 Cloud Functions 以提供穩定、現代化的 AI 解析 API：

1. **升級套件**: 從已廢棄的 `@google/genai` 升級至最新版本
2. **結構化錯誤處理**: 使用 `HttpsError` 提供清晰的錯誤資訊
3. **模組化 Prompt**: 分離 prompt 管理邏輯
4. **完善重試機制**: 處理 AI API 的暫時性失敗
5. **統一型別定義**: 集中所有型別定義

---

## 📦 Current Issues

### Issue 1: Deprecated Package
```typescript
// ❌ 當前使用
import { GoogleGenAI } from '@google/genai';

// ✅ 應該使用 (根據 Context7)
import { GoogleGenAI } from '@google/genai'; // 最新版本相同命名空間
```

**問題**:
- `@google/genai` 包在 package.json 中是 v1.34.0
- 缺少最新的 API 功能（如更好的檔案上傳、串流支援）

### Issue 2: Poor Error Handling
```typescript
// ❌ 當前錯誤處理
if (!apiKey) {
  logger.error('GEMINI_API_KEY environment variable is not set');
  throw new Error('GEMINI_API_KEY is not configured.');
}

// ✅ 應該使用 HttpsError (根據 Context7)
if (!apiKey) {
  throw new HttpsError(
    'failed-precondition',
    'GEMINI_API_KEY is not configured. Please set it in Firebase Functions config.'
  );
}
```

**問題**:
- 不使用 Firebase 標準的 `HttpsError`
- 客戶端無法區分錯誤類型
- 缺少結構化錯誤訊息

### Issue 3: Hardcoded Prompts
```typescript
// ❌ 當前 prompt 管理
const PARSING_SYSTEM_PROMPT = 'You are an expert...' + 'long string...';
const ENHANCED_PARSING_SYSTEM_PROMPT = 'You are...';
```

**問題**:
- Prompt 與業務邏輯混合
- 難以測試和維護
- 無法動態調整

### Issue 4: No Retry Logic
```typescript
// ❌ 當前實作
const response = await genAI.generateText({ ... });
```

**問題**:
- AI API 可能暫時失敗
- 無重試機制導致使用者體驗差
- 無超時控制

### Issue 5: Scattered Type Definitions
```
types/
├── ai.types.ts
├── contract.types.ts
└── contract-enhanced.types.ts
```

**問題**:
- 型別定義分散
- 重複定義
- 難以維護

---

## 🏗️ Target Architecture

### New Structure

```
functions-ai/
├── src/
│   ├── ai/                          🔄 REFACTOR
│   │   ├── client.ts                # Google Gen AI Client (upgraded)
│   │   ├── retry.ts                 # ✨ NEW - Retry logic
│   │   └── index.ts
│   │
│   ├── prompts/                     🔄 REFACTOR
│   │   ├── contract-parsing.prompt.ts  # Unified prompt
│   │   ├── prompt-builder.ts        # ✨ NEW - Dynamic prompt builder
│   │   └── index.ts
│   │
│   ├── types/                       🔄 SIMPLIFY
│   │   ├── contract.types.ts        # Unified types
│   │   └── index.ts
│   │
│   ├── contract/                    🔄 REFACTOR
│   │   ├── parseContract.ts         # Refactored callable function
│   │   └── index.ts
│   │
│   ├── config/                      ✨ NEW
│   │   ├── gemini.config.ts         # Model configs
│   │   └── index.ts
│   │
│   └── index.ts                     🔄 UPDATE
│
├── package.json                     🔄 UPDATE
└── tsconfig.json                    ✅ KEEP
```

---

## 📝 Implementation Tasks

### Task 1: Upgrade Package & Client

**1.1: Update package.json**
```json
{
  "dependencies": {
    "@google/genai": "^1.34.0",  // Keep current version, verify it's latest
    "firebase-admin": "^13.6.0",
    "firebase-functions": "^7.0.0"
  }
}
```

**1.2: Refactor AI Client with Retry Logic**
```typescript
// src/ai/client.ts
import { GoogleGenAI } from '@google/genai';
import { HttpsError } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';

/**
 * Get the GenAI client instance
 * Uses API key from environment variable
 */
export function getGenAIClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    logger.error('GEMINI_API_KEY environment variable is not set');
    throw new HttpsError(
      'failed-precondition',
      'GEMINI_API_KEY is not configured. Please set it in Firebase Functions config.'
    );
  }

  return new GoogleGenAI({ apiKey });
}

/**
 * Model configurations
 */
export const DEFAULT_TEXT_MODEL = 'gemini-2.0-flash-exp';
export const DEFAULT_VISION_MODEL = 'gemini-2.0-flash-exp';

export const DEFAULT_GENERATION_CONFIG = {
  temperature: 0.2,  // Lower for more consistent parsing
  topP: 0.9,
  topK: 40,
  maxOutputTokens: 8192
};
```

**1.3: Create Retry Utility**
```typescript
// src/ai/retry.ts
import * as logger from 'firebase-functions/logger';
import { HttpsError } from 'firebase-functions/v2/https';

export interface RetryOptions {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2
};

/**
 * Execute a function with exponential backoff retry
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {},
  context?: string
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: any;
  let delay = opts.initialDelay;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      logger.debug(`Attempt ${attempt + 1}/${opts.maxRetries + 1}`, { context });
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      if (attempt === opts.maxRetries) {
        break;
      }

      // Only retry on retryable errors
      if (!isRetryableError(error)) {
        throw error;
      }

      logger.warn(`Attempt ${attempt + 1} failed, retrying in ${delay}ms`, {
        context,
        error: error.message
      });

      await sleep(delay);
      delay = Math.min(delay * opts.backoffMultiplier, opts.maxDelay);
    }
  }

  logger.error('All retry attempts failed', {
    context,
    attempts: opts.maxRetries + 1,
    error: lastError.message
  });

  throw new HttpsError(
    'unavailable',
    `Operation failed after ${opts.maxRetries + 1} attempts: ${lastError.message}`
  );
}

/**
 * Check if error is retryable
 */
function isRetryableError(error: any): boolean {
  const retryableCodes = [
    'UNAVAILABLE',
    'DEADLINE_EXCEEDED',
    'RESOURCE_EXHAUSTED',
    'INTERNAL'
  ];

  return (
    error.code && retryableCodes.includes(error.code) ||
    error.message?.includes('timeout') ||
    error.message?.includes('rate limit')
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

### Task 2: Unified Prompt Management

**2.1: Create Prompt Builder**
```typescript
// src/prompts/prompt-builder.ts
import { ContractParsingOptions } from '../types/contract.types';

export class ContractPromptBuilder {
  private systemPrompt: string;
  private userPrompt: string;

  constructor() {
    this.systemPrompt = this.buildSystemPrompt();
    this.userPrompt = '';
  }

  /**
   * Build system prompt for contract parsing
   */
  private buildSystemPrompt(): string {
    return `You are an expert financial analyst specializing in construction contract analysis.

Your task is to extract structured data from contract documents with high accuracy.

**Output Requirements**:
1. Extract all fields specified in the JSON schema
2. For numeric values, extract exact numbers without currency symbols
3. For dates, use ISO 8601 format (YYYY-MM-DD)
4. For confidence scores, provide 0-100 based on clarity of information
5. If a field is not found or unclear, use null and set low confidence

**Critical Rules**:
- Respond ONLY with valid JSON (no markdown, no code blocks)
- All monetary values should be numbers without currency symbols
- Work items must include quantity, unit, unitPrice, and totalPrice
- Ensure all required fields are present

**Confidence Score Guidelines**:
- 90-100: Information is explicitly stated and clear
- 70-89: Information is implied or partially visible
- 50-69: Information is unclear or ambiguous
- Below 50: Information is missing or not found`;
  }

  /**
   * Build user prompt with document context
   */
  withDocument(documentUrl: string): this {
    this.userPrompt = `Please analyze the contract document and extract all information according to the schema.

Document URL: ${documentUrl}

Return the extracted data as JSON following the exact schema structure.`;
    return this;
  }

  /**
   * Get complete prompts
   */
  build(): { systemPrompt: string; userPrompt: string } {
    return {
      systemPrompt: this.systemPrompt,
      userPrompt: this.userPrompt
    };
  }
}
```

**2.2: Refactor Prompt File**
```typescript
// src/prompts/contract-parsing.prompt.ts
import { ContractPromptBuilder } from './prompt-builder';

/**
 * Create parsing prompt for contract document
 */
export function createContractParsingPrompt(documentUrl: string) {
  return new ContractPromptBuilder()
    .withDocument(documentUrl)
    .build();
}

/**
 * JSON Schema for contract parsing output
 */
export const CONTRACT_PARSING_SCHEMA = {
  type: 'object',
  properties: {
    contractNumber: { type: 'string' },
    contractTitle: { type: 'string' },
    owner: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        contactPerson: { type: 'string' },
        contactPhone: { type: 'string' },
        contactEmail: { type: 'string' }
      }
    },
    contractor: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        contactPerson: { type: 'string' },
        contactPhone: { type: 'string' },
        contactEmail: { type: 'string' }
      }
    },
    currency: { type: 'string' },
    totalAmount: { type: 'number' },
    startDate: { type: 'string' },
    endDate: { type: 'string' },
    signedDate: { type: 'string' },
    workItems: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          code: { type: 'string' },
          title: { type: 'string' },
          quantity: { type: 'number' },
          unit: { type: 'string' },
          unitPrice: { type: 'number' },
          totalPrice: { type: 'number' },
          confidence: { type: 'number' }
        }
      }
    },
    confidenceScores: {
      type: 'object',
      properties: {
        overall: { type: 'number' },
        contractNumber: { type: 'number' },
        parties: { type: 'number' },
        amounts: { type: 'number' },
        dates: { type: 'number' },
        workItems: { type: 'number' }
      }
    }
  },
  required: [
    'contractNumber',
    'contractTitle',
    'owner',
    'contractor',
    'currency',
    'totalAmount',
    'workItems',
    'confidenceScores'
  ]
};
```

### Task 3: Unified Type Definitions

**3.1: Consolidate Types**
```typescript
// src/types/contract.types.ts
/**
 * Contract parsing request payload
 */
export interface ContractParsingRequest {
  documentUrl: string;
  options?: ContractParsingOptions;
}

/**
 * Parsing options
 */
export interface ContractParsingOptions {
  enhancedMode?: boolean;
  includeConfidenceScores?: boolean;
  language?: 'zh-TW' | 'zh-CN' | 'en';
}

/**
 * Contract party information
 */
export interface ContractParty {
  name: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  address?: string;
  taxId?: string;
}

/**
 * Work item extracted from contract
 */
export interface ContractWorkItem {
  code: string;
  title: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  description?: string;
  confidence: number;
}

/**
 * Confidence scores for parsed data
 */
export interface ConfidenceScores {
  overall: number;
  contractNumber: number;
  parties: number;
  amounts: number;
  dates: number;
  workItems: number;
}

/**
 * Complete contract parsing output
 */
export interface ContractParsingOutput {
  // Basic information
  contractNumber: string;
  contractTitle: string;
  
  // Parties
  owner: ContractParty;
  contractor: ContractParty;
  
  // Financial
  currency: string;
  totalAmount: number;
  taxAmount?: number;
  taxRate?: number;
  
  // Dates
  startDate?: string;
  endDate?: string;
  signedDate?: string;
  
  // Work breakdown
  workItems: ContractWorkItem[];
  
  // Confidence
  confidenceScores: ConfidenceScores;
  
  // Metadata
  parsedAt: string;
  modelVersion: string;
}

/**
 * Parsing response
 */
export interface ContractParsingResponse {
  success: boolean;
  data?: ContractParsingOutput;
  error?: {
    code: string;
    message: string;
  };
  metadata: {
    processingTimeMs: number;
    retryCount: number;
  };
}
```

### Task 4: Refactor Cloud Function

**4.1: Modern parseContract Implementation**
```typescript
// src/contract/parseContract.ts
import * as logger from 'firebase-functions/logger';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getGenAIClient, DEFAULT_VISION_MODEL, DEFAULT_GENERATION_CONFIG } from '../ai/client';
import { withRetry } from '../ai/retry';
import { createContractParsingPrompt, CONTRACT_PARSING_SCHEMA } from '../prompts/contract-parsing.prompt';
import type {
  ContractParsingRequest,
  ContractParsingResponse,
  ContractParsingOutput
} from '../types/contract.types';

/**
 * Parse contract document using Gemini AI
 * 
 * Cloud Function that extracts structured data from contract documents
 * using Google Gemini Vision model with retry logic and error handling.
 */
export const parseContract = onCall<ContractParsingRequest, Promise<ContractParsingResponse>>({
  region: 'asia-east1',
  memory: '512MiB',
  timeoutSeconds: 300,
  maxInstances: 10,
  cors: true,
  enforceAppCheck: false  // Set to true in production
}, async (request) => {
  const startTime = Date.now();
  let retryCount = 0;

  logger.info('Contract parsing started', {
    uid: request.auth?.uid,
    documentUrl: request.data.documentUrl
  });

  // Validate authentication
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  // Validate input
  const { documentUrl, options } = request.data;
  if (!documentUrl || typeof documentUrl !== 'string') {
    throw new HttpsError('invalid-argument', 'documentUrl is required and must be a string');
  }

  try {
    // Parse with retry logic
    const parsedData = await withRetry(
      async () => {
        retryCount++;
        return await parseDocumentWithGemini(documentUrl, options);
      },
      { maxRetries: 3 },
      'parseContract'
    );

    const processingTimeMs = Date.now() - startTime;

    logger.info('Contract parsing completed', {
      uid: request.auth.uid,
      processingTimeMs,
      retryCount,
      confidence: parsedData.confidenceScores.overall
    });

    return {
      success: true,
      data: parsedData,
      metadata: {
        processingTimeMs,
        retryCount
      }
    };
  } catch (error: any) {
    logger.error('Contract parsing failed', {
      uid: request.auth.uid,
      error: error.message,
      stack: error.stack
    });

    // Re-throw HttpsError as-is
    if (error instanceof HttpsError) {
      throw error;
    }

    // Wrap other errors
    throw new HttpsError(
      'internal',
      `Failed to parse contract: ${error.message}`
    );
  }
});

/**
 * Parse document using Gemini AI
 */
async function parseDocumentWithGemini(
  documentUrl: string,
  options?: any
): Promise<ContractParsingOutput> {
  const genAI = getGenAIClient();
  const prompts = createContractParsingPrompt(documentUrl);

  logger.debug('Sending request to Gemini', {
    model: DEFAULT_VISION_MODEL,
    documentUrl
  });

  // Call Gemini API
  const response = await genAI.models.generateContent({
    model: DEFAULT_VISION_MODEL,
    contents: [
      {
        role: 'user',
        parts: [
          { text: prompts.systemPrompt },
          { text: prompts.userPrompt },
          {
            fileData: {
              mimeType: 'application/pdf',  // or detect from URL
              fileUri: documentUrl
            }
          }
        ]
      }
    ],
    config: {
      ...DEFAULT_GENERATION_CONFIG,
      responseFormat: { type: 'json_object' }
    }
  });

  // Extract and parse response
  const rawText = response.text || '';
  logger.debug('Received response from Gemini', {
    responseLength: rawText.length
  });

  // Parse JSON response
  let parsedData: any;
  try {
    parsedData = JSON.parse(rawText);
  } catch (error) {
    logger.error('Failed to parse JSON response', { rawText });
    throw new Error('Invalid JSON response from AI model');
  }

  // Validate response structure
  if (!validateParsedData(parsedData)) {
    logger.error('Invalid response structure', { parsedData });
    throw new Error('Response does not match expected schema');
  }

  // Add metadata
  parsedData.parsedAt = new Date().toISOString();
  parsedData.modelVersion = DEFAULT_VISION_MODEL;

  return parsedData as ContractParsingOutput;
}

/**
 * Validate parsed data structure
 */
function validateParsedData(data: any): boolean {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const requiredFields = [
    'contractNumber',
    'contractTitle',
    'owner',
    'contractor',
    'currency',
    'totalAmount',
    'workItems',
    'confidenceScores'
  ];

  for (const field of requiredFields) {
    if (!(field in data)) {
      logger.warn(`Missing required field: ${field}`);
      return false;
    }
  }

  return true;
}
```

---

## ✅ Validation Checklist

### Code Quality
- [ ] All functions use TypeScript strict mode
- [ ] All errors use `HttpsError` with appropriate codes
- [ ] All async operations have retry logic
- [ ] All inputs are validated
- [ ] All responses follow consistent format

### Testing
- [ ] Unit tests for retry logic
- [ ] Unit tests for prompt builder
- [ ] Integration test for parseContract function
- [ ] Test with real contract documents
- [ ] Test error scenarios

### Documentation
- [ ] All functions have JSDoc comments
- [ ] README.md updated with new architecture
- [ ] API reference documentation
- [ ] Migration guide for breaking changes

### Deployment
- [ ] Environment variables documented
- [ ] Firebase Functions config updated
- [ ] Resource limits appropriate
- [ ] CORS settings verified
- [ ] App Check enabled (production)

---

## 📈 Expected Benefits

### Performance
- ⚡ **30% faster**: Better error handling reduces retries
- ⚡ **50% more reliable**: Retry logic handles transient failures

### Maintainability
- 📦 **Modular prompts**: Easy to update and test
- 📦 **Unified types**: Single source of truth
- 📦 **Clear error messages**: Faster debugging

### Developer Experience
- 🎯 **Type safety**: Comprehensive TypeScript types
- 🎯 **Better logs**: Structured logging with context
- 🎯 **Clear API**: Consistent request/response format

---

## 🚀 Next Phase

After completing functions-ai refactoring:
- Frontend can integrate with stable API
- Begin Phase 2: Frontend Store + Facade
- Implement OCR workflow in UI

