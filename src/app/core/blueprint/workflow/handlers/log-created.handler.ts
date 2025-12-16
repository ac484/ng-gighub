/**
 * Log Created Handler
 *
 * SETC-021: 日誌建立自動建立 QC 待驗
 *
 * 當施工日誌建立後，自動建立 QC 待驗記錄，進入品質檢查流程。
 *
 * 功能：
 * - 監聽 log.created 事件
 * - 自動建立 QC 待驗記錄
 * - 檢驗員分配（簡單邏輯）
 * - 觸發 qc.inspection_created 事件
 * - 錯誤處理與重試
 *
 * @example
 * ```typescript
 * // 註冊處理器
 * orchestrator.registerHandler(
 *   SystemEventType.LOG_CREATED,
 *   inject(LogCreatedHandler)
 * );
 * ```
 *
 * @author GigHub Development Team
 * @date 2025-12-16
 */

import { Injectable, inject } from '@angular/core';
import { LoggerService } from '@core';
import { QaRepository, DefectSeverity } from '@core/blueprint/modules/implementations/qa';
import { LogFirestoreRepository } from '@core/data-access/repositories/log-firestore.repository';

import { EnhancedEventBusService } from '../../events/enhanced-event-bus.service';
import type { EnhancedBlueprintEvent } from '../../events/models/blueprint-event.model';
import { SystemEventType } from '../../events/types/system-event-type.enum';
import type { WorkflowContext, WorkflowStepResult } from '../models/workflow-context.model';
import type { WorkflowHandler, WorkflowHandlerOptions } from '../models/workflow-handler.model';

/**
 * 日誌建立事件資料
 */
export interface LogCreatedEventData {
  /** 日誌 ID */
  logId: string;
  /** 任務 ID */
  taskId?: string;
  /** 藍圖 ID */
  blueprintId: string;
  /** 是否自動建立 */
  autoCreated?: boolean;
  /** 來源 */
  source?: string;
}

/**
 * QC 待驗記錄資料
 */
export interface QCPendingInspectionData {
  /** 日誌 ID */
  logId: string;
  /** 任務 ID */
  taskId?: string;
  /** 藍圖 ID */
  blueprintId: string;
  /** 檢驗員 ID */
  inspectorId?: string;
  /** 預定檢驗日期 */
  scheduledDate: Date;
  /** 檢驗類型 */
  inspectionType: 'routine' | 'final';
  /** 備註 */
  notes?: string;
}

/**
 * Log Created Handler
 *
 * 處理日誌建立事件，自動建立 QC 待驗記錄。
 */
@Injectable({ providedIn: 'root' })
export class LogCreatedHandler implements WorkflowHandler {
  /** 處理器 ID */
  readonly id = 'log-created-handler';

  /** 處理器名稱 */
  readonly name = '日誌建立自動建立 QC 待驗';

  /** 處理器描述 */
  readonly description = '當施工日誌建立時，自動建立 QC 待驗項目';

  /** 處理器選項 */
  readonly options: WorkflowHandlerOptions = {
    priority: 9,
    retryPolicy: {
      maxAttempts: 3,
      backoffMultiplier: 2,
      initialDelayMs: 1000,
      maxDelayMs: 5000
    },
    timeout: 10000,
    critical: false, // QC 建立失敗不應阻止工作流程
    retryable: true
  };

  // 依賴注入
  private readonly logger = inject(LoggerService);
  private readonly logRepository = inject(LogFirestoreRepository);
  private readonly qaRepository = inject(QaRepository);
  private readonly eventBus = inject(EnhancedEventBusService);

