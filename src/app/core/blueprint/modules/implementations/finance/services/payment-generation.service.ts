/**
 * Payment Generation Service - 付款單自動生成服務
 *
 * SETC-027: Payment Generation Service Implementation
 *
 * 從驗收結果自動生成付款單（應付款給承商），支援：
 * - 應付款自動生成
 * - 付款金額計算
 * - 承商分潤比例處理
 * - 付款明細生成
 *
 * @module PaymentGenerationService
 * @author GigHub Development Team
 * @date 2025-12-16
 */

import { Injectable, inject } from '@angular/core';
import { Firestore, collection, doc, addDoc, Timestamp } from '@angular/fire/firestore';
import { LoggerService } from '@core';

import { EnhancedEventBusService } from '../../../../events/enhanced-event-bus.service';
import type { EventActor } from '../../../../events/models/blueprint-event.model';
import { SystemEventType } from '../../../../events/types/system-event-type.enum';
import type { ContractorPaymentSummary } from '../models/financial-summary.model';
import type { Invoice, InvoiceItem, InvoiceStatus, PartyInfo, ApprovalWorkflow } from '../models/invoice.model';

/**
 * 生成付款單選項
 */
export interface GeneratePaymentOptions {
  /** 付款百分比 (0-100) */
  paymentPercentage?: number;
  /** 承商 ID（指定特定承商） */
  contractorId?: string;
  /** 稅率 (0-1, e.g. 0.05 = 5%) */
  taxRate?: number;
  /** 操作者 */
  actor?: EventActor;
  /** 備註 */
  notes?: string;
  /** 到期日 */
  dueDate?: Date;
}

/**
 * 簡化的驗收資料（用於生成付款單）
 */
export interface AcceptanceDataForPayment {
  id: string;
  blueprintId: string;
  contractId: string;
  taskIds: string[];
  totalAmount: number;
  acceptedAt: Date;
}

/**
 * 簡化的合約資料（用於生成付款單）
 */
export interface ContractDataForPayment {
  id: string;
  blueprintId: string;
  contractNumber: string;
  ownerName: string;
  ownerId: string;
  contractorName: string;
  contractorId: string;
  paymentTermDays: number;
  /** 承商分潤比例 (0-1) */
  contractorRate?: number;
  /** 管理費比例 (0-1) */
  managementFeeRate?: number;
}

// Re-export ContractorPaymentSummary from models for backwards compatibility
export type { ContractorPaymentSummary } from '../models/financial-summary.model';

/**
 * Payment Generation Service
 *
 * 提供付款單自動生成功能
 */
@Injectable({ providedIn: 'root' })
export class PaymentGenerationService {
  private readonly firestore = inject(Firestore);
  private readonly logger = inject(LoggerService);
  private readonly eventBus = inject(EnhancedEventBusService);

  private readonly parentCollection = 'blueprints';
  private readonly subcollectionName = 'invoices';

  /**
   * 從驗收結果自動生成應付付款單（付款給承商）
   *
   * @param acceptanceData 驗收資料
   * @param contractData 合約資料
   * @param options 生成選項
   * @returns 生成的付款單
   */
  async autoGeneratePayable(
    acceptanceData: AcceptanceDataForPayment,
    contractData: ContractDataForPayment,
    options?: GeneratePaymentOptions
  ): Promise<Invoice> {
    this.logger.info('[PaymentGenerationService]', `Generating payable for acceptance: ${acceptanceData.id}`);

    // 計算付款金額（考慮承商分潤和管理費）
    const paymentPercentage = options?.paymentPercentage ?? 100;
    const contractorRate = contractData.contractorRate ?? 1.0; // 預設 100% 付給承商
    const managementFeeRate = contractData.managementFeeRate ?? 0; // 預設無管理費

    // 計算淨付款金額
    const grossAmount = acceptanceData.totalAmount * (paymentPercentage / 100);
    const managementFee = grossAmount * managementFeeRate;
    const netAmount = grossAmount * contractorRate - managementFee;

    const taxRate = options?.taxRate ?? 0.05;
    const amounts = this.calculateTotals(netAmount, taxRate);

    // 生成付款明細
    const paymentItems = this.generatePaymentItems(acceptanceData, contractData, paymentPercentage, contractorRate, managementFeeRate);

    // 準備雙方資訊 - 付款單: 業主付款 → 承商收款
    const billingParty = this.createPartyInfo(contractData.ownerId, contractData.ownerName);
    const payingParty = this.createPartyInfo(contractData.contractorId, contractData.contractorName);

    // 計算到期日
    const dueDate = options?.dueDate ?? this.calculateDueDate(contractData.paymentTermDays);

    // 生成付款單號
    const paymentNumber = await this.generatePaymentNumber(acceptanceData.blueprintId);

    // 準備審核流程
    const approvalWorkflow = this.createInitialApprovalWorkflow();

    // 操作者
    const actor = options?.actor ?? this.getSystemActor();

    // 建立付款單
    const now = new Date();
    const paymentData: Omit<Invoice, 'id'> = {
      blueprintId: acceptanceData.blueprintId,
      invoiceNumber: paymentNumber,
      invoiceType: 'payable',
      contractId: contractData.id,
      acceptanceId: acceptanceData.id,
      taskIds: acceptanceData.taskIds,
      invoiceItems: paymentItems,
      subtotal: amounts.subtotal,
      tax: amounts.tax,
      taxRate,
      total: amounts.total,
      billingPercentage: paymentPercentage,
      billingParty,
      payingParty,
      status: 'draft' as InvoiceStatus,
      approvalWorkflow,
      dueDate,
      notes: options?.notes ?? `自動生成付款單 - 來自驗收 ${acceptanceData.id}`,
      attachments: [],
      createdBy: actor.userId,
      createdAt: now,
      updatedAt: now
    };

    // 寫入 Firestore
    const invoicesCollection = collection(this.firestore, this.parentCollection, acceptanceData.blueprintId, this.subcollectionName);

    const docRef = await addDoc(invoicesCollection, {
      ...paymentData,
      dueDate: Timestamp.fromDate(dueDate),
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now)
    });

