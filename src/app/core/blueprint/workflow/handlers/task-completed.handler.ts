/**
 * Task Completed Handler
 *
 * SETC-020: 任務完成自動建立施工日誌
 *
 * 當任務標記為「管理確認完成」後，自動建立對應的施工日誌記錄。
 *
 * 功能：
 * - 監聽 task.completed 事件
 * - 自動建立施工日誌
 * - 資料映射與驗證
 * - 觸發 log.created 事件
 * - 錯誤處理與重試
 *
 * @example
 * ```typescript
 * // 註冊處理器
 * orchestrator.registerHandler(
 *   SystemEventType.TASK_COMPLETED,
 *   inject(TaskCompletedHandler)
 * );
 * ```
 *
 * @author GigHub Development Team
 * @date 2025-12-16
 */

import { Injectable, inject } from '@angular/core';
import { LoggerService } from '@core';
import { TasksRepository } from '@core/blueprint/modules/implementations/tasks/tasks.repository';
import { CreateLogRequest } from '@core/domain/types/log/log.types';
import { ConstructionLogStore } from '@core/state/stores/construction-log.store';
import { firstValueFrom } from 'rxjs';

import { EnhancedEventBusService } from '../../events/enhanced-event-bus.service';
import type { EnhancedBlueprintEvent } from '../../events/models/blueprint-event.model';
import { SystemEventType } from '../../events/types/system-event-type.enum';
import type { WorkflowContext, WorkflowStepResult } from '../models/workflow-context.model';
import type { WorkflowHandler, WorkflowHandlerOptions } from '../models/workflow-handler.model';

/**
 * 任務完成事件資料
 */
export interface TaskCompletedEventData {
  /** 任務 ID */
  taskId: string;
  /** 完成者 ID */
  completedBy?: string;
  /** 完成時間 */
  completedAt?: Date;
  /** 備註 */
  notes?: string;
  /** 藍圖 ID */
  blueprintId?: string;
}

/**
 * 從任務自動建立日誌的資料
 */
export interface AutoLogFromTaskData {
  /** 任務 ID */
  taskId: string;
  /** 任務標題 */
  taskTitle: string;
  /** 完成者 ID */
  completedBy: string;
  /** 完成者名稱 */
  completedByName?: string;
  /** 完成時間 */
  completedAt: Date;
  /** 工作描述 */
  workDescription?: string;
  /** 藍圖 ID */
  blueprintId: string;
  /** 備註 */
  notes?: string;
}

/**
 * Task Completed Handler
 *
 * 處理任務完成事件，自動建立施工日誌。
 */
@Injectable({ providedIn: 'root' })
export class TaskCompletedHandler implements WorkflowHandler {
  /** 處理器 ID */
  readonly id = 'task-completed-handler';

  /** 處理器名稱 */
  readonly name = '任務完成自動建立日誌';

  /** 處理器描述 */
  readonly description = '當任務完成時，自動建立對應的施工日誌';

  /** 處理器選項 */
  readonly options: WorkflowHandlerOptions = {
    priority: 10,
    retryPolicy: {
      maxAttempts: 3,
      backoffMultiplier: 2,
      initialDelayMs: 1000,
      maxDelayMs: 5000
    },
    timeout: 10000,
    critical: false, // 日誌建立失敗不應阻止工作流程
    retryable: true
  };

  // 依賴注入
  private readonly logger = inject(LoggerService);
  private readonly logStore = inject(ConstructionLogStore);
  private readonly taskRepository = inject(TasksRepository);
  private readonly eventBus = inject(EnhancedEventBusService);

