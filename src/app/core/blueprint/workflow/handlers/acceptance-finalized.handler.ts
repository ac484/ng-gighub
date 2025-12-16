/**
 * Acceptance Finalized Handler
 *
 * SETC-023: 驗收通過自動生成請款/付款單並進入保固期
 *
 * 當驗收最終確定為「通過」時，自動：
 * 1. 生成業主請款清單（應收款）
 * 2. 生成承商付款清單（應付款）
 * 3. 建立保固期記錄
 *
 * @author GigHub Development Team
 * @date 2025-12-16
 */

import { Injectable, inject } from '@angular/core';
import { LoggerService } from '@core';
import { AcceptanceRepository } from '@core/blueprint/modules/implementations/acceptance/repositories/acceptance.repository';
import { FinanceRepository } from '@core/blueprint/modules/implementations/finance/repositories/finance.repository';

import { EnhancedEventBusService } from '../../events/enhanced-event-bus.service';
import type { EnhancedBlueprintEvent } from '../../events/models/blueprint-event.model';
import { SystemEventType } from '../../events/types/system-event-type.enum';
import type { WorkflowContext, WorkflowStepResult } from '../models/workflow-context.model';
import type { WorkflowHandler, WorkflowHandlerOptions } from '../models/workflow-handler.model';

/**
 * 驗收完成事件資料
 */
export interface AcceptanceFinalizedEventData {
  /** 驗收 ID */
  acceptanceId: string;
  /** 任務 ID */
  taskId?: string;
  /** 最終決定 */
  finalDecision: 'accepted' | 'rejected';
  /** 審核者 ID */
  reviewerId?: string;
  /** 藍圖 ID */
  blueprintId: string;
  /** 金額（如有） */
  amount?: number;
  /** 合約 ID */
  contractId?: string;
}

/**
 * 財務計算結果
 */
interface FinancialData {
  totalAmount: number;
  billingAmount: number;
  billingPercentage: number;
  paymentAmount: number;
  paymentPercentage: number;
  retentionAmount: number;
}

/**
 * Acceptance Finalized Handler
 *
 * 處理驗收通過事件，自動生成請款/付款單並建立保固記錄。
 */
@Injectable({ providedIn: 'root' })
export class AcceptanceFinalizedHandler implements WorkflowHandler {
  /** 處理器 ID */
  readonly id = 'acceptance-finalized-handler';

  /** 處理器名稱 */
  readonly name = '驗收通過自動建立請款與保固';

  /** 處理器描述 */
  readonly description = '當驗收通過時，自動建立可請款清單並進入保固期';

  /** 處理器選項 */
  readonly options: WorkflowHandlerOptions = {
    priority: 7,
    retryPolicy: {
      maxAttempts: 3,
      backoffMultiplier: 2,
      initialDelayMs: 1000,
      maxDelayMs: 5000
    },
    timeout: 15000,
    critical: false,
    retryable: true
  };

  // 依賴注入
  private readonly logger = inject(LoggerService);
  private readonly acceptanceRepository = inject(AcceptanceRepository);
  private readonly financeRepository = inject(FinanceRepository);
  private readonly eventBus = inject(EnhancedEventBusService);

