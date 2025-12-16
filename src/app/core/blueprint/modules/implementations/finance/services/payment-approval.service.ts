/**
 * Payment Approval Service - 付款審核工作流程服務
 *
 * SETC-028: Payment Approval Workflow Implementation
 *
 * 實作付款審核工作流程，支援：
 * - 送出審核 (submit)
 * - 核准付款 (approve)
 * - 退回付款 (reject)
 * - 開票記錄 (markAsInvoiced)
 * - 付款完成 (markAsPaid)
 * - 部分付款支援
 *
 * @module PaymentApprovalService
 * @author GigHub Development Team
 * @date 2025-12-16
 */

import { Injectable, inject } from '@angular/core';
import { Firestore, doc, getDoc, updateDoc, Timestamp } from '@angular/fire/firestore';
import { LoggerService } from '@core';

import { EnhancedEventBusService } from '../../../../events/enhanced-event-bus.service';
import type { EventActor } from '../../../../events/models/blueprint-event.model';
import { SystemEventType } from '../../../../events/types/system-event-type.enum';
import { InvoiceStateMachine, InvoiceStatusError } from '../models/invoice-status-machine';
import type { Invoice, InvoiceStatus, ApprovalWorkflow, ApprovalHistory, ApprovalAction, PaymentMethod } from '../models/invoice.model';

/**
 * 付款開票資訊
 */
export interface PaymentInvoiceInfo {
  /** 統一發票號碼 */
  invoiceNumber: string;
  /** 開票日期 */
  invoiceDate: Date;
  /** 統一編號 */
  taxId: string;
  /** 發票金額 */
  amount: number;
  /** 發票附件 ID 列表 */
  attachmentIds?: string[];
}

/**
 * 付款完成資訊
 */
export interface PaymentCompleteInfo {
  /** 付款金額 */
  amount: number;
  /** 付款方式 */
  method: PaymentMethod;
  /** 付款日期 */
  paidDate?: Date;
  /** 付款參考編號（如匯款帳號後5碼） */
  reference?: string;
  /** 銀行資訊 */
  bankInfo?: {
    bankName: string;
    accountNumber: string;
    transactionId: string;
  };
}

/**
 * 付款審核選項
 */
export interface PaymentApprovalOptions {
  /** 審核意見 */
  comments?: string;
}

/**
 * 付款審核工作流程服務
 *
 * 提供付款單審核流程管理功能
 * 注意：付款單使用相同的 Invoice 資料結構，但 invoiceType = 'payable'
 */
@Injectable({ providedIn: 'root' })
export class PaymentApprovalService {
  private readonly firestore = inject(Firestore);
  private readonly logger = inject(LoggerService);
  private readonly eventBus = inject(EnhancedEventBusService);

  private readonly parentCollection = 'blueprints';
  private readonly subcollectionName = 'invoices';

  /**
   * 送出付款單進行審核
   *
   * @param blueprintId - 藍圖 ID
   * @param paymentId - 付款單 ID
   * @param actor - 操作者
   * @returns 更新後的付款單
   */
  async submit(blueprintId: string, paymentId: string, actor: EventActor): Promise<Invoice> {
    this.logger.info('[PaymentApprovalService]', `Submitting payment: ${paymentId}`);

    const payment = await this.getPayment(blueprintId, paymentId);
    this.validatePayable(payment);

    InvoiceStateMachine.validateTransition(payment.status, 'submitted');
    this.validatePaymentData(payment);

    // 初始化審核流程
    const workflow = this.initializeApprovalWorkflow(payment.approvalWorkflow);
    const history = this.createHistoryEntry(1, 'submit', actor, payment.status, 'submitted');
    workflow.history.push(history);

    const updatedPayment = await this.updatePaymentStatus(blueprintId, paymentId, 'submitted', workflow, actor);

    this.eventBus.emit(
      SystemEventType.PAYMENT_SUBMITTED,
      {
        paymentId,
        paymentNumber: payment.invoiceNumber,
        blueprintId,
        contractorId: payment.payingParty.id,
        contractorName: payment.payingParty.name,
        amount: payment.total,
        source: 'payment-approval-service'
      },
      actor,
      { source: 'payment-approval-service' }
    );

    this.logger.info('[PaymentApprovalService]', `Payment ${paymentId} submitted for approval`);

    return updatedPayment;
  }