  /**
   * 執行處理器
   *
   * @param event - 任務完成事件
   * @param context - 工作流程上下文
   * @returns 處理結果
   */
  async execute(event: EnhancedBlueprintEvent<TaskCompletedEventData>, context: WorkflowContext): Promise<WorkflowStepResult> {
    const startTime = Date.now();
    const taskId = event.data?.taskId;

    this.logger.info('[TaskCompletedHandler]', `Processing task completion: ${taskId}`);

    try {
      // 1. 驗證事件資料
      if (!this.validate(event)) {
        throw new Error('Invalid event data: missing required fields');
      }

      // 2. 獲取完整任務資料
      const task = await firstValueFrom(this.taskRepository.findById(event.blueprintId, taskId!));

      if (!task) {
        throw new Error(`Task ${taskId} not found in blueprint ${event.blueprintId}`);
      }

      this.logger.info('[TaskCompletedHandler]', `Found task: ${task.title}`);

      // 3. 準備日誌資料
      const logData: CreateLogRequest = {
        blueprintId: event.blueprintId,
        date: event.data?.completedAt || new Date(),
        title: `施工完成: ${task.title}`,
        description: task.description || '',
        workHours: task.actualHours || task.estimatedHours || 0,
        workers: 0, // 從任務中無法得知工人數，預設為 0
        equipment: '',
        weather: '',
        temperature: null,
        creatorId: event.actor.userId
      };

      // 4. 建立施工日誌
      const createdLog = await this.logStore.createLog(logData);

      this.logger.info('[TaskCompletedHandler]', `Created log ${createdLog.id} for task ${taskId}`);

      // 5. 儲存到上下文供後續步驟使用
      context.data.set('logId', createdLog.id);
      context.data.set('taskId', taskId);
      context.data.set('log', createdLog);
      context.data.set('autoCreated', true);

      // 6. 發送日誌建立事件 (觸發 SETC-021: Log → QC)
      this.eventBus.emit(
        SystemEventType.LOG_CREATED,
        {
          logId: createdLog.id,
          taskId,
          blueprintId: event.blueprintId,
          autoCreated: true,
          source: 'task-completed-handler'
        },
        event.actor,
        {
          source: 'task-completed-handler',
          correlationId: context.workflowId
        }
      );

      const duration = Date.now() - startTime;
      this.logger.info('[TaskCompletedHandler]', `Completed in ${duration}ms: log ${createdLog.id} for task ${taskId}`);

      return {
        stepId: this.id,
        success: true,
        data: {
          logId: createdLog.id,
          taskId,
          duration
        },
        continueWorkflow: true
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('[TaskCompletedHandler]', `Failed to create log for task ${taskId}: ${errorMessage}`, error as Error);

      return {
        stepId: this.id,
        success: false,
        error: error instanceof Error ? error : new Error(errorMessage),
        continueWorkflow: true // 日誌建立失敗不應阻止工作流程
      };
    }
  }

  /**
   * 驗證事件資料
   *
   * @param event - 事件物件
   * @returns 是否有效
   */
  validate(event: EnhancedBlueprintEvent<TaskCompletedEventData>): boolean {
    const isValid = !!(event.type === SystemEventType.TASK_COMPLETED && event.data?.taskId && event.blueprintId && event.actor?.userId);

    if (!isValid) {
      this.logger.warn('[TaskCompletedHandler]', 'Invalid event data:', {
        type: event.type,
        hasTaskId: !!event.data?.taskId,
        hasBlueprintId: !!event.blueprintId,
        hasActor: !!event.actor?.userId
      });
    }

    return isValid;
  }

  /**
   * 回滾操作（可選）
   *
   * @param context - 工作流程上下文
   */
  async rollback(context: WorkflowContext): Promise<void> {
    const logId = context.data.get('logId') as string | undefined;
    const blueprintId = context.blueprintId;

    if (logId && blueprintId) {
      this.logger.info('[TaskCompletedHandler]', `Rolling back: deleting log ${logId}`);

      try {
        await this.logStore.deleteLog(blueprintId, logId);
        this.logger.info('[TaskCompletedHandler]', `Rollback completed: log ${logId} deleted`);
      } catch (error) {
        this.logger.error('[TaskCompletedHandler]', `Rollback failed: could not delete log ${logId}`, error as Error);
      }
    }
  }
}