  /**
   * 執行處理器
   */
  async execute(event: EnhancedBlueprintEvent<AcceptanceFinalizedEventData>, context: WorkflowContext): Promise<WorkflowStepResult> {
    const startTime = Date.now();
    const acceptanceId = event.data?.acceptanceId;

    this.logger.info('[AcceptanceFinalizedHandler]', `Processing acceptance finalized: ${acceptanceId}`);

    try {
      // 1. 驗證事件資料
      if (!this.validate(event)) {
        throw new Error('Invalid event data: missing required fields');
      }

      // 2. 僅處理通過的驗收
      if (event.data?.finalDecision !== 'accepted') {
        this.logger.info('[AcceptanceFinalizedHandler]', 'Skipping: acceptance not accepted');
        return {
          stepId: this.id,
          success: true,
          data: {
            skipped: true,
            reason: 'Acceptance not accepted'
          },
          continueWorkflow: true
        };
      }

      // 3. 計算財務資料（MVP: 使用預設值）
      const financialData = this.calculateFinancialData(event.data?.amount);

      // 4. 並行執行三個流程
      const results = await Promise.allSettled([
        this.generateInvoiceRecord(event, financialData),
        this.generatePaymentRecord(event, financialData),
        this.createWarrantyRecord(event)
      ]);

      // 5. 儲存結果到上下文
      const invoiceResult = results[0];
      const paymentResult = results[1];
      const warrantyResult = results[2];

      if (invoiceResult.status === 'fulfilled') {
        context.data.set('invoiceRecordId', invoiceResult.value);
      }
      if (paymentResult.status === 'fulfilled') {
        context.data.set('paymentRecordId', paymentResult.value);
      }
      if (warrantyResult.status === 'fulfilled') {
        context.data.set('warrantyRecordId', warrantyResult.value);
      }

      // 6. 發送事件
      this.eventBus.emit(
        SystemEventType.INVOICE_GENERATED,
        {
          acceptanceId,
          invoiceGenerated: invoiceResult.status === 'fulfilled',
          paymentGenerated: paymentResult.status === 'fulfilled',
          warrantyCreated: warrantyResult.status === 'fulfilled',
          blueprintId: event.blueprintId,
          autoCreated: true,
          source: 'acceptance-finalized-handler'
        },
        event.actor,
        {
          source: 'acceptance-finalized-handler',
          correlationId: context.workflowId
        }
      );

      // 7. 檢查結果
      const errors = results.filter(r => r.status === 'rejected').map(r => (r as PromiseRejectedResult).reason);

      if (errors.length > 0) {
        this.logger.warn('[AcceptanceFinalizedHandler]', `Some operations failed: ${errors.length} errors`);
      }

      const duration = Date.now() - startTime;
      this.logger.info('[AcceptanceFinalizedHandler]', `Completed in ${duration}ms`);

      return {
        stepId: this.id,
        success: true,
        data: {
          acceptanceId,
          invoiceGenerated: invoiceResult.status === 'fulfilled',
          paymentGenerated: paymentResult.status === 'fulfilled',
          warrantyCreated: warrantyResult.status === 'fulfilled',
          errorCount: errors.length,
          duration
        },
        continueWorkflow: true
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('[AcceptanceFinalizedHandler]', `Failed: ${errorMessage}`, error as Error);

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
  validate(event: EnhancedBlueprintEvent<AcceptanceFinalizedEventData>): boolean {
    const isValid = !!(
      event.type === SystemEventType.ACCEPTANCE_FINALIZED &&
      event.data?.acceptanceId &&
      event.blueprintId &&
      event.actor?.userId
    );

    if (!isValid) {
      this.logger.warn('[AcceptanceFinalizedHandler]', 'Invalid event data:', {
        type: event.type,
        hasAcceptanceId: !!event.data?.acceptanceId,
        hasBlueprintId: !!event.blueprintId
      });
    }

    return isValid;
  }

  /**
   * 回滾操作
   */
  async rollback(context: WorkflowContext): Promise<void> {
    const blueprintId = context.blueprintId;
    const records = [
      { id: context.data.get('invoiceRecordId') as string | undefined, type: 'invoice' },
      { id: context.data.get('paymentRecordId') as string | undefined, type: 'payment' },
      { id: context.data.get('warrantyRecordId') as string | undefined, type: 'warranty' }
    ];

    for (const record of records) {
      if (record.id && blueprintId) {
        this.logger.info('[AcceptanceFinalizedHandler]', `Rolling back: deleting ${record.type} ${record.id}`);

        try {
          await this.financeRepository.delete(blueprintId, record.id);
        } catch (error) {
          this.logger.error('[AcceptanceFinalizedHandler]', `Rollback failed for ${record.type}`, error as Error);
        }
      }
    }
  }

  /**
   * 計算財務資料
   */
  private calculateFinancialData(amount?: number): FinancialData {
    // MVP: 使用預設值
    const totalAmount = amount || 0;
    const billingPercentage = 80; // 可請款 80%，保留款 20%
    const paymentPercentage = 80;

    return {
      totalAmount,
      billingAmount: totalAmount * (billingPercentage / 100),
      billingPercentage,
      paymentAmount: totalAmount * (paymentPercentage / 100),
      paymentPercentage,
      retentionAmount: totalAmount * (20 / 100)
    };
  }

  /**
   * 生成請款記錄（應收款）
   */
  private async generateInvoiceRecord(
    event: EnhancedBlueprintEvent<AcceptanceFinalizedEventData>,
    financialData: FinancialData
  ): Promise<string> {
    this.logger.info('[AcceptanceFinalizedHandler]', 'Generating invoice record (receivable)');

    const record = await this.financeRepository.create(event.blueprintId, {
      blueprintId: event.blueprintId,
      type: 'invoice',
      title: `驗收請款: ${event.data?.acceptanceId}`,
      amount: financialData.billingAmount,
      currency: 'TWD',
      dueDate: this.calculateDueDate(30), // 30 天付款期限
      description:
        `來自驗收 ${event.data?.acceptanceId} 的自動請款\n` +
        `金額: NT$ ${financialData.billingAmount.toLocaleString()}\n` +
        `比例: ${financialData.billingPercentage}%\n` +
        `保留款: NT$ ${financialData.retentionAmount.toLocaleString()}`,
      createdBy: event.actor.userId
    });

    return record.id;
  }

  /**
   * 生成付款記錄（應付款）
   */
  private async generatePaymentRecord(
    event: EnhancedBlueprintEvent<AcceptanceFinalizedEventData>,
    financialData: FinancialData
  ): Promise<string> {
    this.logger.info('[AcceptanceFinalizedHandler]', 'Generating payment record (payable)');

    const record = await this.financeRepository.create(event.blueprintId, {
      blueprintId: event.blueprintId,
      type: 'payment',
      title: `驗收付款: ${event.data?.acceptanceId}`,
      amount: financialData.paymentAmount,
      currency: 'TWD',
      dueDate: this.calculateDueDate(45), // 45 天付款期限
      description:
        `來自驗收 ${event.data?.acceptanceId} 的自動付款\n` +
        `金額: NT$ ${financialData.paymentAmount.toLocaleString()}\n` +
        `比例: ${financialData.paymentPercentage}%\n` +
        `保留款: NT$ ${financialData.retentionAmount.toLocaleString()}`,
      createdBy: event.actor.userId
    });

    return record.id;
  }

  /**
   * 建立保固記錄
   */
  private async createWarrantyRecord(event: EnhancedBlueprintEvent<AcceptanceFinalizedEventData>): Promise<string> {
    this.logger.info('[AcceptanceFinalizedHandler]', 'Creating warranty record');

    // MVP: 使用財務記錄作為保固記錄的載體
    // 未來可擴展為獨立的 Warranty 模組
    const warrantyStartDate = new Date();
    const warrantyEndDate = new Date();
    warrantyEndDate.setFullYear(warrantyEndDate.getFullYear() + 1); // 1 年保固期

    const record = await this.financeRepository.create(event.blueprintId, {
      blueprintId: event.blueprintId,
      type: 'budget', // 使用 budget 類型暫時代表保固
      title: `保固期: ${event.data?.acceptanceId}`,
      amount: 0, // 保固不涉及金額
      currency: 'TWD',
      dueDate: warrantyEndDate,
      description:
        `來自驗收 ${event.data?.acceptanceId} 的自動建立保固\n` +
        `保固開始: ${warrantyStartDate.toLocaleDateString()}\n` +
        `保固結束: ${warrantyEndDate.toLocaleDateString()}\n` +
        `保固期: 1 年`,
      createdBy: event.actor.userId
    });

    // 發送保固期開始事件
    this.eventBus.emit(
      SystemEventType.WARRANTY_PERIOD_STARTED,
      {
        warrantyRecordId: record.id,
        acceptanceId: event.data?.acceptanceId,
        blueprintId: event.blueprintId,
        startDate: warrantyStartDate.toISOString(),
        endDate: warrantyEndDate.toISOString(),
        autoCreated: true,
        source: 'acceptance-finalized-handler'
      },
      event.actor,
      {
        source: 'acceptance-finalized-handler'
      }
    );

    return record.id;
  }

  /**
   * 計算到期日
   */
  private calculateDueDate(daysFromNow: number): Date {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date;
  }
}