  /**
   * 執行處理器
   *
   * @param event - 日誌建立事件
   * @param context - 工作流程上下文
   * @returns 處理結果
   */
  async execute(event: EnhancedBlueprintEvent<LogCreatedEventData>, context: WorkflowContext): Promise<WorkflowStepResult> {
    const startTime = Date.now();
    const logId = event.data?.logId;

    this.logger.info('[LogCreatedHandler]', `Processing log creation: ${logId}`);

    try {
      // 1. 驗證事件資料
      if (!this.validate(event)) {
        throw new Error('Invalid event data: missing required fields');
      }

      // 2. 獲取日誌資料
      const log = await this.logRepository.findById(logId!);

      if (!log) {
        throw new Error(`Log ${logId} not found`);
      }

      this.logger.info('[LogCreatedHandler]', `Found log: ${log.title}`);

      // 3. 分配檢驗員（簡單邏輯：使用日誌建立者或系統預設）
      const inspector = await this.assignInspector(event.blueprintId);

      // 4. 計算預定檢驗日期（預設為隔日）
      const scheduledDate = this.calculateInspectionDate();

      // 5. 建立 QC 待驗記錄（使用 QA Defect 作為暫時方案）
      // 注意：這是 MVP 實作，使用 QADefect 作為 "待驗" 記錄的載體
      // 未來可擴展為完整的 QAInspection 模型
      const qcRecord = await this.qaRepository.create(event.blueprintId, {
        blueprintId: event.blueprintId,
        title: `QC 待驗: ${log.title}`,
        description:
          `來自施工日誌 ${log.id} 的品質檢驗待辦\n\n` +
          `日誌日期: ${log.date.toLocaleDateString()}\n` +
          `工時: ${log.workHours || 0} 小時\n` +
          `工人數: ${log.workers || 0} 人\n` +
          `天氣: ${log.weather || '未記錄'}\n\n` +
          `預定檢驗日期: ${scheduledDate.toLocaleDateString()}`,
        severity: DefectSeverity.MEDIUM, // 待驗使用中等優先級
        location: '',
        assigneeId: inspector.id,
        createdBy: event.actor.userId
      });

      this.logger.info('[LogCreatedHandler]', `Created QC pending inspection ${qcRecord.id} for log ${logId}`);

      // 6. 儲存到上下文供後續步驟使用
      context.data.set('qcRecordId', qcRecord.id);
      context.data.set('logId', logId);
      context.data.set('inspectorId', inspector.id);
      context.data.set('scheduledDate', scheduledDate);

      // 7. 發送 QC 檢驗建立事件 (觸發 SETC-022: QC → Acceptance/Defect)
      this.eventBus.emit(
        SystemEventType.QC_INSPECTION_CREATED,
        {
          inspectionId: qcRecord.id,
          logId,
          taskId: event.data?.taskId,
          blueprintId: event.blueprintId,
          inspectorId: inspector.id,
          scheduledDate: scheduledDate.toISOString(),
          autoCreated: true,
          source: 'log-created-handler'
        },
        event.actor,
        {
          source: 'log-created-handler',
          correlationId: context.workflowId
        }
      );

      const duration = Date.now() - startTime;
      this.logger.info('[LogCreatedHandler]', `Completed in ${duration}ms: QC record ${qcRecord.id} for log ${logId}`);

      return {
        stepId: this.id,
        success: true,
        data: {
          qcRecordId: qcRecord.id,
          logId,
          inspectorId: inspector.id,
          scheduledDate: scheduledDate.toISOString(),
          duration
        },
        continueWorkflow: true
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('[LogCreatedHandler]', `Failed to create QC record for log ${logId}: ${errorMessage}`, error as Error);

      return {
        stepId: this.id,
        success: false,
        error: error instanceof Error ? error : new Error(errorMessage),
        continueWorkflow: true // QC 建立失敗不應阻止工作流程
      };
    }
  }

  /**
   * 驗證事件資料
   *
   * @param event - 事件物件
   * @returns 是否有效
   */
  validate(event: EnhancedBlueprintEvent<LogCreatedEventData>): boolean {
    const isValid = !!(event.type === SystemEventType.LOG_CREATED && event.data?.logId && event.blueprintId && event.actor?.userId);

    if (!isValid) {
      this.logger.warn('[LogCreatedHandler]', 'Invalid event data:', {
        type: event.type,
        hasLogId: !!event.data?.logId,
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
    const qcRecordId = context.data.get('qcRecordId') as string | undefined;
    const blueprintId = context.blueprintId;

    if (qcRecordId && blueprintId) {
      this.logger.info('[LogCreatedHandler]', `Rolling back: deleting QC record ${qcRecordId}`);

      try {
        await this.qaRepository.delete(blueprintId, qcRecordId);
        this.logger.info('[LogCreatedHandler]', `Rollback completed: QC record ${qcRecordId} deleted`);
      } catch (error) {
        this.logger.error('[LogCreatedHandler]', `Rollback failed: could not delete QC record ${qcRecordId}`, error as Error);
      }
    }
  }

  /**
   * 分配檢驗員
   *
   * 簡單邏輯：返回系統預設檢驗員
   * 未來可擴展為：
   * - 輪詢分配
   * - 負載均衡（最少任務數）
   * - 專業分配（根據任務類型）
   *
   * @param blueprintId - 藍圖 ID
   * @returns 檢驗員資訊
   */
  private async assignInspector(blueprintId: string): Promise<{ id: string; name: string }> {
    // MVP: 使用系統預設檢驗員
    // TODO: 實作更複雜的分配邏輯
    this.logger.info('[LogCreatedHandler]', `Assigning default inspector for blueprint ${blueprintId}`);

    return {
      id: 'system-inspector',
      name: 'System Inspector'
    };
  }

  /**
   * 計算預定檢驗日期
   *
   * 預設為建立後 1 個工作日
   *
   * @returns 預定檢驗日期
   */
  private calculateInspectionDate(): Date {
    const date = new Date();
    // 加 1 天
    date.setDate(date.getDate() + 1);

    // 如果是週末，移到週一
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0) {
      // 週日 → 週一
      date.setDate(date.getDate() + 1);
    } else if (dayOfWeek === 6) {
      // 週六 → 週一
      date.setDate(date.getDate() + 2);
    }

    return date;
  }
}
