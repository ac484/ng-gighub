/**
 * Contract Parsing Modal Component
 * 合約解析進度彈窗元件
 *
 * Feature: AI Parsing
 * Responsibility: Show AI parsing progress and results
 * Interface: Modal with progress indicator
 */

import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import type { ParsedContractData } from '@routes/blueprint/modules/contract/data/models';
import { SHARED_IMPORTS } from '@shared';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NzStepsModule } from 'ng-zorro-antd/steps';

/**
 * Modal data interface
 */
export interface ContractParsingModalData {
  contractId: string;
  fileName: string;
}

/**
 * Parsing status
 */
type ParsingStatus = 'pending' | 'processing' | 'completed' | 'failed';

@Component({
  selector: 'app-contract-parsing-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS, NzStepsModule, NzDescriptionsModule],
  template: `
    <div class="parsing-container">
      <!-- Parsing Header -->
      <div class="parsing-header">
        <h3>AI 合約解析</h3>
        <p class="file-name">{{ fileName() }}</p>
      </div>

      <!-- Progress Section -->
      <div class="progress-section">
        @if (status() === 'pending' || status() === 'processing') {
          <!-- Processing State -->
          <div class="processing-state">
            <nz-spin nzSimple [nzSize]="'large'" />
            <h4>{{ processingMessage() }}</h4>
            <p class="hint">這可能需要幾秒鐘時間，請稍候...</p>

            <!-- Progress Steps -->
            <nz-steps [nzCurrent]="currentStep()" nzSize="small" class="mt-lg">
              <nz-step nzTitle="文件上傳" nzDescription="正在準備文件" />
              <nz-step nzTitle="AI 分析" nzDescription="正在解析內容" />
              <nz-step nzTitle="資料提取" nzDescription="正在提取結構化資料" />
              <nz-step nzTitle="完成" nzDescription="解析完成" />
            </nz-steps>
          </div>
        }

        @if (status() === 'completed') {
          <!-- Success State -->
          <nz-result nzStatus="success" nzTitle="解析成功" nzSubTitle="合約已成功解析，請檢視解析結果">
            <div nz-result-extra>
              <!-- Parsed Data Summary -->
              @if (parsedData()) {
                <div class="parsed-summary">
                  <nz-descriptions nzTitle="解析摘要" [nzColumn]="1" nzBordered nzSize="small">
                    @if (parsedData()!.contractNumber) {
                      <nz-descriptions-item nzTitle="合約編號">
                        {{ parsedData()!.contractNumber }}
                      </nz-descriptions-item>
                    }
                    @if (parsedData()!.title) {
                      <nz-descriptions-item nzTitle="合約名稱">
                        {{ parsedData()!.title }}
                      </nz-descriptions-item>
                    }
                    @if (parsedData()!.owner?.name) {
                      <nz-descriptions-item nzTitle="業主">
                        {{ parsedData()!.owner!.name }}
                      </nz-descriptions-item>
                    }
                    @if (parsedData()!.contractor?.name) {
                      <nz-descriptions-item nzTitle="承商">
                        {{ parsedData()!.contractor!.name }}
                      </nz-descriptions-item>
                    }
                    @if (parsedData()!.financial?.totalAmount) {
                      <nz-descriptions-item nzTitle="合約金額">
                        {{ parsedData()!.financial!.totalAmount | currency: 'TWD' }}
                      </nz-descriptions-item>
                    }
                    <nz-descriptions-item nzTitle="信心度">
                      <nz-progress
                        [nzPercent]="parsedData()!.confidenceScore"
                        [nzStatus]="getConfidenceStatus(parsedData()!.confidenceScore)"
                        nzSize="small"
                      />
                    </nz-descriptions-item>
                  </nz-descriptions>

                  <!-- Warnings -->
                  @if (parsedData()!.warnings && parsedData()!.warnings!.length > 0) {
                    <nz-alert nzType="warning" nzMessage="注意事項" [nzDescription]="warningsTemplate" [nzShowIcon]="true" class="mt-md" />
                    <ng-template #warningsTemplate>
                      <ul class="warnings-list">
                        @for (warning of parsedData()!.warnings; track $index) {
                          <li>{{ warning }}</li>
                        }
                      </ul>
                    </ng-template>
                  }
                </div>
              }
            </div>
          </nz-result>
        }

        @if (status() === 'failed') {
          <!-- Error State -->
          <nz-result nzStatus="error" nzTitle="解析失敗" [nzSubTitle]="errorMessage()">
            <div nz-result-extra>
              <button nz-button nzType="primary" (click)="retry()"> 重試 </button>
            </div>
          </nz-result>
        }
      </div>

      <!-- Footer Actions -->
      <div class="modal-footer">
        @if (status() === 'completed') {
          <button nz-button nzType="primary" (click)="confirmParsedData()"> 確認並套用 </button>
          <button nz-button nzType="default" (click)="closeModal()"> 稍後處理 </button>
        } @else if (status() === 'failed') {
          <button nz-button nzType="default" (click)="closeModal()"> 關閉 </button>
        } @else {
          <button nz-button nzType="default" [disabled]="true"> 處理中... </button>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .parsing-container {
        padding: 24px;
      }

      .parsing-header {
        text-align: center;
        margin-bottom: 32px;
      }

      .parsing-header h3 {
        margin: 0;
        font-size: 24px;
        font-weight: 600;
      }

      .parsing-header .file-name {
        margin-top: 8px;
        color: rgba(0, 0, 0, 0.45);
        font-size: 14px;
      }

      .progress-section {
        min-height: 300px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .processing-state {
        text-align: center;
        width: 100%;
      }

      .processing-state h4 {
        margin-top: 16px;
        font-size: 18px;
        font-weight: 500;
      }

      .processing-state .hint {
        color: rgba(0, 0, 0, 0.45);
        margin-top: 8px;
      }

      .parsed-summary {
        text-align: left;
        max-width: 600px;
        margin: 0 auto;
      }

      .warnings-list {
        margin: 0;
        padding-left: 20px;
      }

      .modal-footer {
        margin-top: 24px;
        display: flex;
        justify-content: center;
        gap: 12px;
        padding-top: 24px;
        border-top: 1px solid #f0f0f0;
      }
    `
  ]
})
export class ContractParsingModalComponent {
  private readonly modalRef = inject(NzModalRef);
  private readonly modalData = inject<ContractParsingModalData>(NZ_MODAL_DATA);

