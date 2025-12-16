/**
 * Google Generative AI Integration - Configuration
 *
 * AI 相關配置與常數定義
 */

import { defineSecret } from 'firebase-functions/params';

/**
 * Google AI API Key Secret
 * 從 Firebase Secret Manager 載入
 */
export const GOOGLE_AI_API_KEY = defineSecret('GOOGLE_AI_API_KEY');

/**
 * AI 配置常數
 */
export const AI_CONFIG = {
  /** 使用的 AI 模型 */
  model: 'gemini-2.0-flash-exp',

  /** 預設最大 token 數量 */
  defaultMaxTokens: 1000,

  /** 預設溫度參數 */
  defaultTemperature: 0.7,

  /** 最大重試次數 */
  maxRetries: 3,

  /** 請求超時時間（毫秒） */
  timeout: 30000
};
