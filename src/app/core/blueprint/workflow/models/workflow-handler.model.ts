/**
 * Workflow Handler 模型定義
 *
 * 定義工作流程處理器的介面和相關類型。
 */

import type { WorkflowContext, WorkflowStepResult } from './workflow-context.model';
import type { EnhancedBlueprintEvent, EventActor } from '../../events/models/blueprint-event.model';

/**
 * 工作流程處理器介面
 */
export interface WorkflowHandler {
  /** 處理器唯一識別碼 */
  id: string;
  /** 處理器名稱 */
  name: string;
  /** 處理器描述 */
  description?: string;
  /** 執行函式 */
  execute: (event: EnhancedBlueprintEvent, context: WorkflowContext) => Promise<WorkflowStepResult>;
  /** 驗證函式（可選） */
  validate?: (event: EnhancedBlueprintEvent) => boolean;
  /** 回滾函式（可選，用於補償交易） */
  rollback?: (context: WorkflowContext) => Promise<void>;
  /** 處理器選項 */
  options?: WorkflowHandlerOptions;
}

/**
 * 處理器選項
 */
export interface WorkflowHandlerOptions {
  /** 優先級（數字越大優先級越高） */
  priority?: number;
  /** 重試策略 */
  retryPolicy?: RetryPolicy;
  /** 超時時間（毫秒） */
  timeout?: number;
  /** 條件函式（決定是否執行此處理器） */
  condition?: (event: EnhancedBlueprintEvent) => boolean;
  /** 是否為關鍵步驟（失敗時中止整個工作流程） */
  critical?: boolean;
  /** 是否可重試 */
  retryable?: boolean;
}

/**
 * 重試策略
 */
export interface RetryPolicy {
  /** 最大重試次數 */
  maxAttempts: number;
  /** 退避倍數 */
  backoffMultiplier: number;
  /** 初始延遲（毫秒） */
  initialDelayMs: number;
  /** 最大延遲（毫秒） */
  maxDelayMs: number;
}

/**
 * 預設重試策略
 */
export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxAttempts: 3,
  backoffMultiplier: 2,
  initialDelayMs: 1000,
  maxDelayMs: 10000
};

/**
 * 工作流程錯誤
 */
export interface WorkflowError {
  /** 步驟 ID */
  stepId: string;
  /** 錯誤物件 */
  error: Error;
  /** 時間戳 */
  timestamp: Date;
  /** 嘗試次數 */
  attempt: number;
}

/**
 * 內部處理器（包含選項）
 */
export interface InternalWorkflowHandler extends WorkflowHandler {
  /** 處理器選項 */
  options?: WorkflowHandlerOptions;
}
