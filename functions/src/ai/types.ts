/**
 * Google Generative AI Integration - Type Definitions
 *
 * 定義 AI Functions 的請求與回應介面
 */

/**
 * 文字生成請求介面
 */
export interface GenerateTextRequest {
  /** 提示詞 */
  prompt: string;
  /** 最大 token 數量 */
  maxTokens?: number;
  /** 溫度參數 (0-1)，控制創造性 */
  temperature?: number;
  /** Blueprint ID（用於事件記錄） */
  blueprintId?: string;
}

/**
 * 文字生成回應介面
 */
export interface GenerateTextResponse {
  /** AI 生成的文字 */
  text: string;
  /** 使用的 token 數量 */
  tokensUsed: number;
  /** 使用的模型名稱 */
  model: string;
  /** 時間戳記 */
  timestamp: number;
}

/**
 * 對話訊息介面
 */
export interface ChatMessage {
  /** 角色：user 或 model */
  role: 'user' | 'model';
  /** 訊息內容 */
  content: string;
}

/**
 * 對話生成請求介面
 */
export interface GenerateChatRequest {
  /** 對話訊息陣列 */
  messages: ChatMessage[];
  /** 最大 token 數量 */
  maxTokens?: number;
  /** 溫度參數 (0-1)，控制創造性 */
  temperature?: number;
  /** Blueprint ID（用於事件記錄） */
  blueprintId?: string;
}

/**
 * 對話生成回應介面
 */
export interface GenerateChatResponse {
  /** AI 的回應文字 */
  response: string;
  /** 使用的 token 數量 */
  tokensUsed: number;
  /** 使用的模型名稱 */
  model: string;
  /** 時間戳記 */
  timestamp: number;
}