  /**
   * 核准付款單
   *
   * @param blueprintId - 藍圖 ID
   * @param paymentId - 付款單 ID
   * @param actor - 操作者
   * @param options - 核准選項
   * @returns 更新後的付款單
   */
  async approve(blueprintId: string, paymentId: string, actor: EventActor, options?: PaymentApprovalOptions): Promise<Invoice> {
    this.logger.info('[PaymentApprovalService]', `Approving payment: ${paymentId}`);

    const payment = await this.getPayment(blueprintId, paymentId);
    this.validatePayable(payment);

    if (!InvoiceStateMachine.isPendingApproval(payment.status)) {
      throw new InvoiceStatusError(`Payment is not pending approval: ${payment.status}`, {
        from: payment.status,
        to: 'approved',
        allowed: InvoiceStateMachine.getAvailableTransitions(payment.status)
      });
    }

    const workflow = this.updateApprovalStep(payment.approvalWorkflow, actor, 'approved', options?.comments);

    const isFullyApproved = workflow.currentStep >= workflow.totalSteps;
    const newStatus: InvoiceStatus = isFullyApproved ? 'approved' : 'under_review';

    const history = this.createHistoryEntry(workflow.currentStep - 1, 'approve', actor, payment.status, newStatus, options?.comments);
    workflow.history.push(history);

    const updatedPayment = await this.updatePaymentStatus(blueprintId, paymentId, newStatus, workflow, actor);

    this.eventBus.emit(
      SystemEventType.PAYMENT_APPROVED,
      {
        paymentId,
        blueprintId,
        isFullyApproved,
        contractorId: payment.payingParty.id,
        amount: payment.total,
        source: 'payment-approval-service'
      },
      actor,
      { source: 'payment-approval-service' }
    );

    this.logger.info('[PaymentApprovalService]', `Payment ${paymentId} approved (fully: ${isFullyApproved})`);

    return updatedPayment;
  }

  /**
   * 退回付款單
   *
   * @param blueprintId - 藍圖 ID
   * @param paymentId - 付款單 ID
   * @param actor - 操作者
   * @param reason - 退回原因
   * @returns 更新後的付款單
   */
  async reject(blueprintId: string, paymentId: string, actor: EventActor, reason: string): Promise<Invoice> {
    this.logger.info('[PaymentApprovalService]', `Rejecting payment: ${paymentId}`);

    if (!reason || reason.trim() === '') {
      throw new Error('Rejection reason is required');
    }

    const payment = await this.getPayment(blueprintId, paymentId);
    this.validatePayable(payment);

    if (!InvoiceStateMachine.isPendingApproval(payment.status)) {
      throw new InvoiceStatusError(`Payment is not pending approval: ${payment.status}`, {
        from: payment.status,
        to: 'rejected',
        allowed: InvoiceStateMachine.getAvailableTransitions(payment.status)
      });
    }

    const workflow = this.updateApprovalStep(payment.approvalWorkflow, actor, 'rejected', reason);

    const history = this.createHistoryEntry(workflow.currentStep, 'reject', actor, payment.status, 'rejected', reason);
    workflow.history.push(history);

    const updatedPayment = await this.updatePaymentStatus(blueprintId, paymentId, 'rejected', workflow, actor);

    this.eventBus.emit(
      SystemEventType.PAYMENT_REJECTED,
      {
        paymentId,
        blueprintId,
        reason,
        contractorId: payment.payingParty.id,
        source: 'payment-approval-service'
      },
      actor,
      { source: 'payment-approval-service' }
    );

    this.logger.info('[PaymentApprovalService]', `Payment ${paymentId} rejected: ${reason}`);

    return updatedPayment;
  }