    const payment: Invoice = {
      id: docRef.id,
      ...paymentData
    };

    // 發送事件
    this.eventBus.emit(
      SystemEventType.PAYMENT_GENERATED,
      {
        paymentId: payment.id,
        paymentNumber: payment.invoiceNumber,
        acceptanceId: acceptanceData.id,
        blueprintId: acceptanceData.blueprintId,
        contractorId: contractData.contractorId,
        contractorName: contractData.contractorName,
        amount: payment.total,
        autoCreated: true,
        source: 'payment-generation-service'
      },
      actor,
      { source: 'payment-generation-service' }
    );

    this.logger.info(
      '[PaymentGenerationService]',
      `Payment generated: ${payment.id}, contractor: ${contractData.contractorName}, amount: ${payment.total}`
    );

    return payment;
  }

  /**
   * 批次生成多個承商的付款單
   *
   * @param acceptanceData 驗收資料
   * @param contractDataList 合約資料列表（每個承商一筆）
   * @param options 生成選項
   * @returns 生成的付款單列表
   */
  async batchGeneratePayables(
    acceptanceData: AcceptanceDataForPayment,
    contractDataList: ContractDataForPayment[],
    options?: GeneratePaymentOptions
  ): Promise<Invoice[]> {
    this.logger.info('[PaymentGenerationService]', `Batch generating payables for ${contractDataList.length} contractors`);

    const payments: Invoice[] = [];

    for (const contractData of contractDataList) {
      try {
        const payment = await this.autoGeneratePayable(acceptanceData, contractData, options);
        payments.push(payment);
      } catch (error) {
        this.logger.error(
          '[PaymentGenerationService]',
          `Failed to generate payment for contractor ${contractData.contractorId}`,
          error as Error
        );
        // 繼續處理其他承商，不中斷批次操作
      }
    }

    this.logger.info(
      '[PaymentGenerationService]',
      `Batch generation completed: ${payments.length}/${contractDataList.length} payments created`
    );

    return payments;
  }

  /**
   * 計算承商付款摘要
   *
   * @param payments 付款單列表
   * @param contractorId 承商 ID
   * @returns 承商付款摘要
   */
  calculateContractorSummary(payments: Invoice[], contractorId: string): ContractorPaymentSummary {
    const contractorPayments = payments.filter(p => p.invoiceType === 'payable' && p.payingParty.id === contractorId);

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

  // ===== 私有方法 =====

  /**
   * 生成付款明細項目
   */
  private generatePaymentItems(
    acceptanceData: AcceptanceDataForPayment,
    contractData: ContractDataForPayment,
    paymentPercentage: number,
    contractorRate: number,
    managementFeeRate: number
  ): InvoiceItem[] {
    // MVP: 生成單一付款項目
    // 未來可擴展為從合約工項明細生成多個項目
    const grossAmount = acceptanceData.totalAmount * (paymentPercentage / 100);
    const managementFee = grossAmount * managementFeeRate;
    const netAmount = grossAmount * contractorRate - managementFee;

    return [
      {
        id: this.generateId(),
        contractWorkItemId: contractData.id,
        description: `驗收付款 - ${acceptanceData.id} (承商: ${contractData.contractorName})`,
        unit: '式',
        quantity: 1,
        unitPrice: acceptanceData.totalAmount,
        amount: netAmount,
        completionPercentage: 100,
        previousBilled: 0,
        currentBilling: netAmount
      }
    ];
  }

  /**
   * 計算稅額與總額
   */
  private calculateTotals(
    subtotal: number,
    taxRate: number
  ): {
    subtotal: number;
    tax: number;
    total: number;
  } {
    const tax = Math.round(subtotal * taxRate);
    const total = subtotal + tax;
    return { subtotal, tax, total };
  }

  /**
   * 建立簡化的參與方資訊
   */
  private createPartyInfo(id: string, name: string): PartyInfo {
    return {
      id,
      name,
      taxId: '', // 待填寫
      address: '', // 待填寫
      contactName: '', // 待填寫
      contactPhone: '', // 待填寫
      contactEmail: '' // 待填寫
    };
  }

  /**
   * 計算到期日
   */
  private calculateDueDate(paymentTermDays: number): Date {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (paymentTermDays || 30));
    return dueDate;
  }

  /**
   * 生成付款單號
   */
  private async generatePaymentNumber(blueprintId: string): Promise<string> {
    const date = new Date();
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `PAY-${dateStr}-${random}`;
  }

  /**
   * 建立初始審核流程
   */
  private createInitialApprovalWorkflow(): ApprovalWorkflow {
    return {
      currentStep: 0,
      totalSteps: 2, // 預設 2 級審核
      approvers: [],
      history: []
    };
  }

  /**
   * 取得系統操作者
   */
  private getSystemActor(): EventActor {
    return {
      userId: 'system',
      userName: 'System',
      role: 'system'
    };
  }

  /**
   * 生成唯一 ID
   */
  private generateId(): string {
    return `pitem_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}
