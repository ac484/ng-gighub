/**
 * SETC Workflow Orchestrator Service
 *
 * 工作流程編排器服務，負責管理和執行跨模組的事件驅動自動化流程。
 *
 * 功能：
 * - 事件處理器註冊與管理
 * - 工作流程執行與狀態追蹤
 * - 重試機制（Exponential Backoff）
 * - 暫停/恢復/取消工作流程
 * - 錯誤處理與日誌記錄
 *
 * @example
 * ```typescript
 * // 注入服務
 * private orchestrator = inject(SETCWorkflowOrchestratorService);
 *
 * // 初始化
 * this.orchestrator.initialize('blueprint-123');
 *
 * // 註冊處理器
 * this.orchestrator.registerHandler(
 *   SystemEventType.TASK_COMPLETED,
 *   {
 *     id: 'task-to-log-handler',
 *     name: '任務完成建立日誌',
 *     execute: async (event, context) => {
 *       // 建立日誌邏輯
 *       return { stepId: 'create-log', success: true };
 *     }
 *   }
 * );
 * ```
 */

import { Injectable, inject, signal, type WritableSignal, Injector, runInInjectionContext } from '@angular/core';

import { EnhancedEventBusService } from '../events/enhanced-event-bus.service';
import { AcceptanceFinalizedHandler } from './handlers/acceptance-finalized.handler';
import { LogCreatedHandler } from './handlers/log-created.handler';
import { QCFailedHandler } from './handlers/qc-failed.handler';
import { QCPassedHandler } from './handlers/qc-passed.handler';
import { TaskCompletedHandler } from './handlers/task-completed.handler';
import { DEFAULT_WORKFLOW_CONFIG, SETCWorkflowType, type WorkflowConfig } from './models/workflow-config.model';
import type {
  WorkflowContext,
  WorkflowResult,
  WorkflowStatus,
  WorkflowErrorInfo,
  WorkflowStepResult
} from './models/workflow-context.model';
import type { WorkflowHandler, WorkflowHandlerOptions, RetryPolicy, InternalWorkflowHandler } from './models/workflow-handler.model';
import { DEFAULT_RETRY_POLICY } from './models/workflow-handler.model';
import type { ISETCWorkflowOrchestrator, WorkflowOrchestratorStatistics } from './setc-workflow-orchestrator.interface';
import type { EnhancedBlueprintEvent, EventActor } from '../events/models/blueprint-event.model';
import { SystemEventType } from '../events/types/system-event-type.enum';

@Injectable({ providedIn: 'root' })
export class SETCWorkflowOrchestratorService implements ISETCWorkflowOrchestrator {
  // ===== 依賴注入 =====
  private readonly eventBus = inject(EnhancedEventBusService);
  private readonly injector = inject(Injector);

  // ===== 內部狀態 =====
  /** 處理器註冊表 */
  private readonly handlers = new Map<string, InternalWorkflowHandler[]>();

  /** 工作流程狀態表 */
  private readonly workflows = new Map<string, WorkflowStatus>();

  /** 工作流程配置 */
  private readonly config: WritableSignal<WorkflowConfig> = signal(DEFAULT_WORKFLOW_CONFIG);

  /** 事件訂閱取消函式 */
  private readonly eventUnsubscribes: Array<() => void> = [];

  /** 當前藍圖 ID */
  private currentBlueprintId = '';

  /** 工作流程計數器 */
  private workflowCounter = 0;

  /** 是否已初始化 */
  private initialized = false;

  // ===== 公開 Signals =====
  /** 進行中的工作流程數 */
  public readonly runningCount: WritableSignal<number> = signal(0);

  /** 最後執行時間 */
  public readonly lastExecutionTime: WritableSignal<Date | null> = signal(null);

  /** 錯誤計數 */
  public readonly errorCount: WritableSignal<number> = signal(0);

  // ===== 常數 =====
  private readonly MAX_WORKFLOW_HISTORY = 1000;
  private readonly DEFAULT_TIMEOUT = 30000;

  /**
   * 初始化工作流程編排器
   */
  initialize(blueprintId: string): void {
    if (this.initialized) {
      console.warn('[Workflow] Already initialized. Skipping...');
      return;
    }

    this.currentBlueprintId = blueprintId;
    this.initialized = true;

    console.log(`[Workflow] Initializing SETC Workflow Orchestrator for blueprint: ${blueprintId}`);

    // 註冊預設處理器（占位符，將在 SETC-020~023 實作）
    this.registerDefaultHandlers();

    console.log('[Workflow] Orchestrator initialized successfully');
  }

