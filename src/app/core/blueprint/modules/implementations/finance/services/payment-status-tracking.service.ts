/**
 * Payment Status Tracking Service - 款項狀態追蹤服務
 *
 * SETC-029: Payment Status Tracking Service Implementation
 *
 * 提供款項狀態追蹤功能：
 * - 計算請款進度
 * - 計算付款進度
 * - 藍圖財務摘要
 * - 逾期款項統計
 *
 * @module PaymentStatusTrackingService
 * @author GigHub Development Team
 * @date 2025-12-16
 */

import { Injectable, inject, signal } from '@angular/core';
import { LoggerService } from '@core';

import { EnhancedEventBusService } from '../../../../events/enhanced-event-bus.service';
import { SystemEventType } from '../../../../events/types/system-event-type.enum';
import type {
  BillingProgress,
  PaymentProgress,
  FinancialSummary,
  ReceivableSummary,
  PayableSummary,
  OverdueSummary,
  ContractorPaymentSummary
} from '../models/financial-summary.model';
import type { Invoice, InvoiceStatus } from '../models/invoice.model';

/**
 * 款項狀態追蹤服務
 *
 * 提供財務進度追蹤和統計功能
 */
@Injectable({ providedIn: 'root' })
export class PaymentStatusTrackingService {
  private readonly logger = inject(LoggerService);
  private readonly eventBus = inject(EnhancedEventBusService);
  /** 快取的財務摘要 */
  private readonly _financialSummaryCache = signal<Map<string, FinancialSummary>>(new Map());

  /** 最後更新時間 */
  private readonly _lastUpdated = signal<Date | null>(null);

  constructor() {
    this.setupEventListeners();
  }

  /**
   * 計算任務請款進度
   *
   * @param invoices - 請款單列表（過濾後的 receivable）
   * @param taskId - 任務 ID
   * @param totalBillable - 總可請款金額
   * @returns 請款進度
   */
  calculateBillingProgress(invoices: Invoice[], taskId: string, totalBillable: number): BillingProgress {
    // 過濾該任務相關的請款單
    const taskInvoices = invoices.filter(inv => inv.taskIds.includes(taskId) && inv.invoiceType === 'receivable');

    // 計算已請款金額（已核准以上狀態）
    const approvedStatuses: InvoiceStatus[] = ['approved', 'invoiced', 'partial_paid', 'paid'];
    const billedAmount = taskInvoices.filter(inv => approvedStatuses.includes(inv.status)).reduce((sum, inv) => sum + inv.total, 0);

    // 計算已收款金額
    const paidAmount = taskInvoices
      .filter(inv => inv.status === 'paid' || inv.status === 'partial_paid')
      .reduce((sum, inv) => sum + (inv.paidAmount ?? 0), 0);

    // 計算百分比
    const billingPercentage = totalBillable > 0 ? (billedAmount / totalBillable) * 100 : 0;

    const collectionPercentage = billedAmount > 0 ? (paidAmount / billedAmount) * 100 : 0;

    return {
      taskId,
      totalBillable,
      billedAmount,
      paidAmount,
      billingPercentage: Math.round(billingPercentage * 100) / 100,
      collectionPercentage: Math.round(collectionPercentage * 100) / 100
    };
  }

  /**
   * 計算任務付款進度
   *
   * @param invoices - 付款單列表（過濾後的 payable）
   * @param taskId - 任務 ID
   * @param totalPayable - 總應付金額
   * @returns 付款進度
   */
  calculatePaymentProgress(invoices: Invoice[], taskId: string, totalPayable: number): PaymentProgress {
    // 過濾該任務相關的付款單
    const taskPayments = invoices.filter(inv => inv.taskIds.includes(taskId) && inv.invoiceType === 'payable');

    // 計算已核准金額
    const approvedStatuses: InvoiceStatus[] = ['approved', 'invoiced', 'partial_paid', 'paid'];
    const approvedAmount = taskPayments.filter(p => approvedStatuses.includes(p.status)).reduce((sum, p) => sum + p.total, 0);

    // 計算已付款金額
    const paidAmount = taskPayments
      .filter(p => p.status === 'paid' || p.status === 'partial_paid')
      .reduce((sum, p) => sum + (p.paidAmount ?? 0), 0);

    // 計算百分比
    const approvalPercentage = totalPayable > 0 ? (approvedAmount / totalPayable) * 100 : 0;

    const paymentPercentage = approvedAmount > 0 ? (paidAmount / approvedAmount) * 100 : 0;

    return {
      taskId,
      totalPayable,
      approvedAmount,
      paidAmount,
      approvalPercentage: Math.round(approvalPercentage * 100) / 100,
      paymentPercentage: Math.round(paymentPercentage * 100) / 100
    };
  }

