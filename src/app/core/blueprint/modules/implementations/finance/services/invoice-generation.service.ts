/**
 * Invoice Generation Service
 *
 * SETC-025: 請款單自動生成服務
 *
 * 從驗收結果自動生成請款單，支援：
 * - 應收款自動生成（向業主請款）
 * - 應付款自動生成（付款給承商）
 * - 請款金額計算
 * - 請款明細生成
 *
 * @module InvoiceGenerationService
 * @author GigHub Development Team
 * @date 2025-12-16
 */

import { Injectable, inject } from '@angular/core';
import { Firestore, collection, doc, addDoc, Timestamp } from '@angular/fire/firestore';
import { LoggerService } from '@core';

import { EnhancedEventBusService } from '../../../../events/enhanced-event-bus.service';
import type { EventActor } from '../../../../events/models/blueprint-event.model';
import { SystemEventType } from '../../../../events/types/system-event-type.enum';
import type { Invoice, InvoiceItem, InvoiceType, InvoiceStatus, PartyInfo, ApprovalWorkflow } from '../models/invoice.model';

/**
 * 生成請款單選項
 */
export interface GenerateInvoiceOptions {
  /** 請款百分比 (0-100) */
  billingPercentage?: number;
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
 * 簡化的驗收資料（用於生成請款單）
 */
export interface AcceptanceDataForInvoice {
  id: string;
  blueprintId: string;
  contractId: string;
  taskIds: string[];
  totalAmount: number;
  acceptedAt: Date;
}

/**
 * 簡化的合約資料（用於生成請款單）
 */
export interface ContractDataForInvoice {
  id: string;
  blueprintId: string;
  contractNumber: string;
  ownerName: string;
  ownerId: string;
  contractorName: string;
  contractorId: string;
  paymentTermDays: number;
}

/**
 * Invoice Generation Service
 *
 * 提供請款單自動生成功能
 */
@Injectable({ providedIn: 'root' })
export class InvoiceGenerationService {
  private readonly firestore = inject(Firestore);
  private readonly logger = inject(LoggerService);
  private readonly eventBus = inject(EnhancedEventBusService);

  private readonly parentCollection = 'blueprints';
  private readonly subcollectionName = 'invoices';

  /**
   * 從驗收結果自動生成應收請款單（向業主請款）
   *
   * @param acceptanceData 驗收資料
   * @param contractData 合約資料
   * @param options 生成選項
   * @returns 生成的請款單
   */
  async autoGenerateReceivable(
    acceptanceData: AcceptanceDataForInvoice,
    contractData: ContractDataForInvoice,
    options?: GenerateInvoiceOptions
  ): Promise<Invoice> {
    this.logger.info('[InvoiceGenerationService]', `Generating receivable invoice for acceptance: ${acceptanceData.id}`);

    return this.generateInvoice(acceptanceData, contractData, 'receivable', options);
  }

  /**
   * 從驗收結果自動生成應付付款單（付款給承商）
   *
   * @param acceptanceData 驗收資料
   * @param contractData 合約資料
   * @param options 生成選項
   * @returns 生成的付款單
   */
  async autoGeneratePayable(
    acceptanceData: AcceptanceDataForInvoice,
    contractData: ContractDataForInvoice,
    options?: GenerateInvoiceOptions
  ): Promise<Invoice> {
    this.logger.info('[InvoiceGenerationService]', `Generating payable invoice for acceptance: ${acceptanceData.id}`);

    return this.generateInvoice(acceptanceData, contractData, 'payable', options);
  }

  /**
   * 同時生成應收和應付請款單
   *
   * @param acceptanceData 驗收資料
   * @param contractData 合約資料
   * @param options 生成選項
   * @returns 生成的請款單和付款單
   */
  async autoGenerateBoth(
    acceptanceData: AcceptanceDataForInvoice,
    contractData: ContractDataForInvoice,
    options?: GenerateInvoiceOptions
  ): Promise<{ receivable: Invoice; payable: Invoice }> {
    this.logger.info('[InvoiceGenerationService]', `Generating both invoices for acceptance: ${acceptanceData.id}`);

    const [receivable, payable] = await Promise.all([
      this.autoGenerateReceivable(acceptanceData, contractData, options),
      this.autoGeneratePayable(acceptanceData, contractData, options)
    ]);

    return { receivable, payable };
  }