  /**
   * 標記已開票
   *
   * @param blueprintId - 藍圖 ID
   * @param paymentId - 付款單 ID
   * @param actor - 操作者
   * @param invoiceInfo - 開票資訊
   * @returns 更新後的付款單
   */
  async markAsInvoiced(blueprintId: string, paymentId: string, actor: EventActor, invoiceInfo: PaymentInvoiceInfo): Promise<Invoice> {
    this.logger.info('[PaymentApprovalService]', `Marking payment as invoiced: ${paymentId}`);

    const payment = await this.getPayment(blueprintId, paymentId);
    this.validatePayable(payment);

    InvoiceStateMachine.validateTransition(payment.status, 'invoiced');

    const docRef = doc(this.firestore, this.parentCollection, blueprintId, this.subcollectionName, paymentId);

    await updateDoc(docRef, {
      status: 'invoiced',
      // 儲存開票資訊到 metadata
      metadata: {
        invoiceNumber: invoiceInfo.invoiceNumber,
        invoiceDate: Timestamp.fromDate(invoiceInfo.invoiceDate),
        invoiceTaxId: invoiceInfo.taxId,
        invoiceAmount: invoiceInfo.amount,
        invoiceAttachmentIds: invoiceInfo.attachmentIds || []
      },
      updatedBy: actor.userId,
      updatedAt: Timestamp.now()
    });

    const updatedPayment = await this.getPayment(blueprintId, paymentId);

    this.logger.info('[PaymentApprovalService]', `Payment ${paymentId} marked as invoiced: ${invoiceInfo.invoiceNumber}`);

    return updatedPayment;
  }

  /**
   * 記錄付款完成
   *
   * @param blueprintId - 藍圖 ID
   * @param paymentId - 付款單 ID
   * @param actor - 操作者
   * @param paymentInfo - 付款資訊
   * @returns 更新後的付款單
   */
  async markAsPaid(blueprintId: string, paymentId: string, actor: EventActor, paymentInfo: PaymentCompleteInfo): Promise<Invoice> {
    this.logger.info('[PaymentApprovalService]', `Marking payment as paid: ${paymentId}`);

    const payment = await this.getPayment(blueprintId, paymentId);
    this.validatePayable(payment);

    // 判斷是全額付款還是部分付款
    const previousPaid = payment.paidAmount ?? 0;
    const totalPaid = previousPaid + paymentInfo.amount;
    const newStatus: InvoiceStatus = totalPaid >= payment.total ? 'paid' : 'partial_paid';

    InvoiceStateMachine.validateTransition(payment.status, newStatus);

    const docRef = doc(this.firestore, this.parentCollection, blueprintId, this.subcollectionName, paymentId);

    await updateDoc(docRef, {
      status: newStatus,
      paidDate: Timestamp.fromDate(paymentInfo.paidDate ?? new Date()),
      paidAmount: totalPaid,
      paymentMethod: paymentInfo.method,
      // 儲存付款詳情到 metadata
      metadata: {
        ...payment.approvalWorkflow,
        paymentReference: paymentInfo.reference,
        bankInfo: paymentInfo.bankInfo
      },
      updatedBy: actor.userId,
      updatedAt: Timestamp.now()
    });

    const updatedPayment = await this.getPayment(blueprintId, paymentId);

    this.eventBus.emit(
      SystemEventType.PAYMENT_COMPLETED,
      {
        paymentId,
        blueprintId,
        amount: paymentInfo.amount,
        totalPaid,
        isFullyPaid: newStatus === 'paid',
        method: paymentInfo.method,
        contractorId: payment.payingParty.id,
        source: 'payment-approval-service'
      },
      actor,
      { source: 'payment-approval-service' }
    );

    this.logger.info(
      '[PaymentApprovalService]',
      `Payment ${paymentId} ${newStatus}: ${paymentInfo.amount} (total: ${totalPaid}/${payment.total})`
    );

    return updatedPayment;
  }

  /**
   * 取得付款審核歷史
   */
  async getApprovalHistory(blueprintId: string, paymentId: string): Promise<ApprovalHistory[]> {
    const payment = await this.getPayment(blueprintId, paymentId);
    return payment.approvalWorkflow.history;
  }

  // ===== 私有方法 =====

  private async getPayment(blueprintId: string, paymentId: string): Promise<Invoice> {
    const docRef = doc(this.firestore, this.parentCollection, blueprintId, this.subcollectionName, paymentId);

    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) {
      throw new Error(`Payment not found: ${paymentId}`);
    }

