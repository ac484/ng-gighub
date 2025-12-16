/**
 * Invoice Approval Service - 請款審核工作流程服務
 *
 * SETC-026: Invoice Approval Workflow Implementation
 *
 * 實作請款審核工作流程，支援：
 * - 送出審核 (submit)
 * - 核准請款 (approve)
 * - 退回請款 (reject)
 * - 多級審核機制
 * - 審核歷史記錄
 *
 * 狀態流程:
 * draft → submitted → under_review → approved → invoiced → paid
 *                                  ↘ rejected → draft
 *
 * @module InvoiceApprovalService
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
import type { Invoice, InvoiceStatus, ApprovalWorkflow, Approver, ApprovalHistory, ApprovalAction } from '../models/invoice.model';

/**
 * 送出審核選項
 */
export interface SubmitOptions {
  /** 送出備註 */
  comments?: string;
  /** 指定審核者（可選，會覆寫預設審核者） */
  approvers?: Array<{ userId: string; userName: string; role: string }>;
}

/**
 * 審核選項
 */
export interface ApprovalOptions {
  /** 審核意見 */
  comments?: string;
}

/**
 * 退回選項
 */
export interface RejectOptions {
  /** 退回原因（必填） */
  reason: string;
}

/**
 * 請款審核工作流程服務
 *
 * 提供請款單審核流程管理功能
 */
@Injectable({ providedIn: 'root' })
export class InvoiceApprovalService {
  private readonly firestore = inject(Firestore);
  private readonly logger = inject(LoggerService);
  private readonly eventBus = inject(EnhancedEventBusService);

  private readonly parentCollection = 'blueprints';
  private readonly subcollectionName = 'invoices';

  /**
   * 送出請款單進行審核
   *
   * @param blueprintId - 藍圖 ID
   * @param invoiceId - 請款單 ID
   * @param actor - 操作者
   * @param options - 送出選項
   * @returns 更新後的請款單
   */
  async submit(blueprintId: string, invoiceId: string, actor: EventActor, options?: SubmitOptions): Promise<Invoice> {
    this.logger.info('[InvoiceApprovalService]', `Submitting invoice: ${invoiceId}`);

    const invoice = await this.getInvoice(blueprintId, invoiceId);

    // 驗證狀態轉換
    InvoiceStateMachine.validateTransition(invoice.status, 'submitted');

    // 驗證請款單資料完整性
    this.validateInvoiceData(invoice);

    // 初始化或更新審核流程
    const approvalWorkflow = this.initializeApprovalWorkflow(invoice.approvalWorkflow, options?.approvers);

    // 記錄歷史
    const history = this.createHistoryEntry(approvalWorkflow.currentStep, 'submit', actor, invoice.status, 'submitted', options?.comments);
    approvalWorkflow.history.push(history);

    // 更新請款單
    const updatedInvoice = await this.updateInvoiceStatus(blueprintId, invoiceId, 'submitted', approvalWorkflow, actor);

    // 發送事件
    this.eventBus.emit(
      SystemEventType.INVOICE_SUBMITTED,
      {
        invoiceId,
        invoiceNumber: invoice.invoiceNumber,
        blueprintId,
        previousStatus: invoice.status,
        newStatus: 'submitted',
        submittedBy: actor.userId,
        source: 'invoice-approval-service'
      },
      actor,
      { source: 'invoice-approval-service' }
    );

    this.logger.info('[InvoiceApprovalService]', `Invoice ${invoiceId} submitted for approval`);

    return updatedInvoice;
  }

