/**
 * Contract Detail Drawer Component
 * 合約詳情抽屜元件
 *
 * Modern drawer-based contract viewing component using ng-zorro-antd NzDrawer.
 * Displays contract details in a side panel without navigating away from the list.
 *
 * ✅ Modern Angular 20 patterns:
 * - Standalone Component
 * - Signals for reactive state
 * - OnPush change detection
 * - inject() for DI
 * - input()/output() for component communication
 *
 * @author GigHub Development Team
 * @date 2025-12-17
 */

import { Component, ChangeDetectionStrategy, OnInit, inject, input, output, signal, computed } from '@angular/core';
import type { Contract, ContractStatus } from '@core/blueprint/modules/implementations/contract/models';
import { SHARED_IMPORTS } from '@shared';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzTagModule } from 'ng-zorro-antd/tag';

@Component({
  selector: 'app-contract-detail-drawer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SHARED_IMPORTS,
    NzDescriptionsModule,
    NzDividerModule,
    NzTagModule,
    NzButtonModule,
    NzTabsModule,
    NzTableModule,
    NzStatisticModule,
    NzEmptyModule,
    NzAlertModule,
    NzProgressModule
  ],
  template: `
    <div class="contract-detail-drawer">
      @if (contract()) {
        <!-- Header Actions -->
        <div class="drawer-header-actions mb-md">
          <button nz-button nzType="primary" (click)="onEdit()">
            <span nz-icon nzType="edit"></span>
            編輯
          </button>
          <button nz-button nzType="default" (click)="onDownload()" class="ml-sm">
            <span nz-icon nzType="download"></span>
            下載
          </button>
          @if (canActivate()) {
            <button nz-button nzType="default" (click)="onActivate()" class="ml-sm">
              <span nz-icon nzType="check-circle"></span>
              生效合約
            </button>
          }
        </div>

        <!-- Status Tag -->
        <div class="mb-md">
          <nz-tag [nzColor]="getStatusColor(contract()!.status)" style="font-size: 14px; padding: 4px 12px;">
            {{ getStatusText(contract()!.status) }}
          </nz-tag>
        </div>

        <!-- Tabs for different sections -->
        <nz-tabset>
          <!-- Basic Info Tab -->
          <nz-tab nzTitle="基本資訊">
            <nz-descriptions nzTitle="合約摘要" nzBordered [nzColumn]="1" class="mt-md">
              <nz-descriptions-item nzTitle="合約編號">{{ contract()!.contractNumber }}</nz-descriptions-item>
              <nz-descriptions-item nzTitle="合約名稱">{{ contract()!.title }}</nz-descriptions-item>
              <nz-descriptions-item nzTitle="合約金額">
                {{ contract()!.currency }} {{ contract()!.totalAmount | number: '1.0-0' }}
              </nz-descriptions-item>
              <nz-descriptions-item nzTitle="開始日期">{{ contract()!.startDate | date: 'yyyy-MM-dd' }}</nz-descriptions-item>
              <nz-descriptions-item nzTitle="結束日期">{{ contract()!.endDate | date: 'yyyy-MM-dd' }}</nz-descriptions-item>
              @if (contract()!.description) {
                <nz-descriptions-item nzTitle="描述">{{ contract()!.description }}</nz-descriptions-item>
              }
            </nz-descriptions>
          </nz-tab>

          <!-- Parties Tab -->
          <nz-tab nzTitle="合約方">
            <nz-divider nzText="業主資訊" nzOrientation="left"></nz-divider>
            @if (contract()!.owner) {
              <nz-descriptions nzBordered [nzColumn]="1">
                <nz-descriptions-item nzTitle="公司名稱">{{ contract()!.owner!.name }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="聯絡人">{{ contract()!.owner!.contactPerson }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="電話">{{ contract()!.owner!.contactPhone }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="電子郵件">{{ contract()!.owner!.contactEmail }}</nz-descriptions-item>
                @if (contract()!.owner!.address) {
                  <nz-descriptions-item nzTitle="地址">{{ contract()!.owner!.address }}</nz-descriptions-item>
                }
                @if (contract()!.owner!.taxId) {
                  <nz-descriptions-item nzTitle="統一編號">{{ contract()!.owner!.taxId }}</nz-descriptions-item>
                }
              </nz-descriptions>
            }

            <nz-divider nzText="承商資訊" nzOrientation="left"></nz-divider>
            @if (contract()!.contractor) {
              <nz-descriptions nzBordered [nzColumn]="1">
                <nz-descriptions-item nzTitle="公司名稱">{{ contract()!.contractor!.name }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="聯絡人">{{ contract()!.contractor!.contactPerson }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="電話">{{ contract()!.contractor!.contactPhone }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="電子郵件">{{ contract()!.contractor!.contactEmail }}</nz-descriptions-item>
                @if (contract()!.contractor!.address) {
                  <nz-descriptions-item nzTitle="地址">{{ contract()!.contractor!.address }}</nz-descriptions-item>
                }
                @if (contract()!.contractor!.taxId) {
                  <nz-descriptions-item nzTitle="統一編號">{{ contract()!.contractor!.taxId }}</nz-descriptions-item>
                }
              </nz-descriptions>
            }
          </nz-tab>

          <!-- Attachments Tab -->
          <nz-tab nzTitle="附件">
            @if (attachments() && attachments().length > 0) {
              <nz-table #attachmentsTable [nzData]="attachments()" [nzPageSize]="10" nzSize="small">
                <thead>
                  <tr>
                    <th>檔案名稱</th>
                    <th nzWidth="100px">類型</th>
                    <th nzWidth="100px">大小</th>
                    <th nzWidth="120px">上傳時間</th>
                    <th nzWidth="80px">操作</th>
                  </tr>
                </thead>
                <tbody>
                  @for (file of attachmentsTable.data; track file.id) {
                    <tr>
                      <td>{{ file.fileName }}</td>
                      <td>{{ file.fileType }}</td>
                      <td>{{ formatFileSize(file.fileSize) }}</td>
                      <td>{{ file.uploadedAt | date: 'yyyy-MM-dd HH:mm' }}</td>
                      <td>
                        <button nz-button nzType="link" nzSize="small" (click)="downloadFile(file)">
                          <span nz-icon nzType="download"></span>
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </nz-table>
            } @else {
              <nz-empty nzNotFoundContent="尚無附件"></nz-empty>
            }
          </nz-tab>

          <!-- History Tab -->
          <nz-tab nzTitle="歷史記錄">
            <nz-descriptions nzBordered [nzColumn]="1">
              <nz-descriptions-item nzTitle="建立者">{{ contract()!.createdBy }}</nz-descriptions-item>
              <nz-descriptions-item nzTitle="建立時間">{{ contract()!.createdAt | date: 'yyyy-MM-dd HH:mm' }}</nz-descriptions-item>
              <nz-descriptions-item nzTitle="最後更新">{{ contract()!.updatedAt | date: 'yyyy-MM-dd HH:mm' }}</nz-descriptions-item>
              @if (contract()!.activatedAt) {
                <nz-descriptions-item nzTitle="生效時間">{{ contract()!.activatedAt | date: 'yyyy-MM-dd HH:mm' }}</nz-descriptions-item>
              }
              @if (contract()!.activatedBy) {
                <nz-descriptions-item nzTitle="生效者">{{ contract()!.activatedBy }}</nz-descriptions-item>
              }
            </nz-descriptions>
          </nz-tab>
        </nz-tabset>
      } @else {
        <nz-empty nzNotFoundContent="無合約資料"></nz-empty>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .contract-detail-drawer {
        padding: 0;
      }
      .drawer-header-actions {
        text-align: right;
      }
      .work-items-summary {
        padding: 16px;
        background: #fafafa;
        border-radius: 4px;
      }
    `
  ]
})
export class ContractDetailDrawerComponent implements OnInit {
  // Inputs
  contract = input.required<Contract | null>();