  /**
   * 註冊工作流程處理器
   */
  registerHandler(eventType: SystemEventType | string, handler: WorkflowHandler, options?: WorkflowHandlerOptions): void {
    const typeKey = String(eventType);

    if (!this.handlers.has(typeKey)) {
      this.handlers.set(typeKey, []);

      // 訂閱事件
      const unsubscribe = this.eventBus.onEvent(eventType, event => {
        void this.handleEvent(event, eventType);
      });

      this.eventUnsubscribes.push(unsubscribe);
    }

    const handlers = this.handlers.get(typeKey)!;

    // 檢查是否已存在相同 ID 的處理器
    const existingIndex = handlers.findIndex(h => h.id === handler.id);
    if (existingIndex !== -1) {
      console.warn(`[Workflow] Handler ${handler.id} already exists. Replacing...`);
      handlers.splice(existingIndex, 1);
    }

    // 添加處理器
    const internalHandler: InternalWorkflowHandler = {
      ...handler,
      options: options || handler.options
    };

    handlers.push(internalHandler);

    // 按優先級排序（高優先級在前）
    handlers.sort((a, b) => (b.options?.priority ?? 0) - (a.options?.priority ?? 0));

    console.log(`[Workflow] Registered handler "${handler.id}" for event "${typeKey}"`);
  }

  /**
   * 取消註冊處理器
   */
  unregisterHandler(eventType: SystemEventType | string, handlerId: string): void {
    const typeKey = String(eventType);
    const handlers = this.handlers.get(typeKey);

    if (handlers) {
      const index = handlers.findIndex(h => h.id === handlerId);
      if (index !== -1) {
        handlers.splice(index, 1);
        console.log(`[Workflow] Unregistered handler "${handlerId}" from event "${typeKey}"`);
      }
    }
  }

  /**
   * 執行工作流程
   */
  async executeWorkflow(workflowName: string, context: WorkflowContext): Promise<WorkflowResult> {
    const workflowConfig = this.config().workflows[workflowName as SETCWorkflowType];

    if (!workflowConfig || !workflowConfig.enabled) {
      console.warn(`[Workflow] Workflow "${workflowName}" is not enabled or not found`);
      return {
        workflowId: context.workflowId,
        status: 'failed',
        completedSteps: 0,
        totalSteps: 0,
        errors: [
          {
            stepId: 'initialization',
            message: `Workflow "${workflowName}" is not enabled or not found`,
            timestamp: new Date(),
            attempt: 1
          }
        ],
        duration: 0
      };
    }

    const startTime = Date.now();
    const errors: WorkflowErrorInfo[] = [];
    let completedSteps = 0;

    context.totalSteps = workflowConfig.steps.length;

    // 更新工作流程狀態
    this.updateWorkflowStatus(context.workflowId, {
      workflowId: context.workflowId,
      state: 'running',
      currentStep: 0,
      totalSteps: context.totalSteps,
      startTime: context.startTime,
      errors: [],
      workflowType: workflowName,
      blueprintId: context.blueprintId
    });

    this.runningCount.update(count => count + 1);

    try {
      for (let i = 0; i < workflowConfig.steps.length; i++) {
        const step = workflowConfig.steps[i];
        context.currentStep = i;

        // 檢查工作流程是否被暫停或取消
        const status = this.workflows.get(context.workflowId);
        if (status?.state === 'paused') {
          console.log(`[Workflow] Workflow ${context.workflowId} is paused at step ${i}`);
          // 等待恢復（簡單實作，實際可用 Promise）
          await this.waitForResume(context.workflowId);
        }

        if (status?.state === 'cancelled') {
          console.log(`[Workflow] Workflow ${context.workflowId} was cancelled`);
          break;
        }

        try {
          const handler = this.findHandler(step.handler);
          if (!handler) {
            throw new Error(`Handler "${step.handler}" not found`);
          }

          // 執行處理器（帶重試）
          const result = await this.executeHandlerWithRetry(
            handler,
            this.createEventFromContext(context),
            context,
            step.retryable ? workflowConfig.retryPolicy : undefined
          );

          if (result.success) {
            completedSteps++;
            console.log(`[Workflow] Step "${step.id}" completed successfully`);
          } else if (step.critical) {
            throw result.error || new Error('Critical step failed');
          }
        } catch (error) {
          const errorInfo: WorkflowErrorInfo = {
            stepId: step.id,
            message: (error as Error).message,
            stack: (error as Error).stack,
            timestamp: new Date(),
            attempt: 1
          };

          errors.push(errorInfo);
          this.errorCount.update(count => count + 1);

          console.error(`[Workflow] Step "${step.id}" failed:`, error);

          if (step.critical) {
            console.error(`[Workflow] Critical step failed, aborting workflow`);
            break;
          }
        }

        // 更新狀態
        this.updateWorkflowStatus(context.workflowId, {
          ...this.workflows.get(context.workflowId)!,
          currentStep: i + 1,
          errors
        });
      }
    } finally {
      this.runningCount.update(count => Math.max(0, count - 1));
    }

    const duration = Date.now() - startTime;
    const status: 'success' | 'partial_success' | 'failed' =
      errors.length === 0 ? 'success' : completedSteps > 0 ? 'partial_success' : 'failed';

    // 更新最終狀態
    this.updateWorkflowStatus(context.workflowId, {
      ...this.workflows.get(context.workflowId)!,
      state: status === 'success' ? 'completed' : 'failed',
      endTime: new Date(),
      errors
    });

    this.lastExecutionTime.set(new Date());

    const result: WorkflowResult = {
      workflowId: context.workflowId,
      status,
      completedSteps,
      totalSteps: workflowConfig.steps.length,
      errors,
      duration
    };

    console.log(`[Workflow] Workflow ${context.workflowId} completed with status: ${status}`);

    return result;
  }