  /**
   * 核准請款單
   *
   * @param blueprintId - 藍圖 ID
   * @param invoiceId - 請款單 ID
   * @param actor - 操作者
   * @param options - 核准選項
   * @returns 更新後的請款單
   */
  async approve(blueprintId: string, invoiceId: string, actor: EventActor, options?: ApprovalOptions): Promise<Invoice> {
    this.logger.info('[InvoiceApprovalService]', `Approving invoice: ${invoiceId}`);

    const invoice = await this.getInvoice(blueprintId, invoiceId);

    // 驗證狀態
    if (!InvoiceStateMachine.isPendingApproval(invoice.status)) {
      throw new InvoiceStatusError(`Invoice is not pending approval: current status is ${invoice.status}`, {
        from: invoice.status,
        to: 'approved',
        allowed: InvoiceStateMachine.getAvailableTransitions(invoice.status)
      });
    }

    // 驗證審核權限
    this.validateApprovalPermission(invoice.approvalWorkflow, actor);

    // 更新審核步驟
    const workflow = this.updateApprovalStep(invoice.approvalWorkflow, actor, 'approved', options?.comments);

    // 判斷是否所有審核都已通過
    const isFullyApproved = workflow.currentStep >= workflow.totalSteps;
    const newStatus: InvoiceStatus = isFullyApproved ? 'approved' : 'under_review';

    // 記錄歷史
    const history = this.createHistoryEntry(
      workflow.currentStep - 1, // 記錄剛完成的步驟
      'approve',
      actor,
      invoice.status,
      newStatus,
      options?.comments
    );
    workflow.history.push(history);

    // 更新請款單
    const updatedInvoice = await this.updateInvoiceStatus(blueprintId, invoiceId, newStatus, workflow, actor);

    // 發送事件
    this.eventBus.emit(
      SystemEventType.INVOICE_APPROVED,
      {
        invoiceId,
        invoiceNumber: invoice.invoiceNumber,
        blueprintId,
        previousStatus: invoice.status,
        newStatus,
        isFullyApproved,
        currentStep: workflow.currentStep,
        totalSteps: workflow.totalSteps,
        approvedBy: actor.userId,
        source: 'invoice-approval-service'
      },
      actor,
      { source: 'invoice-approval-service' }
    );

    this.logger.info(
      '[InvoiceApprovalService]',
      `Invoice ${invoiceId} approved (step ${workflow.currentStep}/${workflow.totalSteps}, fully: ${isFullyApproved})`
    );

    return updatedInvoice;
  }

  /**
   * 退回請款單
   *
   * @param blueprintId - 藍圖 ID
   * @param invoiceId - 請款單 ID
   * @param actor - 操作者
   * @param options - 退回選項（必須包含退回原因）
   * @returns 更新後的請款單
   */
  async reject(blueprintId: string, invoiceId: string, actor: EventActor, options: RejectOptions): Promise<Invoice> {
    this.logger.info('[InvoiceApprovalService]', `Rejecting invoice: ${invoiceId}`);

    if (!options.reason || options.reason.trim() === '') {
      throw new Error('Rejection reason is required');
    }

    const invoice = await this.getInvoice(blueprintId, invoiceId);

    // 驗證狀態
    if (!InvoiceStateMachine.isPendingApproval(invoice.status)) {
      throw new InvoiceStatusError(`Invoice is not pending approval: current status is ${invoice.status}`, {
        from: invoice.status,
        to: 'rejected',
        allowed: InvoiceStateMachine.getAvailableTransitions(invoice.status)
      });
    }

    // 驗證審核權限
    this.validateApprovalPermission(invoice.approvalWorkflow, actor);

    // 更新審核步驟
    const workflow = this.updateApprovalStep(invoice.approvalWorkflow, actor, 'rejected', options.reason);

    // 記錄歷史
    const history = this.createHistoryEntry(workflow.currentStep, 'reject', actor, invoice.status, 'rejected', options.reason);
    workflow.history.push(history);

    // 更新請款單
    const updatedInvoice = await this.updateInvoiceStatus(blueprintId, invoiceId, 'rejected', workflow, actor);

    // 發送事件
    this.eventBus.emit(
      SystemEventType.INVOICE_REJECTED,
      {
        invoiceId,
        invoiceNumber: invoice.invoiceNumber,
        blueprintId,
        previousStatus: invoice.status,
        newStatus: 'rejected',
        reason: options.reason,
        rejectedBy: actor.userId,
        source: 'invoice-approval-service'
      },
      actor,
      { source: 'invoice-approval-service' }
    );

    this.logger.info('[InvoiceApprovalService]', `Invoice ${invoiceId} rejected: ${options.reason}`);

    return updatedInvoice;
  }

