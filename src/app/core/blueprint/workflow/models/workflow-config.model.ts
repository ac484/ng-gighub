/**
 * Workflow Config 模型定義
 *
 * 定義工作流程配置和相關類型。
 */

import type { RetryPolicy } from './workflow-handler.model';

/**
 * SETC 工作流程類型枚舉
 */
export enum SETCWorkflowType {
  /** 任務完成流程 - 任務完成 → 日誌建立 */
  TASK_COMPLETION = 'task.completion',
  /** 日誌檢驗流程 - 日誌建立 → QC 檢驗 */
  LOG_INSPECTION = 'log.inspection',
  /** QC 檢驗流程 - QC 通過/失敗 → 驗收/缺失 */
  QC_INSPECTION = 'qc.inspection',
  /** 驗收流程 - 驗收通過/失敗 → 請款/保固 */
  ACCEPTANCE = 'acceptance.process',
  /** 請款付款流程 */
  INVOICE_PAYMENT = 'finance.invoice',
  /** 保固流程 */
  WARRANTY = 'warranty.management',
  /** 缺失處理流程 */
  DEFECT_HANDLING = 'defect.handling',
  /** 問題處理流程 */
  ISSUE_HANDLING = 'issue.handling'
}

/**
 * 工作流程配置
 */
export interface WorkflowConfig {
  /** 是否啟用工作流程系統 */
  enabled: boolean;
  /** 全域重試策略 */
  globalRetryPolicy: RetryPolicy;
  /** 全域超時（毫秒） */
  globalTimeout: number;
  /** 最大並發工作流程數 */
  maxConcurrentWorkflows: number;
  /** 工作流程歷史保留數量 */
  maxWorkflowHistory: number;
  /** 各工作流程配置 */
  workflows: Partial<Record<SETCWorkflowType, WorkflowTypeConfig>>;
}

/**
 * 單一工作流程類型配置
 */
export interface WorkflowTypeConfig {
  /** 是否啟用 */
  enabled: boolean;
  /** 重試策略 */
  retryPolicy: RetryPolicy;
  /** 超時時間（毫秒） */
  timeout: number;
  /** 步驟配置 */
  steps: WorkflowStepConfig[];
  /** 描述 */
  description?: string;
}

/**
 * 工作流程步驟配置
 */
export interface WorkflowStepConfig {
  /** 步驟 ID */
  id: string;
  /** 步驟名稱 */
  name: string;
  /** 處理器 ID */
  handler: string;
  /** 執行條件（表達式） */
  condition?: string;
  /** 是否可重試 */
  retryable: boolean;
  /** 是否為關鍵步驟 */
  critical: boolean;
  /** 步驟順序 */
  order: number;
}

/**
 * 預設工作流程配置
 */
export const DEFAULT_WORKFLOW_CONFIG: WorkflowConfig = {
  enabled: true,
  globalRetryPolicy: {
    maxAttempts: 3,
    backoffMultiplier: 2,
    initialDelayMs: 1000,
    maxDelayMs: 10000
  },
  globalTimeout: 30000,
  maxConcurrentWorkflows: 100,
  maxWorkflowHistory: 1000,
  workflows: {
    [SETCWorkflowType.TASK_COMPLETION]: {
      enabled: true,
      retryPolicy: {
        maxAttempts: 3,
        backoffMultiplier: 2,
        initialDelayMs: 1000,
        maxDelayMs: 10000
      },
      timeout: 30000,
      steps: [
        {
          id: 'create-log',
          name: '建立施工日誌',
          handler: 'task-to-log-handler',
          retryable: true,
          critical: true,
          order: 1
        }
      ],
      description: '任務完成後自動建立施工日誌'
    },
    [SETCWorkflowType.LOG_INSPECTION]: {
      enabled: true,
      retryPolicy: {
        maxAttempts: 3,
        backoffMultiplier: 2,
        initialDelayMs: 1000,
        maxDelayMs: 10000
      },
      timeout: 30000,
      steps: [
        {
          id: 'create-qc',
          name: '建立 QC 待驗',
          handler: 'log-to-qc-handler',
          retryable: true,
          critical: true,
          order: 1
        }
      ],
      description: '日誌建立後自動建立 QC 待驗'
    },
    [SETCWorkflowType.QC_INSPECTION]: {
      enabled: true,
      retryPolicy: {
        maxAttempts: 3,
        backoffMultiplier: 2,
        initialDelayMs: 1000,
        maxDelayMs: 10000
      },
      timeout: 30000,
      steps: [
        {
          id: 'process-qc-result',
          name: '處理 QC 結果',
          handler: 'qc-result-handler',
          retryable: true,
          critical: true,
          order: 1
        }
      ],
      description: 'QC 檢驗結果自動化處理（驗收/缺失）'
    },
    [SETCWorkflowType.ACCEPTANCE]: {
      enabled: true,
      retryPolicy: {
        maxAttempts: 3,
        backoffMultiplier: 2,
        initialDelayMs: 1000,
        maxDelayMs: 10000
      },
      timeout: 30000,
      steps: [
        {
          id: 'process-acceptance-result',
          name: '處理驗收結果',
          handler: 'acceptance-result-handler',
          retryable: true,
          critical: true,
          order: 1
        }
      ],
      description: '驗收結果自動化處理（請款/保固）'
    }
  }
};