  // Outputs
  readonly edit = output<Contract>();
  readonly activate = output<Contract>();
  readonly download = output<Contract>();

  // Computed signals
  attachments = computed(() => {
    const contract = this.contract();
    return contract?.attachments || [];
  });

  canActivate = computed(() => {
    const contract = this.contract();
    return contract?.status === 'pending_activation';
  });

  ngOnInit(): void {
    // Component initialized
  }

  getStatusColor(status: ContractStatus): string {
    const colorMap: Record<ContractStatus, string> = {
      draft: 'default',
      pending_activation: 'processing',
      active: 'success',
      completed: 'purple',
      terminated: 'error'
    };
    return colorMap[status] || 'default';
  }

  getStatusText(status: ContractStatus): string {
    const textMap: Record<ContractStatus, string> = {
      draft: '草稿',
      pending_activation: '待生效',
      active: '已生效',
      completed: '已完成',
      terminated: '已終止'
    };
    return textMap[status] || status;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
  }

  onEdit(): void {
    const contract = this.contract();
    if (contract) {
      this.edit.emit(contract);
    }
  }

  onActivate(): void {
    const contract = this.contract();
    if (contract && this.canActivate()) {
      this.activate.emit(contract);
    }
  }

  onDownload(): void {
    const contract = this.contract();
    if (contract) {
      this.download.emit(contract);
    }
  }

  downloadFile(file: any): void {
    if (file.fileUrl) {
      window.open(file.fileUrl, '_blank');
    }
  }
}