  /**
   * 取消請款單
   *
   * @param blueprintId - 藍圖 ID
   * @param invoiceId - 請款單 ID
   * @param actor - 操作者
   * @param reason - 取消原因
   * @returns 更新後的請款單
   */
  async cancel(blueprintId: string, invoiceId: string, actor: EventActor, reason: string): Promise<Invoice> {
    this.logger.info('[InvoiceApprovalService]', `Cancelling invoice: ${invoiceId}`);

    const invoice = await this.getInvoice(blueprintId, invoiceId);

    // 驗證狀態轉換
    InvoiceStateMachine.validateTransition(invoice.status, 'cancelled');

    // 記錄歷史
    const workflow = { ...invoice.approvalWorkflow };
    const history = this.createHistoryEntry(workflow.currentStep, 'cancel', actor, invoice.status, 'cancelled', reason);
    workflow.history.push(history);

    // 更新請款單
    const updatedInvoice = await this.updateInvoiceStatus(blueprintId, invoiceId, 'cancelled', workflow, actor);

    this.logger.info('[InvoiceApprovalService]', `Invoice ${invoiceId} cancelled: ${reason}`);

    return updatedInvoice;
  }

  /**
   * 將請款單退回草稿狀態（重新編輯）
   *
   * @param blueprintId - 藍圖 ID
   * @param invoiceId - 請款單 ID
   * @param actor - 操作者
   * @returns 更新後的請款單
   */
  async returnToDraft(blueprintId: string, invoiceId: string, actor: EventActor): Promise<Invoice> {
    this.logger.info('[InvoiceApprovalService]', `Returning invoice to draft: ${invoiceId}`);

    const invoice = await this.getInvoice(blueprintId, invoiceId);

    // 驗證狀態轉換
    InvoiceStateMachine.validateTransition(invoice.status, 'draft');

    // 重置審核流程
    const workflow = this.resetApprovalWorkflow(invoice.approvalWorkflow);

    // 記錄歷史
    const history = this.createHistoryEntry(0, 'return', actor, invoice.status, 'draft', '退回草稿重新編輯');
    workflow.history.push(history);

    // 更新請款單
    const updatedInvoice = await this.updateInvoiceStatus(blueprintId, invoiceId, 'draft', workflow, actor);

    this.logger.info('[InvoiceApprovalService]', `Invoice ${invoiceId} returned to draft`);

    return updatedInvoice;
  }

  /**
   * 取得待審核的請款單列表
   *
   * @param blueprintId - 藍圖 ID
   * @param userId - 審核者 ID
   * @returns 待審核的請款單列表
   */
  async getPendingApproval(blueprintId: string, userId: string): Promise<Invoice[]> {
    // TODO: 實作查詢邏輯（需要 Repository 支援）
    // 此方法將在 SETC-029 或後續任務中完整實作
    this.logger.info('[InvoiceApprovalService]', `Getting pending approvals for user ${userId} in blueprint ${blueprintId}`);
    return [];
  }

  /**
   * 取得審核歷史
   *
   * @param blueprintId - 藍圖 ID
   * @param invoiceId - 請款單 ID
   * @returns 審核歷史列表
   */
  async getApprovalHistory(blueprintId: string, invoiceId: string): Promise<ApprovalHistory[]> {
    const invoice = await this.getInvoice(blueprintId, invoiceId);
    return invoice.approvalWorkflow.history;
  }

  // ===== 私有方法 =====

  /**
   * 取得請款單
   */
  private async getInvoice(blueprintId: string, invoiceId: string): Promise<Invoice> {
    const docRef = doc(this.firestore, this.parentCollection, blueprintId, this.subcollectionName, invoiceId);

    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) {
      throw new Error(`Invoice not found: ${invoiceId}`);
    }

