/**
 * Approval Dialog Component - 審核對話框
 *
 * SETC-030: Invoice/Payment UI Components
 *
 * 提供請款/付款單審核操作介面：
 * - 顯示單據資訊
 * - 核准/退回選擇
 * - 審核意見輸入
 *
 * @module ApprovalDialogComponent
 * @author GigHub Development Team
 * @date 2025-12-16
 */

import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal
} from '@angular/core';
import { NzModalRef, NZ_MODAL_DATA } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';

import { SHARED_IMPORTS } from '@shared';
import type { Invoice } from '@core/blueprint/modules/implementations/finance';

/**
 * 審核對話框輸入資料
 */
export interface ApprovalDialogData {
  invoice: Invoice;
}

/**
 * 審核對話框元件
 */
@Component({
  selector: 'app-approval-dialog',
  standalone: true,
  imports: [SHARED_IMPORTS],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="approval-dialog">
      <!-- 單據資訊 -->
      <nz-card nzSize="small" nzTitle="單據資訊" style="margin-bottom: 16px;">
        <div nz-row [nzGutter]="16">
          <div nz-col [nzSpan]="12">
            <div style="margin-bottom: 8px;">
              <span style="color: #666;">單據編號：</span>
              <strong>{{ data.invoice.invoiceNumber }}</strong>
            </div>
          </div>
          <div nz-col [nzSpan]="12">
            <div style="margin-bottom: 8px;">
              <span style="color: #666;">單據類型：</span>
              <nz-tag [nzColor]="data.invoice.invoiceType === 'receivable' ? 'blue' : 'orange'">
                {{ data.invoice.invoiceType === 'receivable' ? '請款單' : '付款單' }}
              </nz-tag>
            </div>
          </div>
          <div nz-col [nzSpan]="12">
            <div style="margin-bottom: 8px;">
              <span style="color: #666;">金額：</span>
              <span style="color: #1890ff; font-weight: bold; font-size: 16px;">
                ${{ data.invoice.total | number }}
              </span>
            </div>
          </div>
          <div nz-col [nzSpan]="12">
            <div style="margin-bottom: 8px;">
              <span style="color: #666;">當前狀態：</span>
              <nz-tag [nzColor]="getStatusColor(data.invoice.status)">
                {{ getStatusLabel(data.invoice.status) }}
              </nz-tag>
            </div>
          </div>
          <div nz-col [nzSpan]="12">
            <div style="margin-bottom: 8px;">
              <span style="color: #666;">{{ data.invoice.invoiceType === 'receivable' ? '請款方' : '付款方' }}：</span>
              {{ data.invoice.billingParty.name }}
            </div>
          </div>
          <div nz-col [nzSpan]="12">
            <div style="margin-bottom: 8px;">
              <span style="color: #666;">{{ data.invoice.invoiceType === 'receivable' ? '付款方' : '收款方' }}：</span>
              {{ data.invoice.payingParty.name }}
            </div>
          </div>
        </div>
      </nz-card>

      <nz-divider nzText="審核意見"></nz-divider>

      <!-- 審核結果選擇 -->
      <nz-form-item>
        <nz-form-label [nzSpan]="4">審核結果</nz-form-label>
        <nz-form-control [nzSpan]="20">
          <nz-radio-group [(ngModel)]="approvalResult">
            <label nz-radio nzValue="approve">
              <span nz-icon nzType="check-circle" style="color: #52c41a;"></span>
              核准
            </label>
            <label nz-radio nzValue="reject">
              <span nz-icon nzType="close-circle" style="color: #ff4d4f;"></span>
              退回
            </label>
          </nz-radio-group>
        </nz-form-control>
      </nz-form-item>

      <!-- 審核意見 -->
      <nz-form-item>
        <nz-form-label [nzSpan]="4" [nzRequired]="approvalResult === 'reject'">
          備註
        </nz-form-label>
        <nz-form-control [nzSpan]="20">
          <textarea
            nz-input
            [(ngModel)]="comments"
            [rows]="4"
            [placeholder]="approvalResult === 'reject' ? '請填寫退回原因（必填）' : '選填審核意見'">
          </textarea>
          @if (approvalResult === 'reject' && !comments) {
            <div style="color: #ff4d4f; margin-top: 4px;">
              退回時必須填寫原因
            </div>
          }
        </nz-form-control>
      </nz-form-item>

      <!-- 操作按鈕 -->
      <div style="text-align: right; margin-top: 16px;">
        <button nz-button nzType="default" (click)="cancel()">取消</button>
        <button
          nz-button
          [nzType]="approvalResult === 'approve' ? 'primary' : 'default'"
          [nzDanger]="approvalResult === 'reject'"
          [nzLoading]="submitting()"
          [disabled]="!canSubmit()"
          (click)="confirm()"
          style="margin-left: 8px;">
          {{ approvalResult === 'approve' ? '確認核准' : '確認退回' }}
        </button>
      </div>
    </div>
  `
})
export class ApprovalDialogComponent {
  private readonly modalRef = inject(NzModalRef);
  private readonly message = inject(NzMessageService);

  /** 輸入資料 */
  readonly data: ApprovalDialogData = inject(NZ_MODAL_DATA);

  /** 審核結果 */
  approvalResult: 'approve' | 'reject' = 'approve';

  /** 審核意見 */
  comments = '';

  /** 提交中狀態 */
  submitting = signal(false);

  /** 狀態顏色對應 */
  private statusColors: Record<string, string> = {
    draft: 'default',
    submitted: 'processing',
    under_review: 'warning',
    approved: 'success',
    rejected: 'error',
    invoiced: 'cyan',
    partial_paid: 'orange',
    paid: 'green',
    cancelled: 'default'
  };

  /** 狀態標籤對應 */
  private statusLabels: Record<string, string> = {
    draft: '草稿',
    submitted: '已送出',
    under_review: '審核中',
    approved: '已核准',
    rejected: '已退回',
    invoiced: '已開票',
    partial_paid: '部分付款',
    paid: '已付款',
    cancelled: '已取消'
  };

  /** 取得狀態顏色 */
  getStatusColor(status: string): string {
    return this.statusColors[status] ?? 'default';
  }

  /** 取得狀態標籤 */
  getStatusLabel(status: string): string {
    return this.statusLabels[status] ?? status;
  }

  /** 是否可提交 */
  canSubmit(): boolean {
    if (this.approvalResult === 'reject' && !this.comments.trim()) {
      return false;
    }
    return true;
  }

  /** 取消 */
  cancel(): void {
    this.modalRef.close(false);
  }

  /** 確認審核 */
  async confirm(): Promise<void> {
    if (!this.canSubmit()) {
      this.message.warning('退回時必須填寫原因');
      return;
    }

    this.submitting.set(true);

    try {
      // MVP: 模擬 API 呼叫
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (this.approvalResult === 'approve') {
        this.message.success('審核通過');
      } else {
        this.message.success('已退回');
      }

      this.modalRef.close({
        result: this.approvalResult,
        comments: this.comments
      });
    } catch (error) {
      this.message.error('操作失敗，請稍後再試');
    } finally {
      this.submitting.set(false);
    }
  }
}