  /**
   * 計算藍圖財務摘要
   *
   * @param invoices - 所有請款單/付款單
   * @param blueprintId - 藍圖 ID
   * @returns 財務摘要
   */
  calculateFinancialSummary(invoices: Invoice[], blueprintId: string): FinancialSummary {
    // 分離應收和應付
    const receivables = invoices.filter(inv => inv.invoiceType === 'receivable');
    const payables = invoices.filter(inv => inv.invoiceType === 'payable');

    // 計算應收款摘要
    const receivableSummary = this.calculateReceivableSummary(receivables);

    // 計算應付款摘要
    const payableSummary = this.calculatePayableSummary(payables);

    // 計算毛利
    const grossProfit = receivableSummary.collected - payableSummary.paid;
    const grossProfitMargin = receivableSummary.collected > 0 ? (grossProfit / receivableSummary.collected) * 100 : 0;

    // 計算逾期統計
    const now = new Date();
    const overdueReceivables = receivables.filter(inv => !['paid', 'cancelled'].includes(inv.status) && inv.dueDate < now);
    const paidReceivables = receivables.filter(inv => inv.status === 'paid');

    // 計算本月統計
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    const thisMonthReceivables = receivables.filter(inv => inv.createdAt >= thisMonth);
    const thisMonthPaidReceivables = receivables.filter(inv => inv.paidDate && inv.paidDate >= thisMonth);

    const summary: FinancialSummary = {
      blueprintId,
      receivables: receivableSummary,
      payables: payableSummary,
      grossProfit,
      grossProfitMargin: Math.round(grossProfitMargin * 100) / 100,
      asOf: new Date(),
      // 擴展欄位
      totalBilled: receivableSummary.total,
      totalReceived: receivableSummary.collected,
      pendingReceivable: receivableSummary.pending,
      overdueReceivable: overdueReceivables.reduce((sum, inv) => sum + inv.total, 0),
      receivableInvoiceCount: receivables.length,
      paidReceivableCount: paidReceivables.length,
      overdueInvoiceCount: overdueReceivables.length,
      totalPayable: payableSummary.total,
      totalPaid: payableSummary.paid,
      accountsReceivableBalance: receivableSummary.pending,
      accountsPayableBalance: payableSummary.pending,
      monthlyBilled: thisMonthReceivables.reduce((sum, inv) => sum + inv.total, 0),
      monthlyReceived: thisMonthPaidReceivables.reduce((sum, inv) => sum + (inv.paidAmount ?? 0), 0)
    };

    // 快取結果
    const cache = new Map(this._financialSummaryCache());
    cache.set(blueprintId, summary);
    this._financialSummaryCache.set(cache);
    this._lastUpdated.set(new Date());

    return summary;
  }

  /**
   * 計算逾期款項摘要
   *
   * @param invoices - 所有請款單/付款單
   * @param blueprintId - 藍圖 ID
   * @returns 逾期摘要
   */
  calculateOverdueSummary(invoices: Invoice[], blueprintId: string): OverdueSummary {
    const now = new Date();

    // 逾期應收款（未收款且已過到期日）
    const overdueReceivables = invoices.filter(
      inv => inv.invoiceType === 'receivable' && !['paid', 'cancelled'].includes(inv.status) && inv.dueDate < now
    );

    // 逾期應付款（未付款且已過到期日）
    const overduePayables = invoices.filter(
      inv => inv.invoiceType === 'payable' && !['paid', 'cancelled'].includes(inv.status) && inv.dueDate < now
    );

    return {
      blueprintId,
      overdueReceivableCount: overdueReceivables.length,
      overdueReceivableAmount: overdueReceivables.reduce((sum, inv) => sum + inv.total, 0),
      overduePayableCount: overduePayables.length,
      overduePayableAmount: overduePayables.reduce((sum, inv) => sum + inv.total, 0),
      asOf: new Date()
    };
  }