  /**
   * 取得工作流程狀態
   */
  getWorkflowStatus(workflowId: string): WorkflowStatus | undefined {
    return this.workflows.get(workflowId);
  }

  /**
   * 暫停工作流程
   */
  pauseWorkflow(workflowId: string): void {
    const status = this.workflows.get(workflowId);
    if (status && status.state === 'running') {
      status.state = 'paused';
      console.log(`[Workflow] Paused workflow ${workflowId}`);
    }
  }

  /**
   * 恢復工作流程
   */
  resumeWorkflow(workflowId: string): void {
    const status = this.workflows.get(workflowId);
    if (status && status.state === 'paused') {
      status.state = 'running';
      console.log(`[Workflow] Resumed workflow ${workflowId}`);
    }
  }

  /**
   * 取消工作流程
   */
  cancelWorkflow(workflowId: string): void {
    const status = this.workflows.get(workflowId);
    if (status && (status.state === 'running' || status.state === 'paused')) {
      status.state = 'cancelled';
      status.endTime = new Date();
      console.log(`[Workflow] Cancelled workflow ${workflowId}`);
    }
  }

  /**
   * 取得所有工作流程狀態
   */
  getAllWorkflowStatuses(): WorkflowStatus[] {
    return Array.from(this.workflows.values());
  }

  /**
   * 取得統計資訊
   */
  getStatistics(): WorkflowOrchestratorStatistics {
    const statuses = this.getAllWorkflowStatuses();

    let registeredHandlers = 0;
    this.handlers.forEach(handlers => {
      registeredHandlers += handlers.length;
    });

    return {
      totalWorkflows: statuses.length,
      runningWorkflows: statuses.filter(s => s.state === 'running').length,
      completedWorkflows: statuses.filter(s => s.state === 'completed').length,
      failedWorkflows: statuses.filter(s => s.state === 'failed').length,
      cancelledWorkflows: statuses.filter(s => s.state === 'cancelled').length,
      pausedWorkflows: statuses.filter(s => s.state === 'paused').length,
      registeredHandlers,
      lastExecutionTime: this.lastExecutionTime()
    };
  }

  /**
   * 釋放資源
   */
  dispose(): void {
    // 取消所有事件訂閱
    this.eventUnsubscribes.forEach(unsub => unsub());
    this.eventUnsubscribes.length = 0;

    // 清除處理器
    this.handlers.clear();

    // 清除工作流程狀態
    this.workflows.clear();

    // 重置狀態
    this.initialized = false;
    this.runningCount.set(0);
    this.errorCount.set(0);
    this.lastExecutionTime.set(null);

    console.log('[Workflow] Orchestrator disposed');
  }

  // ===== 私有方法 =====