    return this.convertToInvoice(snapshot.data(), snapshot.id);
  }

  private convertToInvoice(data: Record<string, unknown>, id: string): Invoice {
    return {
      id,
      blueprintId: data['blueprintId'] as string,
      invoiceNumber: data['invoiceNumber'] as string,
      invoiceType: data['invoiceType'] as Invoice['invoiceType'],
      contractId: data['contractId'] as string,
      acceptanceId: data['acceptanceId'] as string | undefined,
      taskIds: (data['taskIds'] as string[]) || [],
      invoiceItems: (data['invoiceItems'] as Invoice['invoiceItems']) || [],
      subtotal: Number(data['subtotal']) || 0,
      tax: Number(data['tax']) || 0,
      taxRate: Number(data['taxRate']) || 0,
      total: Number(data['total']) || 0,
      billingPercentage: Number(data['billingPercentage']) || 0,
      billingParty: data['billingParty'] as Invoice['billingParty'],
      payingParty: data['payingParty'] as Invoice['payingParty'],
      status: data['status'] as InvoiceStatus,
      approvalWorkflow: (data['approvalWorkflow'] as ApprovalWorkflow) || {
        currentStep: 0,
        totalSteps: 2,
        approvers: [],
        history: []
      },
      dueDate: this.convertTimestamp(data['dueDate']),
      paidDate: data['paidDate'] ? this.convertTimestamp(data['paidDate']) : undefined,
      paidAmount: data['paidAmount'] ? Number(data['paidAmount']) : undefined,
      paymentMethod: data['paymentMethod'] as Invoice['paymentMethod'] | undefined,
      notes: data['notes'] as string | undefined,
      attachments: (data['attachments'] as Invoice['attachments']) || [],
      createdBy: data['createdBy'] as string,
      createdAt: this.convertTimestamp(data['createdAt']),
      updatedBy: data['updatedBy'] as string | undefined,
      updatedAt: this.convertTimestamp(data['updatedAt'])
    };
  }

  private convertTimestamp(value: unknown): Date {
    if (value instanceof Timestamp) {
      return value.toDate();
    }
    if (value instanceof Date) {
      return value;
    }
    return new Date();
  }

  private validatePayable(payment: Invoice): void {
    if (payment.invoiceType !== 'payable') {
      throw new Error(`Not a payment: ${payment.id} is ${payment.invoiceType}`);
    }
  }

  private validatePaymentData(payment: Invoice): void {
    if (!payment.invoiceItems || payment.invoiceItems.length === 0) {
      throw new Error('Payment must have at least one item');
    }
    if (payment.total <= 0) {
      throw new Error('Payment total must be greater than 0');
    }
    if (!payment.payingParty) {
      throw new Error('Payment must have contractor (payingParty) information');
    }
  }

  private initializeApprovalWorkflow(existingWorkflow: ApprovalWorkflow): ApprovalWorkflow {
    return {
      ...existingWorkflow,
      currentStep: 1
    };
  }

  private updateApprovalStep(
    workflow: ApprovalWorkflow,
    actor: EventActor,
    status: 'approved' | 'rejected',
    comments?: string
  ): ApprovalWorkflow {
    const updatedWorkflow = { ...workflow };

    const currentApprover = updatedWorkflow.approvers.find(a => a.stepNumber === updatedWorkflow.currentStep);

    if (currentApprover) {
      currentApprover.status = status;
      currentApprover.approvedAt = new Date();
      currentApprover.comments = comments;
    } else {
      updatedWorkflow.approvers.push({
        stepNumber: updatedWorkflow.currentStep,
        userId: actor.userId,
        userName: actor.userName,
        role: actor.role,
        status,
        approvedAt: new Date(),
        comments
      });
    }

    if (status === 'approved') {
      updatedWorkflow.currentStep++;
    }

    return updatedWorkflow;
  }

  private createHistoryEntry(
    stepNumber: number,
    action: ApprovalAction,
    actor: EventActor,
    previousStatus: InvoiceStatus,
    newStatus: InvoiceStatus,
    comments?: string
  ): ApprovalHistory {
    return {
      id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      stepNumber,
      action,
      userId: actor.userId,
      userName: actor.userName,
      timestamp: new Date(),
      comments,
      previousStatus,
      newStatus
    };
  }

  private async updatePaymentStatus(
    blueprintId: string,
    paymentId: string,
    newStatus: InvoiceStatus,
    approvalWorkflow: ApprovalWorkflow,
    actor: EventActor
  ): Promise<Invoice> {
    const docRef = doc(this.firestore, this.parentCollection, blueprintId, this.subcollectionName, paymentId);

    await updateDoc(docRef, {
      status: newStatus,
      approvalWorkflow,
      updatedBy: actor.userId,
      updatedAt: Timestamp.now()
    });

    return this.getPayment(blueprintId, paymentId);
  }
}