  /**
   * 計算承商付款摘要
   *
   * @param invoices - 所有付款單
   * @param contractorId - 承商 ID
   * @returns 承商付款摘要
   */
  calculateContractorSummary(invoices: Invoice[], contractorId: string): ContractorPaymentSummary {
    const contractorPayments = invoices.filter(inv => inv.invoiceType === 'payable' && inv.payingParty.id === contractorId);

    const totalPayable = contractorPayments.reduce((sum, p) => sum + p.total, 0);
    const paidAmount = contractorPayments.filter(p => p.status === 'paid').reduce((sum, p) => sum + (p.paidAmount ?? p.total), 0);

    return {
      contractorId,
      contractorName: contractorPayments[0]?.payingParty.name ?? '',
      totalPayable,
      paidAmount,
      pendingAmount: totalPayable - paidAmount,
      paymentCount: contractorPayments.length
    };
  }

  /**
   * 取得快取的財務摘要
   *
   * @param blueprintId - 藍圖 ID
   * @returns 財務摘要或 undefined
   */
  getCachedSummary(blueprintId: string): FinancialSummary | undefined {
    return this._financialSummaryCache().get(blueprintId);
  }

  /**
   * 清除快取
   */
  clearCache(): void {
    this._financialSummaryCache.set(new Map());
    this._lastUpdated.set(null);
  }

  /**
   * 取得最後更新時間
   */
  getLastUpdated(): Date | null {
    return this._lastUpdated();
  }

  // ===== 私有方法 =====

  /**
   * 計算應收款摘要
   */
  private calculateReceivableSummary(receivables: Invoice[]): ReceivableSummary {
    // 總應收（已核准以上狀態）
    const approvedStatuses: InvoiceStatus[] = ['approved', 'invoiced', 'partial_paid', 'paid'];
    const approvedReceivables = receivables.filter(inv => approvedStatuses.includes(inv.status));

    const total = approvedReceivables.reduce((sum, inv) => sum + inv.total, 0);
    const collected = approvedReceivables
      .filter(inv => inv.status === 'paid' || inv.status === 'partial_paid')
      .reduce((sum, inv) => sum + (inv.paidAmount ?? 0), 0);

    const pending = total - collected;
    const collectionRate = total > 0 ? (collected / total) * 100 : 0;

    return {
      total,
      collected,
      pending,
      collectionRate: Math.round(collectionRate * 100) / 100
    };
  }

  /**
   * 計算應付款摘要
   */
  private calculatePayableSummary(payables: Invoice[]): PayableSummary {
    // 總應付（已核准以上狀態）
    const approvedStatuses: InvoiceStatus[] = ['approved', 'invoiced', 'partial_paid', 'paid'];
    const approvedPayables = payables.filter(inv => approvedStatuses.includes(inv.status));

    const total = approvedPayables.reduce((sum, inv) => sum + inv.total, 0);
    const paid = approvedPayables
      .filter(inv => inv.status === 'paid' || inv.status === 'partial_paid')
      .reduce((sum, inv) => sum + (inv.paidAmount ?? 0), 0);

    const pending = total - paid;
    const paymentRate = total > 0 ? (paid / total) * 100 : 0;

    return {
      total,
      paid,
      pending,
      paymentRate: Math.round(paymentRate * 100) / 100
    };
  }

  /**
   * 設定事件監聽器
   */
  private setupEventListeners(): void {
    // 監聽請款付款事件，自動清除快取以觸發重新計算
    const relevantEvents = [
      SystemEventType.INVOICE_APPROVED,
      SystemEventType.INVOICE_PAID,
      SystemEventType.PAYMENT_APPROVED,
      SystemEventType.PAYMENT_COMPLETED
    ];

    for (const eventType of relevantEvents) {
      this.eventBus.onEvent(eventType, event => {
        this.logger.info('[PaymentStatusTrackingService]', `Event received: ${eventType}, clearing cache for blueprint`);
        // 清除該藍圖的快取
        const cache = new Map(this._financialSummaryCache());
        cache.delete(event.blueprintId);
        this._financialSummaryCache.set(cache);
      });
    }
  }
}