  /**
   * 處理事件
   */
  private async handleEvent(event: EnhancedBlueprintEvent, eventType: SystemEventType | string): Promise<void> {
    const typeKey = String(eventType);
    const handlers = this.handlers.get(typeKey) || [];

    if (handlers.length === 0) {
      return;
    }

    console.log(`[Workflow] Processing event "${typeKey}" with ${handlers.length} handler(s)`);

    for (const handler of handlers) {
      // 檢查條件
      if (handler.options?.condition && !handler.options.condition(event)) {
        console.log(`[Workflow] Handler "${handler.id}" condition not met, skipping`);
        continue;
      }

      // 驗證
      if (handler.validate && !handler.validate(event)) {
        console.warn(`[Workflow] Handler "${handler.id}" validation failed, skipping`);
        continue;
      }

      // 建立工作流程上下文
      const context = this.createContext(event);

      try {
        await this.executeHandlerWithRetry(handler, event, context, handler.options?.retryPolicy);
      } catch (error) {
        console.error(`[Workflow] Handler "${handler.id}" failed:`, error);
        this.recordError(context.workflowId, handler.id, error as Error);
      }
    }
  }

  /**
   * 執行處理器（帶重試）
   */
  private async executeHandlerWithRetry(
    handler: InternalWorkflowHandler,
    event: EnhancedBlueprintEvent,
    context: WorkflowContext,
    retryPolicy?: RetryPolicy
  ): Promise<WorkflowStepResult> {
    const policy = retryPolicy || handler.options?.retryPolicy || DEFAULT_RETRY_POLICY;
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < policy.maxAttempts; attempt++) {
      try {
        const result = await this.executeWithTimeout(handler.execute(event, context), handler.options?.timeout || this.DEFAULT_TIMEOUT);

        if (result.success) {
          return result;
        }

        lastError = result.error;
      } catch (error) {
        lastError = error as Error;

        console.warn(`[Workflow] Handler "${handler.id}" attempt ${attempt + 1} failed:`, error);

        if (attempt < policy.maxAttempts - 1) {
          const delay = this.calculateBackoff(attempt, policy);
          console.log(`[Workflow] Retrying in ${delay}ms...`);
          await this.sleep(delay);
        }
      }
    }

    // 所有重試都失敗，嘗試回滾
    if (handler.rollback) {
      try {
        console.log(`[Workflow] Executing rollback for handler "${handler.id}"`);
        await handler.rollback(context);
      } catch (rollbackError) {
        console.error(`[Workflow] Rollback failed for handler "${handler.id}":`, rollbackError);
      }
    }

