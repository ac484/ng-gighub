/**
 * Contract OCR Preview Component
 *
 * Preview and review OCR-parsed contract data before confirmation.
 * Integrates with ContractDraftService for real-time draft updates.
 *
 * Flow: Upload → OCR Parse → **Preview/Edit** → Confirm → Official Contract
 *
 * Features:
 * - Real-time draft status updates via Firestore subscription
 * - OCR parsing status display with loading indicators
 * - Parsed data preview with confidence scores
 * - Edit parsed data before confirmation
 * - Confirm or reject draft actions
 * - Retry OCR parsing on failure
 *
 * @author GigHub Development Team
 * @date 2025-12-18
 */

import { Component, ChangeDetectionStrategy, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ContractDraftService,
  ContractDraft,
  ContractDraftStatus,
  ParsedContractData
} from '@core/blueprint/modules/implementations/contract/services/contract-draft.service';
import { SettingsService, User } from '@delon/theme';
import { SHARED_IMPORTS } from '@shared';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzResultModule } from 'ng-zorro-antd/result';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzStepsModule } from 'ng-zorro-antd/steps';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';

@Component({
  selector: 'app-contract-ocr-preview',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SHARED_IMPORTS,
    NzCardModule,
    NzSpinModule,
    NzAlertModule,
    NzButtonModule,
    NzIconModule,
    NzProgressModule,
    NzStepsModule,
    NzDescriptionsModule,
    NzTableModule,
    NzTagModule,
    NzDividerModule,
    NzResultModule,
    NzSkeletonModule,
    NzEmptyModule
  ],
  template: `
    <div class="ocr-preview-container">
      <!-- Loading State -->
      @if (loading()) {
        <nz-card>
          <nz-skeleton [nzActive]="true" [nzParagraph]="{ rows: 8 }"></nz-skeleton>
        </nz-card>
      } @else if (error()) {
        <!-- Error State -->
        <nz-result nzStatus="error" [nzTitle]="'載入失敗'" [nzSubTitle]="error() || ''">
          <div nz-result-extra>
            <button nz-button nzType="primary" (click)="retryLoad()">重試</button>
            <button nz-button (click)="goBack()">返回</button>
          </div>
        </nz-result>
      } @else if (draft()) {
        <!-- Draft Content -->
        <nz-card [nzTitle]="'合約 OCR 解析預覽'" [nzExtra]="draftActions">
          <!-- Status Steps -->
          <div class="mb-lg">
            <nz-steps [nzCurrent]="currentStep()" nzSize="small">
              <nz-step nzTitle="上傳" nzIcon="upload"></nz-step>
              <nz-step nzTitle="解析中" nzIcon="loading" [nzStatus]="getStepStatus('parsing')"></nz-step>
              <nz-step nzTitle="已解析" nzIcon="file-text"></nz-step>
              <nz-step nzTitle="確認中" nzIcon="edit"></nz-step>
              <nz-step nzTitle="已確認" nzIcon="check-circle"></nz-step>
            </nz-steps>
          </div>

          <!-- Parsing in Progress -->
          @if (isParsing()) {
            <div class="parsing-status text-center py-lg">
              <nz-spin nzSize="large" nzTip="AI 正在解析合約內容..."></nz-spin>
              <p class="mt-md text-grey">這可能需要 30 秒到 2 分鐘，請耐心等待。</p>
              <p class="text-grey">您可以離開此頁面，稍後再回來查看結果。</p>
            </div>
          } @else if (hasError()) {
            <!-- Parsing Error -->
            <nz-result nzStatus="warning" nzTitle="解析失敗" [nzSubTitle]="draft()?.errorMessage || '未知錯誤'">
              <div nz-result-extra>
                <button nz-button nzType="primary" (click)="retryParsing()">重新解析</button>
                <button nz-button nzDanger (click)="rejectDraft()">放棄此草稿</button>
              </div>
            </nz-result>
          } @else if (isConfirmed()) {
            <!-- Already Confirmed -->
            <nz-result nzStatus="success" nzTitle="合約已確認" nzSubTitle="此草稿已成功轉換為正式合約">
              <div nz-result-extra>
                <button nz-button nzType="primary" (click)="viewContract()">查看合約</button>
                <button nz-button (click)="goBack()">返回列表</button>
              </div>
            </nz-result>
          } @else if (parsedData()) {
            <!-- Parsed Data Preview -->
            <div class="parsed-data-preview">
              <!-- Confidence Score -->
              <nz-alert nzType="info" [nzMessage]="'AI 解析信心度: ' + (confidence() * 100).toFixed(0) + '%'" nzShowIcon class="mb-md">
                <ng-template #description>
                  <nz-progress
                    [nzPercent]="confidence() * 100"
                    [nzStatus]="confidence() >= 0.8 ? 'success' : confidence() >= 0.6 ? 'normal' : 'exception'"
                    nzSize="small"
                  ></nz-progress>
                  <p class="mt-sm text-grey">{{ getConfidenceDescription() }}</p>
                </ng-template>
              </nz-alert>

              <!-- Basic Information -->
              <nz-divider nzText="基本資訊" nzOrientation="left"></nz-divider>
              <nz-descriptions nzBordered [nzColumn]="3" nzSize="small">
                <nz-descriptions-item nzTitle="合約編號">{{ parsedData()?.contractNumber || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="合約名稱" [nzSpan]="2">{{ parsedData()?.contractTitle || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="總金額">
                  {{ parsedData()?.totalAmount | number }} {{ parsedData()?.currency || 'TWD' }}
                </nz-descriptions-item>
                <nz-descriptions-item nzTitle="開始日期">{{ parsedData()?.startDate || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="結束日期">{{ parsedData()?.endDate || '-' }}</nz-descriptions-item>
              </nz-descriptions>

              <!-- Party A (Owner) -->
              @if (parsedData()?.partyA) {
                <nz-divider nzText="甲方 (業主)" nzOrientation="left"></nz-divider>
                <nz-descriptions nzBordered [nzColumn]="3" nzSize="small">
                  <nz-descriptions-item nzTitle="名稱">{{ parsedData()!.partyA!.name || '-' }}</nz-descriptions-item>
                  <nz-descriptions-item nzTitle="代表人">{{ parsedData()!.partyA!.representative || '-' }}</nz-descriptions-item>
                  <nz-descriptions-item nzTitle="統一編號">{{ parsedData()!.partyA!.taxId || '-' }}</nz-descriptions-item>
                  <nz-descriptions-item nzTitle="地址" [nzSpan]="2">{{ parsedData()!.partyA!.address || '-' }}</nz-descriptions-item>
                  <nz-descriptions-item nzTitle="電話">{{ parsedData()!.partyA!.phone || '-' }}</nz-descriptions-item>
                </nz-descriptions>
              }

              <!-- Party B (Contractor) -->
              @if (parsedData()?.partyB) {
                <nz-divider nzText="乙方 (承商)" nzOrientation="left"></nz-divider>
                <nz-descriptions nzBordered [nzColumn]="3" nzSize="small">
                  <nz-descriptions-item nzTitle="名稱">{{ parsedData()!.partyB!.name || '-' }}</nz-descriptions-item>
                  <nz-descriptions-item nzTitle="代表人">{{ parsedData()!.partyB!.representative || '-' }}</nz-descriptions-item>
                  <nz-descriptions-item nzTitle="統一編號">{{ parsedData()!.partyB!.taxId || '-' }}</nz-descriptions-item>
                  <nz-descriptions-item nzTitle="地址" [nzSpan]="2">{{ parsedData()!.partyB!.address || '-' }}</nz-descriptions-item>
                  <nz-descriptions-item nzTitle="電話">{{ parsedData()!.partyB!.phone || '-' }}</nz-descriptions-item>
                </nz-descriptions>
              }

              <!-- Work Items -->
              @if (workItems().length > 0) {
                <nz-divider nzText="工項清單" nzOrientation="left"></nz-divider>
                <nz-table
                  #workItemsTable
                  [nzData]="workItems()"
                  [nzPageSize]="10"
                  nzSize="small"
                  [nzShowPagination]="workItems().length > 10"
                >
                  <thead>
                    <tr>
                      <th nzWidth="80px">項次</th>
                      <th>描述</th>
                      <th nzWidth="80px">單位</th>
                      <th nzWidth="100px">數量</th>
                      <th nzWidth="120px">單價</th>
                      <th nzWidth="120px">總價</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (item of workItemsTable.data; track $index) {
                      <tr>
                        <td>{{ item.itemNo || $index + 1 }}</td>
                        <td>{{ item.description || '-' }}</td>
                        <td>{{ item.unit || '-' }}</td>
                        <td>{{ item.quantity || 0 }}</td>
                        <td>{{ item.unitPrice | number }}</td>
                        <td>{{ item.totalPrice | number }}</td>
                      </tr>
                    }
                  </tbody>
                </nz-table>
              } @else {
                <nz-divider nzText="工項清單" nzOrientation="left"></nz-divider>
                <nz-empty nzNotFoundContent="未解析到工項資料"></nz-empty>
              }

              <!-- Terms -->
              @if (parsedData()?.terms) {
                <nz-divider nzText="合約條款" nzOrientation="left"></nz-divider>
                <nz-descriptions nzBordered [nzColumn]="1" nzSize="small">
                  @if (parsedData()!.terms!.paymentTerms) {
                    <nz-descriptions-item nzTitle="付款條件">{{ parsedData()!.terms!.paymentTerms }}</nz-descriptions-item>
                  }
                  @if (parsedData()!.terms!.warrantyPeriod) {
                    <nz-descriptions-item nzTitle="保固期間">{{ parsedData()!.terms!.warrantyPeriod }}</nz-descriptions-item>
                  }
                  @if (parsedData()!.terms!.penaltyClause) {
                    <nz-descriptions-item nzTitle="罰則條款">{{ parsedData()!.terms!.penaltyClause }}</nz-descriptions-item>
                  }
                </nz-descriptions>
              }

              <!-- Original File Info -->
              <nz-divider nzText="原始檔案" nzOrientation="left"></nz-divider>
              <nz-descriptions nzBordered [nzColumn]="3" nzSize="small">
                <nz-descriptions-item nzTitle="檔案名稱">{{ draft()?.originalFile?.fileName || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="檔案類型">{{ draft()?.originalFile?.fileType || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="檔案大小">{{ formatFileSize(draft()?.originalFile?.fileSize || 0) }}</nz-descriptions-item>
              </nz-descriptions>

              <!-- Action Buttons -->
              <div class="action-buttons mt-lg">
                <button nz-button nzType="default" (click)="goBack()">
                  <span nz-icon nzType="arrow-left"></span>
                  返回
                </button>
                <button nz-button nzType="default" (click)="retryParsing()" class="ml-sm">
                  <span nz-icon nzType="reload"></span>
                  重新解析
                </button>
                <button nz-button nzDanger (click)="rejectDraft()" class="ml-sm">
                  <span nz-icon nzType="close-circle"></span>
                  放棄草稿
                </button>
                <button nz-button nzType="primary" (click)="confirmDraft()" class="ml-sm" [nzLoading]="confirming()">
                  <span nz-icon nzType="check-circle"></span>
                  確認並建立合約
                </button>
              </div>
            </div>
          } @else {
            <nz-empty nzNotFoundContent="無解析資料"></nz-empty>
          }
        </nz-card>

        <!-- Draft Actions Template -->
        <ng-template #draftActions>
          <nz-tag [nzColor]="getStatusColor(draft()?.status || 'uploaded')">{{ getStatusLabel(draft()?.status || 'uploaded') }}</nz-tag>
        </ng-template>
      } @else {
        <!-- No Draft Found -->
        <nz-result nzStatus="404" nzTitle="找不到草稿" nzSubTitle="指定的草稿不存在或已被刪除">
          <div nz-result-extra>
            <button nz-button nzType="primary" (click)="goBack()">返回</button>
          </div>
        </nz-result>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .ocr-preview-container {
        padding: 16px;
        max-width: 1200px;
        margin: 0 auto;
      }
      .parsing-status {
        padding: 48px;
      }
      .action-buttons {
        text-align: right;
        padding-top: 16px;
        border-top: 1px solid #f0f0f0;
      }
      .text-grey {
        color: rgba(0, 0, 0, 0.45);
      }
      .text-center {
        text-align: center;
      }
    `
  ]
})
export class ContractOcrPreviewComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly draftService = inject(ContractDraftService);
  private readonly message = inject(NzMessageService);
  private readonly modal = inject(NzModalService);
  private readonly settings = inject(SettingsService);

  // Route parameters
  private blueprintId = '';
  private draftId = '';

  // State from service
  readonly draft = this.draftService.currentDraft;
  readonly loading = this.draftService.loading;
  readonly error = this.draftService.error;
  readonly parsedData = this.draftService.parsedData;
  readonly confidence = this.draftService.confidence;

  // Local state
  confirming = signal(false);

  // Computed states
  isParsing = computed(() => {
    const d = this.draft();
    return d?.status === 'parsing';
  });

  hasError = computed(() => {
    const d = this.draft();
    return d?.status === 'error';
  });

  isConfirmed = computed(() => {
    const d = this.draft();
    return d?.status === 'confirmed';
  });

  currentStep = computed(() => {
    const d = this.draft();
    if (!d) return 0;
    switch (d.status) {
      case 'uploaded':
        return 0;
      case 'parsing':
        return 1;
      case 'parsed':
      case 'draft':
        return 2;
      case 'user_reviewed':
        return 3;
      case 'confirmed':
        return 4;
      default:
        return 0;
    }
  });

  workItems = computed(() => {
    const data = this.parsedData();
    return data?.workItems || [];
  });

  ngOnInit(): void {
    // Get route parameters
    this.blueprintId = this.route.snapshot.paramMap.get('blueprintId') || '';
    this.draftId = this.route.snapshot.paramMap.get('draftId') || '';

    if (!this.blueprintId || !this.draftId) {
      this.message.error('缺少必要參數');
      this.goBack();
      return;
    }

    // Subscribe to real-time draft updates
    this.draftService.subscribeToDraft(this.blueprintId, this.draftId);
  }

  ngOnDestroy(): void {
    this.draftService.clearDraft();
  }

  retryLoad(): void {
    this.draftService.subscribeToDraft(this.blueprintId, this.draftId);
  }

  async retryParsing(): Promise<void> {
    try {
      await this.draftService.retryParsing(this.blueprintId, this.draftId);
      this.message.success('已重新啟動解析');
    } catch {
      this.message.error('重新解析失敗');
    }
  }

  async rejectDraft(): Promise<void> {
    this.modal.confirm({
      nzTitle: '確定要放棄此草稿嗎？',
      nzContent: '放棄後將無法恢復，需要重新上傳合約檔案。',
      nzOkText: '確定放棄',
      nzOkDanger: true,
      nzOnOk: async () => {
        try {
          await this.draftService.rejectDraft(this.blueprintId, this.draftId, '使用者放棄');
          this.message.success('草稿已放棄');
          this.goBack();
        } catch {
          this.message.error('操作失敗');
        }
      }
    });
  }

  async confirmDraft(): Promise<void> {
    const user = this.settings.user as User;
    if (!user?.['id']) {
      this.message.error('請先登入');
      return;
    }

    this.modal.confirm({
      nzTitle: '確定要建立正式合約嗎？',
      nzContent: '確認後將根據解析的資料建立正式合約記錄。',
      nzOkText: '確認建立',
      nzOnOk: async () => {
        this.confirming.set(true);
        try {
          const result = await this.draftService.confirmDraft({
            blueprintId: this.blueprintId,
            draftId: this.draftId,
            selectedFields: this.parsedData() || {},
            confirmedBy: user['id'] as string
          });

          if (result.success) {
            this.message.success('合約已成功建立');
            // Optionally navigate to the new contract
            if (result.contractId) {
              this.router.navigate(['/blueprint', this.blueprintId, 'contract', result.contractId]);
            }
          } else {
            this.message.error(result.error || '建立合約失敗');
          }
        } catch {
          this.message.error('建立合約失敗');
        } finally {
          this.confirming.set(false);
        }
      }
    });
  }

  viewContract(): void {
    const d = this.draft();
    if (d?.confirmedContractId) {
      this.router.navigate(['/blueprint', this.blueprintId, 'contract', d.confirmedContractId]);
    }
  }

  goBack(): void {
    this.router.navigate(['/blueprint', this.blueprintId, 'contracts']);
  }

  getConfidenceDescription(): string {
    const conf = this.confidence();
    if (conf >= 0.9) return '高信心度 - 解析結果可信度高，請確認資料正確性';
    if (conf >= 0.7) return '中信心度 - 建議檢查重要欄位';
    if (conf >= 0.5) return '低信心度 - 請仔細核對所有資料';
    return '極低信心度 - 解析結果可能不準確，建議手動輸入';
  }

  getStatusColor(status: ContractDraftStatus): string {
    const colors: Record<ContractDraftStatus, string> = {
      uploaded: 'blue',
      parsing: 'processing',
      parsed: 'cyan',
      draft: 'orange',
      user_reviewed: 'geekblue',
      confirmed: 'green',
      rejected: 'red',
      archived: 'default',
      error: 'error'
    };
    return colors[status] || 'default';
  }

  getStatusLabel(status: ContractDraftStatus): string {
    const labels: Record<ContractDraftStatus, string> = {
      uploaded: '已上傳',
      parsing: '解析中',
      parsed: '已解析',
      draft: '草稿',
      user_reviewed: '已審核',
      confirmed: '已確認',
      rejected: '已拒絕',
      archived: '已歸檔',
      error: '錯誤'
    };
    return labels[status] || status;
  }

  getStepStatus(step: string): 'wait' | 'process' | 'finish' | 'error' {
    const d = this.draft();
    if (!d) return 'wait';

    if (step === 'parsing') {
      if (d.status === 'parsing') return 'process';
      if (d.status === 'error') return 'error';
    }

    return 'wait';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }
}
