/**
 * Workflow Context 模型定義
 *
 * 定義工作流程上下文和相關類型。
 */

import type { EventActor } from '../../events/models/blueprint-event.model';

/**
 * 工作流程上下文
 *
 * 在工作流程執行過程中傳遞的上下文資訊。
 */
export interface WorkflowContext {
  /** 工作流程唯一識別碼 */
  workflowId: string;
  /** 藍圖 ID */
  blueprintId: string;
  /** 發起者 */
  initiator: EventActor;
  /** 開始時間 */
  startTime: Date;
  /** 當前步驟索引 */
  currentStep: number;
  /** 總步驟數 */
  totalSteps: number;
  /** 資料儲存（用於步驟間傳遞資料） */
  data: Map<string, unknown>;
  /** 元資料 */
  metadata?: Record<string, unknown>;
  /** 相關實體 ID（例如任務 ID、合約 ID） */
  entityId?: string;
  /** 實體類型 */
  entityType?: string;
}

/**
 * 工作流程步驟結果
 */
export interface WorkflowStepResult {
  /** 步驟 ID */
  stepId: string;
  /** 是否成功 */
  success: boolean;
  /** 結果資料 */
  data?: unknown;
  /** 錯誤資訊 */
  error?: Error;
  /** 下一步驟 ID（用於動態流程） */
  nextSteps?: string[];
  /** 是否需要繼續 */
  continueWorkflow?: boolean;
}

/**
 * 工作流程狀態
 */
export interface WorkflowStatus {
  /** 工作流程 ID */
  workflowId: string;
  /** 狀態 */
  state: WorkflowState;
  /** 當前步驟 */
  currentStep: number;
  /** 總步驟數 */
  totalSteps: number;
  /** 開始時間 */
  startTime: Date;
  /** 結束時間 */
  endTime?: Date;
  /** 錯誤列表 */
  errors: WorkflowErrorInfo[];
  /** 工作流程類型 */
  workflowType?: string;
  /** 藍圖 ID */
  blueprintId?: string;
}

/**
 * 工作流程狀態枚舉
 */
export type WorkflowState = 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';

/**
 * 工作流程錯誤資訊
 */
export interface WorkflowErrorInfo {
  /** 步驟 ID */
  stepId: string;
  /** 錯誤訊息 */
  message: string;
  /** 錯誤堆疊 */
  stack?: string;
  /** 時間戳 */
  timestamp: Date;
  /** 嘗試次數 */
  attempt: number;
}

/**
 * 工作流程結果
 */
export interface WorkflowResult {
  /** 工作流程 ID */
  workflowId: string;
  /** 結果狀態 */
  status: 'success' | 'partial_success' | 'failed';
  /** 完成的步驟數 */
  completedSteps: number;
  /** 總步驟數 */
  totalSteps: number;
  /** 錯誤列表 */
  errors: WorkflowErrorInfo[];
  /** 執行時間（毫秒） */
  duration: number;
  /** 結果資料 */
  resultData?: unknown;
}