    return {
      stepId: handler.id,
      success: false,
      error: lastError || new Error('Handler execution failed after all retries')
    };
  }

  /**
   * 帶超時執行
   */
  private async executeWithTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([promise, new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeoutMs))]);
  }

  /**
   * 計算退避延遲
   */
  private calculateBackoff(attempt: number, policy: RetryPolicy): number {
    const delay = policy.initialDelayMs * Math.pow(policy.backoffMultiplier, attempt);
    return Math.min(delay, policy.maxDelayMs);
  }

  /**
   * 睡眠
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 等待恢復（簡單實作）
   */
  private async waitForResume(workflowId: string): Promise<void> {
    const checkInterval = 1000; // 1 秒
    const maxWait = 3600000; // 1 小時
    let waited = 0;

    while (waited < maxWait) {
      const status = this.workflows.get(workflowId);
      if (!status || status.state !== 'paused') {
        return;
      }
      await this.sleep(checkInterval);
      waited += checkInterval;
    }

    throw new Error('Workflow resume timeout');
  }

  /**
   * 建立上下文
   */
  private createContext(event: EnhancedBlueprintEvent): WorkflowContext {
    const workflowId = this.generateWorkflowId();

    const context: WorkflowContext = {
      workflowId,
      blueprintId: event.blueprintId,
      initiator: event.actor,
      startTime: new Date(),
      currentStep: 0,
      totalSteps: 1,
      data: new Map()
    };

    // 記錄工作流程狀態
    this.updateWorkflowStatus(workflowId, {
      workflowId,
      state: 'running',
      currentStep: 0,
      totalSteps: 1,
      startTime: context.startTime,
      errors: [],
      blueprintId: event.blueprintId
    });

    return context;
  }

  /**
   * 從上下文建立事件
   */
  private createEventFromContext(context: WorkflowContext): EnhancedBlueprintEvent {
    return {
      type: 'workflow.step',
      blueprintId: context.blueprintId,
      timestamp: new Date(),
      actor: context.initiator,
      data: Object.fromEntries(context.data),
      metadata: {
        workflowId: context.workflowId,
        currentStep: context.currentStep
      }
    };
  }

  /**
   * 更新工作流程狀態
   */
  private updateWorkflowStatus(workflowId: string, status: WorkflowStatus): void {
    this.workflows.set(workflowId, status);

    // 維護最大歷史記錄
    if (this.workflows.size > this.MAX_WORKFLOW_HISTORY) {
      // 刪除最舊的已完成工作流程
      const sortedWorkflows = Array.from(this.workflows.entries())
        .filter(([_, s]) => s.state === 'completed' || s.state === 'failed' || s.state === 'cancelled')
        .sort((a, b) => a[1].startTime.getTime() - b[1].startTime.getTime());

      const toDelete = sortedWorkflows.slice(0, this.workflows.size - this.MAX_WORKFLOW_HISTORY);
      toDelete.forEach(([id]) => this.workflows.delete(id));
    }
  }

  /**
   * 記錄錯誤
   */
  private recordError(workflowId: string, stepId: string, error: Error): void {
    const status = this.workflows.get(workflowId);
    if (status) {
      status.errors.push({
        stepId,
        message: error.message,
        stack: error.stack,
        timestamp: new Date(),
        attempt: 1
      });
      status.state = 'failed';
    }
    this.errorCount.update(count => count + 1);
  }

  /**
   * 生成工作流程 ID
   */
  private generateWorkflowId(): string {
    return `wf_${Date.now()}_${++this.workflowCounter}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * 尋找處理器
   */
  private findHandler(handlerId: string): InternalWorkflowHandler | undefined {
    for (const handlers of this.handlers.values()) {
      const handler = handlers.find(h => h.id === handlerId);
      if (handler) {
        return handler;
      }
    }
    return undefined;
  }

  /**
   * 註冊預設處理器
   *
   * SETC-020: 已實作 TaskCompletedHandler
   * SETC-021~023: 保持占位符，待後續實作
   */
  private registerDefaultHandlers(): void {
    console.log('[Workflow] Registering SETC workflow handlers');

    // SETC-020: Task → Log 處理器 ✅ 已實作
    runInInjectionContext(this.injector, () => {
      const taskCompletedHandler = inject(TaskCompletedHandler);
      this.registerHandler(SystemEventType.TASK_COMPLETED, taskCompletedHandler, taskCompletedHandler.options);
      console.log('[Workflow] ✅ SETC-020 TaskCompletedHandler registered');
    });

    // SETC-021: Log → QC 處理器 ✅ 已實作
    runInInjectionContext(this.injector, () => {
      const logCreatedHandler = inject(LogCreatedHandler);
      this.registerHandler(SystemEventType.LOG_CREATED, logCreatedHandler, logCreatedHandler.options);
      console.log('[Workflow] ✅ SETC-021 LogCreatedHandler registered');
    });

    // SETC-022: QC → Acceptance/Defect 處理器 ✅ 已實作
    runInInjectionContext(this.injector, () => {
      const qcPassedHandler = inject(QCPassedHandler);
      this.registerHandler(SystemEventType.QC_INSPECTION_PASSED, qcPassedHandler, qcPassedHandler.options);
      console.log('[Workflow] ✅ SETC-022 QCPassedHandler registered');

      const qcFailedHandler = inject(QCFailedHandler);
      this.registerHandler(SystemEventType.QC_INSPECTION_FAILED, qcFailedHandler, qcFailedHandler.options);
      console.log('[Workflow] ✅ SETC-022 QCFailedHandler registered');
    });

    // SETC-023: Acceptance → Invoice/Warranty 處理器 ✅ 已實作
    runInInjectionContext(this.injector, () => {
      const acceptanceFinalizedHandler = inject(AcceptanceFinalizedHandler);
      this.registerHandler(SystemEventType.ACCEPTANCE_FINALIZED, acceptanceFinalizedHandler, acceptanceFinalizedHandler.options);
      console.log('[Workflow] ✅ SETC-023 AcceptanceFinalizedHandler registered');
    });

    console.log('[Workflow] 🎉 All handlers registered (5 implemented, 0 placeholders)');
  }
}
