/**
 * Workflow Types
 * 工作流類型定義
 *
 * Following Occam's Razor: Simple, essential workflow management
 * Event-driven architecture using Blueprint Event Bus for module decoupling
 *
 * NOTE: This module integrates with the existing Blueprint Event Bus
 * (src/app/core/blueprint/events/event-bus.ts) as specified in the
 * Container Layer specification (.github/instructions/enterprise-angular-architecture.instructions.md).
 *
 * @author GigHub Development Team
 * @date 2025-12-11
 */

/**
 * Task Quantity Event Types
 * 任務數量事件類型
 *
 * These event types extend the Blueprint Event Bus
 * and follow the Container Layer specification.
 */
export enum TaskQuantityEventType {
  // Task Quantity Events
  TASK_QUANTITY_UPDATED = 'TASK_QUANTITY_UPDATED',
  TASK_QUANTITY_REACHED = 'TASK_QUANTITY_REACHED',
  TASK_AUTO_COMPLETED = 'TASK_AUTO_COMPLETED',
  TASK_SENT_TO_QC = 'TASK_SENT_TO_QC',

  // Log-Task Events
  LOG_TASK_ADDED = 'LOG_TASK_ADDED',
  LOG_SUBMITTED = 'LOG_SUBMITTED',

  // QC Events
  QC_CREATED = 'QC_CREATED',
  QC_ASSIGNED = 'QC_ASSIGNED',
  QC_INSPECTION_STARTED = 'QC_INSPECTION_STARTED',
  QC_PASSED = 'QC_PASSED',
  QC_REJECTED = 'QC_REJECTED',
  QC_CANCELLED = 'QC_CANCELLED'
}

/**
 * Task Quantity Reached Event Payload
 * 任務數量達標事件負載
 *
 * Used with Blueprint Event Bus:
 * eventBus.emit(TaskQuantityEventType.TASK_QUANTITY_REACHED, payload, 'task-module')
 */
export interface TaskQuantityReachedPayload {
  /** Task ID */
  taskId: string;

  /** Task title */
  taskTitle: string;

  /** Total quantity */
  totalQuantity: number;

  /** Completed quantity */
  completedQuantity: number;

  /** Unit */
  unit: string;

  /** Auto complete enabled */
  autoCompleteEnabled: boolean;

  /** Auto send to QC enabled */
  autoSendToQCEnabled: boolean;
}

/**
 * Task Sent to QC Event Payload
 * 任務送品管事件負載
 *
 * Used with Blueprint Event Bus:
 * eventBus.emit(TaskQuantityEventType.TASK_SENT_TO_QC, payload, 'task-module')
 */
export interface TaskSentToQCPayload {
  /** Task ID */
  taskId: string;

  /** Task title */
  taskTitle: string;

  /** QC ID created */
  qcId: string;

  /** Quantity to inspect */
  quantityToInspect: number;

  /** Unit */
  unit: string;
}

/**
 * QC Result Event Payload
 * 品管結果事件負載
 *
 * Used with Blueprint Event Bus:
 * eventBus.emit(TaskQuantityEventType.QC_PASSED, payload, 'qc-module')
 */
export interface QCResultPayload {
  /** QC ID */
  qcId: string;

  /** Task ID */
  taskId: string;

  /** QC Status */
  status: 'passed' | 'rejected';

  /** Inspector ID */
  inspectorId: string;

  /** Passed quantity */
  passedQuantity?: number;

  /** Rejected quantity */
  rejectedQuantity?: number;

  /** Notes */
  notes?: string;
}

/**
 * Workflow Rule
 * 工作流規則
 *
 * Defines automated actions triggered by Blueprint Event Bus events.
 * Rules are registered with the WorkflowService which subscribes to
 * the Blueprint Event Bus.
 *
 * @example
 * ```typescript
 * const rule: WorkflowRule<TaskQuantityReachedPayload> = {
 *   id: 'auto-complete-task',
 *   name: 'Auto Complete Task on Quantity Reached',
 *   triggerEvent: TaskQuantityEventType.TASK_QUANTITY_REACHED,
 *   condition: (event) => event.payload.autoCompleteEnabled,
 *   action: async (event) => {
 *     await taskService.updateStatus(event.payload.taskId, 'completed');
 *   },
 *   enabled: true,
 *   priority: 10
 * };
 * ```
 */
export interface WorkflowRule<T = any> {
  /** Rule ID */
  id: string;

  /** Rule name */
  name: string;

  /** Trigger event type (from TaskQuantityEventType) */
  triggerEvent: string;

  /** Condition function - receives Blueprint Event */
  condition: (event: { type: string; payload: T; source: string }) => boolean;

  /** Action to execute - receives Blueprint Event */
  action: (event: { type: string; payload: T; source: string }) => Promise<void>;

  /** Is enabled */
  enabled: boolean;

  /** Priority (higher executes first) */
  priority?: number;
}

/**
 * Workflow Execution Result
 * 工作流執行結果
 *
 * Returned after processing an event through workflow rules.
 */
export interface WorkflowExecutionResult {
  /** Success */
  success: boolean;

  /** Rules executed count */
  rulesExecuted: number;

  /** Errors encountered */
  errors?: Error[];

  /** Execution time (ms) */
  executionTime: number;

  /** Results from each rule */
  ruleResults?: Array<{
    ruleId: string;
    success: boolean;
    error?: Error;
  }>;
}

/**
 * Log Task Added Event Payload
 * 日誌任務新增事件負載
 */
export interface LogTaskAddedPayload {
  /** Log ID */
  logId: string;

  /** Task ID */
  taskId: string;

  /** Task title */
  taskTitle: string;

  /** Quantity completed */
  quantityCompleted: number;

  /** Unit */
  unit: string;

  /** Actor ID */
  actorId: string;
}

/**
 * Task Quantity Updated Event Payload
 * 任務數量更新事件負載
 */
export interface TaskQuantityUpdatedPayload {
  /** Task ID */
  taskId: string;

  /** Previous quantity */
  previousQuantity: number;

  /** New quantity */
  newQuantity: number;

  /** Quantity delta */
  quantityDelta: number;

  /** Source of update */
  source: 'log' | 'qc' | 'manual';

  /** Source ID (log_id, qc_id, etc.) */
  sourceId?: string;
}
