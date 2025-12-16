/**
 * Google Generative AI Integration - Generate Text Function
 *
 * 單次文字生成 Callable Function
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { onCall, HttpsError } from 'firebase-functions/v2/https';

import { GOOGLE_AI_API_KEY, AI_CONFIG } from './config';
import type { GenerateTextRequest, GenerateTextResponse } from './types';

/**
 * generateText Callable Function
 *
 * 接收提示詞並使用 Google Generative AI 生成文字
 *
 * @example
 * ```typescript
 * const result = await httpsCallable(functions, 'ai-generateText')({
 *   prompt: '幫我寫一段關於施工安全的說明...'
 * });
 * ```
 */
export const generateText = onCall(
  {
    secrets: [GOOGLE_AI_API_KEY],
    maxInstances: 10,
    timeoutSeconds: 60,
    memory: '512MiB'
  },
  async (request): Promise<GenerateTextResponse> => {
    // 1. 身份驗證檢查
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated to use AI features');
    }

    // 2. 輸入驗證
    const data = request.data as GenerateTextRequest;

    if (!data.prompt || data.prompt.trim().length === 0) {
      throw new HttpsError('invalid-argument', 'Prompt is required and cannot be empty');
    }

    if (data.prompt.length > 10000) {
      throw new HttpsError('invalid-argument', 'Prompt is too long (max 10000 characters)');
    }

    try {
      // 3. 初始化 Google AI Client
      const genAI = new GoogleGenerativeAI(GOOGLE_AI_API_KEY.value());
      const model = genAI.getGenerativeModel({ model: AI_CONFIG.model });

      // 4. 設定生成參數
      const generationConfig = {
        maxOutputTokens: data.maxTokens || AI_CONFIG.defaultMaxTokens,
        temperature: data.temperature ?? AI_CONFIG.defaultTemperature
      };

      // 5. 生成內容
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: data.prompt }] }],
        generationConfig
      });

      const response = result.response;
      const text = response.text();

      // 6. 計算 tokens（估算：平均 4 字元 = 1 token）
      const tokensUsed = Math.ceil((data.prompt.length + text.length) / 4);

      // 7. 返回結果
      return {
        text,
        tokensUsed,
        model: AI_CONFIG.model,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('AI text generation failed:', error);

      // 8. 錯誤處理
      if (error instanceof Error) {
        throw new HttpsError('internal', 'Failed to generate text', {
          details: error.message
        });
      }

      throw new HttpsError('internal', 'Failed to generate text', {
        details: 'Unknown error occurred'
      });
    }
  }
);