    const data = snapshot.data();
    return this.convertToInvoice(data, snapshot.id);
  }

  /**
   * 轉換 Firestore 資料為 Invoice 物件
   */
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

  /**
   * 轉換 Timestamp 為 Date
   */
  private convertTimestamp(value: unknown): Date {
    if (value instanceof Timestamp) {
      return value.toDate();
    }
    if (value instanceof Date) {
      return value;
    }
    return new Date();
  }

  /**
   * 驗證請款單資料完整性
   */
  private validateInvoiceData(invoice: Invoice): void {
    if (!invoice.invoiceItems || invoice.invoiceItems.length === 0) {
      throw new Error('Invoice must have at least one item');
    }
    if (invoice.total <= 0) {
      throw new Error('Invoice total must be greater than 0');
    }
    if (!invoice.billingParty || !invoice.payingParty) {
      throw new Error('Invoice must have billing and paying party information');
    }
  }

  /**
   * 初始化審核流程
   */
  private initializeApprovalWorkflow(
    existingWorkflow: ApprovalWorkflow,
    customApprovers?: Array<{ userId: string; userName: string; role: string }>
  ): ApprovalWorkflow {
    const workflow = { ...existingWorkflow };

    if (customApprovers && customApprovers.length > 0) {
      workflow.approvers = customApprovers.map(
        (approver, index): Approver => ({
          stepNumber: index + 1,
          userId: approver.userId,
          userName: approver.userName,
          role: approver.role,
          status: 'pending'
        })
      );
      workflow.totalSteps = customApprovers.length;
    }

    workflow.currentStep = 1;
    return workflow;
  }

  /**
   * 驗證審核權限
   */
  private validateApprovalPermission(workflow: ApprovalWorkflow, actor: EventActor): void {
    // 如果沒有指定審核者，允許任何人審核（簡化版）
    if (!workflow.approvers || workflow.approvers.length === 0) {
      return;
    }

    const currentApprover = workflow.approvers.find(a => a.stepNumber === workflow.currentStep);

    if (currentApprover && currentApprover.userId !== actor.userId) {
      throw new Error(
        `User ${actor.userId} is not the approver for step ${workflow.currentStep}. ` + `Expected: ${currentApprover.userId}`
      );
    }
  }

  /**
   * 更新審核步驟
   */
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
      // 如果沒有預定審核者，動態新增
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

  /**
   * 重置審核流程
   */
  private resetApprovalWorkflow(workflow: ApprovalWorkflow): ApprovalWorkflow {
    return {
      currentStep: 0,
      totalSteps: workflow.totalSteps,
      approvers: workflow.approvers.map(a => ({
        ...a,
        status: 'pending' as const,
        approvedAt: undefined,
        comments: undefined
      })),
      history: [...workflow.history]
    };
  }

  /**
   * 建立歷史記錄項目
   */
  private createHistoryEntry(
    stepNumber: number,
    action: ApprovalAction,
    actor: EventActor,
    previousStatus: InvoiceStatus,
    newStatus: InvoiceStatus,
    comments?: string
  ): ApprovalHistory {
    return {
      id: this.generateId(),
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

  /**
   * 更新請款單狀態
   */
  private async updateInvoiceStatus(
    blueprintId: string,
    invoiceId: string,
    newStatus: InvoiceStatus,
    approvalWorkflow: ApprovalWorkflow,
    actor: EventActor
  ): Promise<Invoice> {
    const docRef = doc(this.firestore, this.parentCollection, blueprintId, this.subcollectionName, invoiceId);

    const now = new Date();
    await updateDoc(docRef, {
      status: newStatus,
      approvalWorkflow,
      updatedBy: actor.userId,
      updatedAt: Timestamp.fromDate(now)
    });

    // 重新取得更新後的請款單
    return this.getInvoice(blueprintId, invoiceId);
  }

  /**
   * 生成唯一 ID
   */
  private generateId(): string {
    return `hist_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}
