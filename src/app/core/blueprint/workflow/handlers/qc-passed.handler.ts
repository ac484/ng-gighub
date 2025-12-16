/**
 * QC Passed Handler
 *
 * SETC-022: QC 檢驗通過自動觸發驗收
 *
 * 當 QC 檢驗通過時，自動建立驗收請求（如資格符合）。
 *
 * 功能：
 * - 監聽 qc.inspection_passed 事件
 * - 檢查驗收資格
 * - 自動建立驗收請求
 * - 觸發 acceptance.request_created 事件
 * - 錯誤處理與重試
 *
 * @author GigHub Development Team
 * @date 2025-12-16
 */

import { Injectable, inject } from '@angular/core';
import { LoggerService } from '@core';
import { AcceptanceRepository } from '@core/blueprint/modules/implementations/acceptance/repositories/acceptance.repository';
import { QaRepository, DefectStatus } from '@core/blueprint/modules/implementations/qa';
import { TasksRepository } from '@core/blueprint/modules/implementations/tasks/tasks.repository';
import { TaskStatus } from '@core/types/task';
import { firstValueFrom } from 'rxjs';

import { EnhancedEventBusService } from '../../events/enhanced-event-bus.service';
import type { EnhancedBlueprintEvent } from '../../events/models/blueprint-event.model';
import { SystemEventType } from '../../events/types/system-event-type.enum';
import type { WorkflowContext, WorkflowStepResult } from '../models/workflow-context.model';
import type { WorkflowHandler, WorkflowHandlerOptions } from '../models/workflow-handler.model';

/**
 * QC 通過事件資料
 */
export interface QCPassedEventData {
  /** 檢驗 ID */
  inspectionId: string;
  /** 任務 ID */
  taskId?: string;
  /** 日誌 ID */
  logId?: string;
  /** 檢驗員 ID */
  inspectorId?: string;
  /** 藍圖 ID */
  blueprintId: string;
}

/**
 * 驗收資格檢查結果
 */
interface AcceptanceEligibility {
  isEligible: boolean;
  reason?: string;
}

/**
 * QC Passed Handler
 *
 * 處理 QC 檢驗通過事件，自動建立驗收請求。
 */
@Injectable({ providedIn: 'root' })
export class QCPassedHandler implements WorkflowHandler {
  /** 處理器 ID */
  readonly id = 'qc-passed-handler';

  /** 處理器名稱 */
  readonly name = 'QC 通過自動建立驗收';

  /** 處理器描述 */
  readonly description = '當 QC 檢驗通過時，自動建立驗收請求';

  /** 處理器選項 */
  readonly options: WorkflowHandlerOptions = {
    priority: 8,
    retryPolicy: {
      maxAttempts: 3,
      backoffMultiplier: 2,
      initialDelayMs: 1000,
      maxDelayMs: 5000
    },
    timeout: 10000,
    critical: false,
    retryable: true
  };

  // 依賴注入
  private readonly logger = inject(LoggerService);
  private readonly acceptanceRepository = inject(AcceptanceRepository);
  private readonly qaRepository = inject(QaRepository);
  private readonly tasksRepository = inject(TasksRepository);
  private readonly eventBus = inject(EnhancedEventBusService);

