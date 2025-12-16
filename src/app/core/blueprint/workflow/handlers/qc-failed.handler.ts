/**
 * QC Failed Handler
 *
 * SETC-022: QC 檢驗失敗自動建立缺失單
 *
 * 當 QC 檢驗失敗時，自動建立缺失單。
 *
 * 功能：
 * - 監聽 qc.inspection_failed 事件
 * - 自動建立缺失單
 * - 計算缺失嚴重程度
 * - 觸發 qc.defect_created 事件
 * - 錯誤處理與重試
 *
 * @author GigHub Development Team
 * @date 2025-12-16
 */

import { Injectable, inject } from '@angular/core';
import { LoggerService } from '@core';
import { QaRepository, DefectSeverity } from '@core/blueprint/modules/implementations/qa';

import { EnhancedEventBusService } from '../../events/enhanced-event-bus.service';
import type { EnhancedBlueprintEvent } from '../../events/models/blueprint-event.model';
import { SystemEventType } from '../../events/types/system-event-type.enum';
import type { WorkflowContext, WorkflowStepResult } from '../models/workflow-context.model';
import type { WorkflowHandler, WorkflowHandlerOptions } from '../models/workflow-handler.model';

/**
 * QC 失敗事件資料
 */
export interface QCFailedEventData {
  /** 檢驗 ID */
  inspectionId: string;
  /** 任務 ID */
  taskId?: string;
  /** 日誌 ID */
  logId?: string;
  /** 任務負責人 ID */
  taskOwnerId?: string;
  /** 失敗原因 */
  failureReason?: string;
  /** 失敗項目列表 */
  failedItems?: Array<{
    itemName: string;
    description?: string;
  }>;
  /** 藍圖 ID */
  blueprintId: string;
}

/**
 * QC Failed Handler
 *
 * 處理 QC 檢驗失敗事件，自動建立缺失單。
 */
@Injectable({ providedIn: 'root' })
export class QCFailedHandler implements WorkflowHandler {
  /** 處理器 ID */
  readonly id = 'qc-failed-handler';

  /** 處理器名稱 */
  readonly name = 'QC 失敗自動建立缺失';

  /** 處理器描述 */
  readonly description = '當 QC 檢驗失敗時，自動建立缺失單';

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
  private readonly qaRepository = inject(QaRepository);
  private readonly eventBus = inject(EnhancedEventBusService);

  /**
   * 執行處理器
   */
  async execute(event: EnhancedBlueprintEvent<QCFailedEventData>, context: WorkflowContext): Promise<WorkflowStepResult> {
    const startTime = Date.now();
    const inspectionId = event.data?.inspectionId;

    this.logger.info('[QCFailedHandler]', `Processing QC failed: ${inspectionId}`);

    try {
      // 1. 驗證事件資料
      if (!this.validate(event)) {
        throw new Error('Invalid event data: missing required fields');
      }

      // 2. 從事件資料中提取失敗原因
      const failureReason = event.data?.failureReason || 'QC 檢驗未通過';
      const failedItems = event.data?.failedItems || [];

      // 3. 計算缺失嚴重程度
      const severity = this.calculateSeverity(failureReason, failedItems);

      // 4. 建立缺失單
      const defect = await this.qaRepository.create(event.blueprintId, {
        blueprintId: event.blueprintId,
        title: `QC 缺失: ${failureReason.substring(0, 50)}`,
        description: this.buildDefectDescription(inspectionId!, failureReason, failedItems),
        severity,
        location: '',
        assigneeId: event.data?.taskOwnerId,
        createdBy: event.actor.userId
      });

      this.logger.info('[QCFailedHandler]', `Created defect ${defect.id} for inspection ${inspectionId}`);

      // 5. 儲存到上下文
      context.data.set('defectId', defect.id);
      context.data.set('inspectionId', inspectionId);

      // 6. 發送缺失建立事件
      this.eventBus.emit(
        SystemEventType.QC_DEFECT_CREATED,
        {
          defectId: defect.id,
          inspectionId,
          taskId: event.data?.taskId,
          blueprintId: event.blueprintId,
          severity,
          autoCreated: true,
          source: 'qc-failed-handler'
        },
        event.actor,
        {
          source: 'qc-failed-handler',
          correlationId: context.workflowId
        }
      );

      const duration = Date.now() - startTime;
      this.logger.info('[QCFailedHandler]', `Completed in ${duration}ms`);

      return {
        stepId: this.id,
        success: true,
        data: {
          defectId: defect.id,
          inspectionId,
          severity,
          duration
        },
        continueWorkflow: true
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('[QCFailedHandler]', `Failed: ${errorMessage}`, error as Error);

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
  validate(event: EnhancedBlueprintEvent<QCFailedEventData>): boolean {
    const isValid = !!(
      event.type === SystemEventType.QC_INSPECTION_FAILED &&
      event.data?.inspectionId &&
      event.blueprintId &&
      event.actor?.userId
    );

    if (!isValid) {
      this.logger.warn('[QCFailedHandler]', 'Invalid event data:', {
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
    const defectId = context.data.get('defectId') as string | undefined;
    const blueprintId = context.blueprintId;

    if (defectId && blueprintId) {
      this.logger.info('[QCFailedHandler]', `Rolling back: deleting defect ${defectId}`);

      try {
        await this.qaRepository.delete(blueprintId, defectId);
        this.logger.info('[QCFailedHandler]', `Rollback completed`);
      } catch (error) {
        this.logger.error('[QCFailedHandler]', 'Rollback failed', error as Error);
      }
    }
  }

  /**
   * 計算缺失嚴重程度
   */
  private calculateSeverity(failureReason: string, failedItems: Array<{ itemName: string; description?: string }>): DefectSeverity {
    const keywords = {
      critical: ['安全', '危險', '緊急', '生命', 'safety', 'critical', 'emergency'],
      high: ['結構', '重大', '嚴重', '主體', 'structural', 'major', 'severe'],
      medium: ['品質', '外觀', '功能', 'quality', 'function'],
      low: ['輕微', '小問題', 'minor', 'cosmetic']
    };

    const text = `${failureReason} ${failedItems.map(i => `${i.itemName} ${i.description || ''}`).join(' ')}`.toLowerCase();

    // 檢查關鍵字判斷嚴重程度
    if (keywords.critical.some(k => text.includes(k))) {
      return DefectSeverity.CRITICAL;
    }
    if (keywords.high.some(k => text.includes(k))) {
      return DefectSeverity.HIGH;
    }
    if (keywords.low.some(k => text.includes(k))) {
      return DefectSeverity.LOW;
    }

    // 預設為中等
    return DefectSeverity.MEDIUM;
  }

  /**
   * 建立缺失描述
   */
  private buildDefectDescription(
    inspectionId: string,
    failureReason: string,
    failedItems: Array<{ itemName: string; description?: string }>
  ): string {
    let description = `來自 QC 檢驗 ${inspectionId} 的自動建立缺失\n\n`;
    description += `失敗原因: ${failureReason}\n`;
    description += `建立時間: ${new Date().toLocaleString()}\n`;

    if (failedItems.length > 0) {
      description += `\n失敗項目:\n`;
      failedItems.forEach((item, index) => {
        description += `${index + 1}. ${item.itemName}`;
        if (item.description) {
          description += ` - ${item.description}`;
        }
        description += '\n';
      });
    }

    return description;
  }
}
