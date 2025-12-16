/**
 * SETC Workflow Orchestrator Interface
 *
 * 定義工作流程編排器的公開介面。
 */

import type { WorkflowContext, WorkflowResult, WorkflowStatus } from './models/workflow-context.model';
import type { WorkflowHandler, WorkflowHandlerOptions } from './models/workflow-handler.model';
import type { EnhancedBlueprintEvent } from '../events/models/blueprint-event.model';
import type { SystemEventType } from '../events/types/system-event-type.enum';

/**
 * SETC 工作流程編排器介面
 */
export interface ISETCWorkflowOrchestrator {
  /**
   * 初始化工作流程編排器
   *
   * @param blueprintId - 藍圖 ID
   */
  initialize(blueprintId: string): void;

  /**
   * 註冊工作流程處理器
   *
   * @param eventType - 事件類型
   * @param handler - 處理器
   * @param options - 選項
   */
  registerHandler(eventType: SystemEventType | string, handler: WorkflowHandler, options?: WorkflowHandlerOptions): void;

  /**
   * 取消註冊處理器
   *
   * @param eventType - 事件類型
   * @param handlerId - 處理器 ID
   */
  unregisterHandler(eventType: SystemEventType | string, handlerId: string): void;

  /**
   * 執行工作流程
   *
   * @param workflowName - 工作流程名稱
   * @param context - 上下文
   * @returns 工作流程結果
   */
  executeWorkflow(workflowName: string, context: WorkflowContext): Promise<WorkflowResult>;

  /**
   * 取得工作流程狀態
   *
   * @param workflowId - 工作流程 ID
   * @returns 工作流程狀態
   */
  getWorkflowStatus(workflowId: string): WorkflowStatus | undefined;

  /**
   * 暫停工作流程
   *
   * @param workflowId - 工作流程 ID
   */
  pauseWorkflow(workflowId: string): void;

  /**
   * 恢復工作流程
   *
   * @param workflowId - 工作流程 ID
   */
  resumeWorkflow(workflowId: string): void;

  /**
   * 取消工作流程
   *
   * @param workflowId - 工作流程 ID
   */
  cancelWorkflow(workflowId: string): void;

  /**
   * 取得所有工作流程狀態
   *
   * @returns 工作流程狀態列表
   */
  getAllWorkflowStatuses(): WorkflowStatus[];

  /**
   * 取得統計資訊
   */
  getStatistics(): WorkflowOrchestratorStatistics;

  /**
   * 釋放資源
   */
  dispose(): void;
}

/**
 * 工作流程編排器統計資訊
 */
export interface WorkflowOrchestratorStatistics {
  /** 總工作流程數 */
  totalWorkflows: number;
  /** 進行中的工作流程數 */
  runningWorkflows: number;
  /** 已完成的工作流程數 */
  completedWorkflows: number;
  /** 失敗的工作流程數 */
  failedWorkflows: number;
  /** 已取消的工作流程數 */
  cancelledWorkflows: number;
  /** 暫停中的工作流程數 */
  pausedWorkflows: number;
  /** 註冊的處理器數量 */
  registeredHandlers: number;
  /** 最後執行時間 */
  lastExecutionTime: Date | null;
}