  /**
   * 執行處理器
   */
  async execute(event: EnhancedBlueprintEvent<QCPassedEventData>, context: WorkflowContext): Promise<WorkflowStepResult> {
    const startTime = Date.now();
    const inspectionId = event.data?.inspectionId;

    this.logger.info('[QCPassedHandler]', `Processing QC passed: ${inspectionId}`);

    try {
      // 1. 驗證事件資料
      if (!this.validate(event)) {
        throw new Error('Invalid event data: missing required fields');
      }

      // 2. 獲取任務資料進行驗收資格檢查
      const taskId = event.data?.taskId;
      let eligibility: AcceptanceEligibility = { isEligible: true };

      if (taskId) {
        eligibility = await this.checkAcceptanceEligibility(event.blueprintId, taskId);
      }

      if (!eligibility.isEligible) {
        this.logger.info('[QCPassedHandler]', `Skipping acceptance: ${eligibility.reason}`);
        return {
          stepId: this.id,
          success: true,
          data: {
            skipped: true,
            reason: eligibility.reason
          },
          continueWorkflow: true
        };
      }

      // 3. 建立驗收請求
      const acceptanceRecord = await this.acceptanceRepository.create(event.blueprintId, {
        blueprintId: event.blueprintId,
        title: `驗收請求: QC 檢驗通過`,
        description:
          `來自 QC 檢驗 ${inspectionId} 的自動驗收請求\n` +
          `任務 ID: ${taskId || 'N/A'}\n` +
          `檢驗員: ${event.data?.inspectorId || '系統'}\n` +
          `時間: ${new Date().toLocaleString()}`,
        createdBy: event.actor.userId
      });

      this.logger.info('[QCPassedHandler]', `Created acceptance request ${acceptanceRecord.id}`);

      // 4. 儲存到上下文
      context.data.set('acceptanceRecordId', acceptanceRecord.id);
      context.data.set('inspectionId', inspectionId);

      // 5. 發送驗收請求建立事件
      this.eventBus.emit(
        SystemEventType.ACCEPTANCE_REQUEST_CREATED,
        {
          acceptanceRecordId: acceptanceRecord.id,
          inspectionId,
          taskId,
          blueprintId: event.blueprintId,
          autoCreated: true,
          source: 'qc-passed-handler'
        },
        event.actor,
        {
          source: 'qc-passed-handler',
          correlationId: context.workflowId
        }
      );

      const duration = Date.now() - startTime;
      this.logger.info('[QCPassedHandler]', `Completed in ${duration}ms`);

      return {
        stepId: this.id,
        success: true,
        data: {
          acceptanceRecordId: acceptanceRecord.id,
          inspectionId,
          duration
        },
        continueWorkflow: true
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('[QCPassedHandler]', `Failed: ${errorMessage}`, error as Error);

      return {
        stepId: this.id,
        success: false,
        error: error instanceof Error ? error : new Error(errorMessage),
        continueWorkflow: true
      };
    }
  }

  /**
   * 驗證事件資料
   */
  validate(event: EnhancedBlueprintEvent<QCPassedEventData>): boolean {
    const isValid = !!(
      event.type === SystemEventType.QC_INSPECTION_PASSED &&
      event.data?.inspectionId &&
      event.blueprintId &&
      event.actor?.userId
    );

    if (!isValid) {
      this.logger.warn('[QCPassedHandler]', 'Invalid event data:', {
        type: event.type,
        hasInspectionId: !!event.data?.inspectionId,
        hasBlueprintId: !!event.blueprintId
      });
    }

    return isValid;
  }

  /**
   * 回滾操作
   */
  async rollback(context: WorkflowContext): Promise<void> {
    const acceptanceRecordId = context.data.get('acceptanceRecordId') as string | undefined;
    const blueprintId = context.blueprintId;

    if (acceptanceRecordId && blueprintId) {
      this.logger.info('[QCPassedHandler]', `Rolling back: deleting acceptance ${acceptanceRecordId}`);

      try {
        await this.acceptanceRepository.delete(blueprintId, acceptanceRecordId);
        this.logger.info('[QCPassedHandler]', `Rollback completed`);
      } catch (error) {
        this.logger.error('[QCPassedHandler]', 'Rollback failed', error as Error);
      }
    }
  }

  /**
   * 檢查驗收資格
   */
  private async checkAcceptanceEligibility(blueprintId: string, taskId: string): Promise<AcceptanceEligibility> {
    try {
      // 1. 檢查任務狀態
      const task = await firstValueFrom(this.tasksRepository.getById(blueprintId, taskId));

      if (!task) {
        return { isEligible: false, reason: '任務不存在' };
      }

      if (task.status !== TaskStatus.COMPLETED) {
        return { isEligible: false, reason: '任務尚未完成' };
      }

      // 2. 檢查是否有未解決的缺失
      const defects = await firstValueFrom(this.qaRepository.findByBlueprintId(blueprintId, { status: DefectStatus.OPEN }));

      // 檢查是否有與該任務相關的缺失（通過 metadata）
      const taskDefects = defects.filter(d => d.metadata?.['taskId'] === taskId);

      if (taskDefects.length > 0) {
        return { isEligible: false, reason: `存在 ${taskDefects.length} 個未解決的缺失` };
      }

      return { isEligible: true };
    } catch (error) {
      this.logger.error('[QCPassedHandler]', 'Eligibility check failed', error as Error);
      // 預設允許驗收，讓人工審核
      return { isEligible: true };
    }
  }
}