  // State
  fileName = signal<string>(this.modalData.fileName);
  status = signal<ParsingStatus>('pending');
  currentStep = signal<number>(0);
  processingMessage = signal<string>('正在準備文件...');
  parsedData = signal<ParsedContractData | null>(null);
  errorMessage = signal<string>('');

  /**
   * Start parsing process
   */
  startParsing(parsedData: ParsedContractData): void {
    // Simulate parsing steps
    this.status.set('processing');
    this.currentStep.set(0);
    this.processingMessage.set('正在上傳文件...');

    setTimeout(() => {
      this.currentStep.set(1);
      this.processingMessage.set('正在進行 AI 分析...');
    }, 1000);

    setTimeout(() => {
      this.currentStep.set(2);
      this.processingMessage.set('正在提取結構化資料...');
    }, 2000);

    setTimeout(() => {
      this.currentStep.set(3);
      this.status.set('completed');
      this.parsedData.set(parsedData);
    }, 3000);
  }

  /**
   * Handle parsing failure
   */
  setError(message: string): void {
    this.status.set('failed');
    this.errorMessage.set(message);
  }

  /**
   * Retry parsing
   */
  retry(): void {
    this.status.set('pending');
    this.currentStep.set(0);
    this.errorMessage.set('');
    this.modalRef.triggerOk();
  }

  /**
   * Confirm parsed data
   */
  confirmParsedData(): void {
    this.modalRef.close(this.parsedData());
  }

  /**
   * Close modal
   */
  closeModal(): void {
    this.modalRef.close(null);
  }

  /**
   * Get confidence status color
   */
  getConfidenceStatus(score: number): 'success' | 'normal' | 'exception' {
    if (score >= 80) return 'success';
    if (score >= 60) return 'normal';
    return 'exception';
  }
}
