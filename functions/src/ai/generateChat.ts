/**
 * Google Generative AI Integration - Generate Chat Function
 *
 * 多輪對話生成 Callable Function
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { onCall, HttpsError } from 'firebase-functions/v2/https';

import { GOOGLE_AI_API_KEY, AI_CONFIG } from './config';
import type { GenerateChatRequest, GenerateChatResponse } from './types';

/**
 * generateChat Callable Function
 *
 * 接收對話訊息陣列並使用 Google Generative AI 生成回應
 * 支援多輪對話，保持上下文
 *
 * @example
 * ```typescript
 * const result = await httpsCallable(functions, 'ai-generateChat')({
 *   messages: [
 *     { role: 'user', content: '什麼是施工安全？' },
 *     { role: 'model', content: '施工安全是...' },
 *     { role: 'user', content: '有哪些重要的安全措施？' }
 *   ]
 * });
 * ```
 */
export const generateChat = onCall(
  {
    secrets: [GOOGLE_AI_API_KEY],
    maxInstances: 10,
    timeoutSeconds: 60,
    memory: '512MiB'
  },
  async (request): Promise<GenerateChatResponse> => {
    // 1. 身份驗證檢查
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated to use AI features');
    }

    // 2. 輸入驗證
    const data = request.data as GenerateChatRequest;

    if (!data.messages || data.messages.length === 0) {
      throw new HttpsError('invalid-argument', 'Messages are required and cannot be empty');
    }

    // 驗證訊息格式
    for (const msg of data.messages) {
      if (!msg.role || !msg.content) {
        throw new HttpsError('invalid-argument', 'Each message must have role and content');
      }

      if (msg.role !== 'user' && msg.role !== 'model') {
        throw new HttpsError('invalid-argument', "Message role must be 'user' or 'model'");
      }
    }

    try {
      // 3. 初始化 Google AI Client
      const genAI = new GoogleGenerativeAI(GOOGLE_AI_API_KEY.value());
      const model = genAI.getGenerativeModel({ model: AI_CONFIG.model });

      // 4. 轉換訊息格式為 Google AI 格式
      const contents = data.messages.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }]
      }));

      // 5. 設定生成參數
      const generationConfig = {
        maxOutputTokens: data.maxTokens || AI_CONFIG.defaultMaxTokens,
        temperature: data.temperature ?? AI_CONFIG.defaultTemperature
      };

      // 6. 生成對話回應
      const result = await model.generateContent({
        contents,
        generationConfig
      });

      const response = result.response;
      const responseText = response.text();

      // 7. 計算 tokens（估算：平均 4 字元 = 1 token）
      const totalText = data.messages.reduce((acc, msg) => acc + msg.content, '');
      const tokensUsed = Math.ceil((totalText.length + responseText.length) / 4);

      // 8. 返回結果
      return {
        response: responseText,
        tokensUsed,
        model: AI_CONFIG.model,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('AI chat generation failed:', error);

      // 9. 錯誤處理
      if (error instanceof Error) {
        throw new HttpsError('internal', 'Failed to generate chat response', {
          details: error.message
        });
      }

      throw new HttpsError('internal', 'Failed to generate chat response', {
        details: 'Unknown error occurred'
      });
    }
  }
);