  /**
   * 生成請款單核心邏輯
   */
  private async generateInvoice(
    acceptanceData: AcceptanceDataForInvoice,
    contractData: ContractDataForInvoice,
    invoiceType: InvoiceType,
    options?: GenerateInvoiceOptions
  ): Promise<Invoice> {
    const billingPercentage = options?.billingPercentage ?? 80; // 預設 80%
    const taxRate = options?.taxRate ?? 0.05; // 預設 5% 營業稅

    // 計算金額
    const baseAmount = acceptanceData.totalAmount * (billingPercentage / 100);
    const amounts = this.calculateTotals(baseAmount, taxRate);

    // 生成請款明細
    const invoiceItems = this.generateInvoiceItems(acceptanceData, billingPercentage);

    // 準備雙方資訊
    const { billingParty, payingParty } = this.preparePartyInfo(contractData, invoiceType);

    // 計算到期日
    const dueDate = options?.dueDate ?? this.calculateDueDate(contractData.paymentTermDays);

    // 生成請款單號
    const invoiceNumber = await this.generateInvoiceNumber(acceptanceData.blueprintId, invoiceType);

    // 準備審核流程
    const approvalWorkflow = this.createInitialApprovalWorkflow();

    // 操作者
    const actor = options?.actor ?? this.getSystemActor();

    // 建立請款單
    const now = new Date();
    const invoiceData: Omit<Invoice, 'id'> = {
      blueprintId: acceptanceData.blueprintId,
      invoiceNumber,
      invoiceType,
      contractId: contractData.id,
      acceptanceId: acceptanceData.id,
      taskIds: acceptanceData.taskIds,
      invoiceItems,
      subtotal: amounts.subtotal,
      tax: amounts.tax,
      taxRate,
      total: amounts.total,
      billingPercentage,
      billingParty,
      payingParty,
      status: 'draft' as InvoiceStatus,
      approvalWorkflow,
      dueDate,
      notes: options?.notes ?? `自動生成 - 來自驗收 ${acceptanceData.id}`,
      attachments: [],
      createdBy: actor.userId,
      createdAt: now,
      updatedAt: now
    };

    // 寫入 Firestore
    const invoicesCollection = collection(this.firestore, this.parentCollection, acceptanceData.blueprintId, this.subcollectionName);

    const docRef = await addDoc(invoicesCollection, {
      ...invoiceData,
      dueDate: Timestamp.fromDate(dueDate),
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now)
    });

    const invoice: Invoice = {
      id: docRef.id,
      ...invoiceData
    };

    // 發送事件
    this.eventBus.emit(
      SystemEventType.INVOICE_GENERATED,
      {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        invoiceType,
        acceptanceId: acceptanceData.id,
        blueprintId: acceptanceData.blueprintId,
        amount: invoice.total,
        autoCreated: true,
        source: 'invoice-generation-service'
      },
      actor,
      {
        source: 'invoice-generation-service'
      }
    );

    this.logger.info('[InvoiceGenerationService]', `Invoice generated: ${invoice.id} (${invoiceType}), amount: ${invoice.total}`);

    return invoice;
  }

  /**
   * 生成請款明細項目
   */
  private generateInvoiceItems(acceptanceData: AcceptanceDataForInvoice, billingPercentage: number): InvoiceItem[] {
    // MVP: 生成單一請款項目
    // 未來可擴展為從合約工項明細生成多個項目
    const currentBilling = acceptanceData.totalAmount * (billingPercentage / 100);

    return [
      {
        id: this.generateId(),
        contractWorkItemId: acceptanceData.contractId,
        description: `驗收請款 - ${acceptanceData.id}`,
        unit: '式',
        quantity: 1,
        unitPrice: acceptanceData.totalAmount,
        amount: acceptanceData.totalAmount,
        completionPercentage: 100,
        previousBilled: 0,
        currentBilling
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
   * 準備請款/付款方資訊
   */
  private preparePartyInfo(
    contractData: ContractDataForInvoice,
    invoiceType: InvoiceType
  ): { billingParty: PartyInfo; payingParty: PartyInfo } {
    // 應收款: 承商開票 → 業主付款
    // 應付款: 業主開票 → 承商收款
    if (invoiceType === 'receivable') {
      return {
        billingParty: this.createPartyInfo(contractData.contractorId, contractData.contractorName),
        payingParty: this.createPartyInfo(contractData.ownerId, contractData.ownerName)
      };
    } else {
      return {
        billingParty: this.createPartyInfo(contractData.ownerId, contractData.ownerName),
        payingParty: this.createPartyInfo(contractData.contractorId, contractData.contractorName)
      };
    }
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
   * 生成請款單號
   */
  private async generateInvoiceNumber(blueprintId: string, invoiceType: InvoiceType): Promise<string> {
    const prefix = invoiceType === 'receivable' ? 'INV' : 'PAY';
    const date = new Date();
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${dateStr}-${random}`;
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
    return `item_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}
