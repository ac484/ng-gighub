/**
 * Warranty Module View Component
 * 保固期管理域視圖元件 - 顯示於藍圖詳情頁面的 Tab 中
 *
 * SETC-032: Warranty Module UI
 *
 * 實現保固期管理完整 UI：
 * - 保固統計摘要
 * - 保固項目列表
 * - 維修記錄追蹤
 * - 到期提醒
 * - 保固證明生成
 *
 * @module WarrantyModuleViewComponent
 * @author GigHub Development Team
 * @date 2025-12-17
 */

import { Component, ChangeDetectionStrategy, OnInit, inject, input, signal, computed } from '@angular/core';
import { STColumn } from '@delon/abc/st';
import { SHARED_IMPORTS } from '@shared';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzTimelineModule } from 'ng-zorro-antd/timeline';

/**
 * 保固狀態類型
 */
type WarrantyStatus =
  | 'pending' // 待生效
  | 'active' // 進行中
  | 'expiring' // 即將到期（30天內）
  | 'expired' // 已到期
  | 'completed' // 已結案
  | 'voided'; // 已作廢

/**
 * 保固責任方資訊
 */
interface WarrantorInfo {
  id: string;
  name: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  address: string;
}

/**
 * 保固記錄簡化版
 */
interface WarrantyItem {
  id: string;
  blueprintId: string;
  warrantyNumber: string;
  warrantyType: 'standard' | 'extended' | 'special';
  startDate: Date;
  endDate: Date;
  periodInMonths: number;
  warrantor: WarrantorInfo;
  status: WarrantyStatus;
}

@Component({
  selector: 'app-warranty-module-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS, NzStatisticModule, NzEmptyModule, NzAlertModule, NzProgressModule, NzTimelineModule],
  template: `
    <!-- 保固統計摘要 -->
    <nz-card nzTitle="保固期統計" [nzExtra]="statsExtra" class="mb-md">
      <ng-template #statsExtra>
        <button nz-button nzType="link" (click)="refreshData()">
          <span nz-icon nzType="reload"></span>
          重新整理
        </button>
      </ng-template>

      @if (loading()) {
        <div style="text-align: center; padding: 24px;">
          <nz-spin nzSimple></nz-spin>
        </div>
      } @else {
        <nz-row [nzGutter]="[16, 16]">
          <nz-col [nzXs]="12" [nzSm]="6">
            <nz-card nzSize="small" [nzHoverable]="true">
              <nz-statistic [nzValue]="stats().total" nzTitle="保固總數" [nzValueStyle]="{ color: '#1890ff' }">
                <ng-template #nzPrefix>
                  <span nz-icon nzType="safety-certificate"></span>
                </ng-template>
              </nz-statistic>
            </nz-card>
          </nz-col>
          <nz-col [nzXs]="12" [nzSm]="6">
            <nz-card nzSize="small" [nzHoverable]="true">
              <nz-statistic [nzValue]="stats().active" nzTitle="進行中" [nzValueStyle]="{ color: '#52c41a' }">
                <ng-template #nzPrefix>
                  <span nz-icon nzType="check-circle"></span>
                </ng-template>
              </nz-statistic>
            </nz-card>
          </nz-col>
          <nz-col [nzXs]="12" [nzSm]="6">
            <nz-card nzSize="small" [nzHoverable]="true">
              <nz-statistic [nzValue]="stats().expiring" nzTitle="即將到期" [nzValueStyle]="{ color: '#faad14' }">
                <ng-template #nzPrefix>
                  <span nz-icon nzType="clock-circle"></span>
                </ng-template>
              </nz-statistic>
            </nz-card>
          </nz-col>
          <nz-col [nzXs]="12" [nzSm]="6">
            <nz-card nzSize="small" [nzHoverable]="true">
              <nz-statistic [nzValue]="stats().expired" nzTitle="已過期" [nzValueStyle]="{ color: '#ff4d4f' }">
                <ng-template #nzPrefix>
                  <span nz-icon nzType="warning"></span>
                </ng-template>
              </nz-statistic>
            </nz-card>
          </nz-col>
        </nz-row>
      }
    </nz-card>

    <!-- 保固項目管理 -->
    <nz-card>
      <nz-tabset>
        <!-- 保固列表 Tab -->
        <nz-tab nzTitle="保固列表">
          <ng-template nz-tab>
            <div class="mb-md" style="display: flex; justify-content: space-between; align-items: center;">
              <nz-space>
                <nz-select
                  *nzSpaceItem
                  [(ngModel)]="statusFilter"
                  (ngModelChange)="filterWarranties()"
                  style="width: 140px;"
                  nzPlaceHolder="篩選狀態"
                  nzAllowClear
                >
                  @for (status of statusOptions; track status.value) {
                    <nz-option [nzValue]="status.value" [nzLabel]="status.label"></nz-option>
                  }
                </nz-select>
              </nz-space>
              <button nz-button nzType="primary" (click)="createWarranty()">
                <span nz-icon nzType="plus"></span>
                新增保固
              </button>
            </div>

            @if (loading()) {
              <div style="text-align: center; padding: 24px;">
                <nz-spin nzSimple></nz-spin>
              </div>
            } @else if (filteredWarranties().length === 0) {
              <nz-empty nzNotFoundContent="暫無保固記錄"></nz-empty>
            } @else {
              <st [data]="filteredWarranties()" [columns]="warrantyColumns" />
            }
          </ng-template>
        </nz-tab>

        <!-- 即將到期 Tab -->
        <nz-tab [nzTitle]="expiringTabTitle">
          <ng-template #expiringTabTitle>
            即將到期
            @if (expiringWarranties().length > 0) {
              <nz-badge [nzCount]="expiringWarranties().length" nzSize="small" style="margin-left: 4px;"></nz-badge>
            }
          </ng-template>
          <ng-template nz-tab>
            @if (expiringWarranties().length === 0) {
              <nz-empty nzNotFoundContent="暫無即將到期的保固"></nz-empty>
            } @else {
              <nz-timeline>
                @for (warranty of expiringWarranties(); track warranty.id) {
                  <nz-timeline-item [nzColor]="getTimelineColor(warranty)">
                    <div class="timeline-item">
                      <div style="display: flex; justify-content: space-between; align-items: center;">
                        <strong>{{ warranty.warrantyNumber }}</strong>
                        <nz-tag [nzColor]="warranty.status === 'expiring' ? 'warning' : 'error'">
                          剩餘 {{ calculateDaysRemaining(warranty.endDate) }} 天
                        </nz-tag>
                      </div>
                      <div style="color: #666; font-size: 12px; margin-top: 4px;">
                        到期日：{{ warranty.endDate | date: 'yyyy-MM-dd' }}
                      </div>
                      <div style="color: #666; font-size: 12px;"> 責任方：{{ warranty.warrantor.name }} </div>
                      <nz-progress
                        [nzPercent]="calculateWarrantyProgress(warranty)"
                        nzSize="small"
                        [nzStrokeColor]="warranty.status === 'expiring' ? '#faad14' : '#52c41a'"
                        style="margin-top: 8px;"
                      >
                      </nz-progress>
                    </div>
                  </nz-timeline-item>
                }
              </nz-timeline>
            }
          </ng-template>
        </nz-tab>

        <!-- 維修記錄 Tab -->
        <nz-tab nzTitle="維修記錄">
          <ng-template nz-tab>
            <div class="mb-md" style="display: flex; justify-content: flex-end;">
              <button nz-button nzType="primary" (click)="createRepairRecord()">
                <span nz-icon nzType="plus"></span>
                新增維修記錄
              </button>
            </div>

            @if (repairRecords().length === 0) {
              <nz-empty nzNotFoundContent="暫無維修記錄"></nz-empty>
            } @else {
              <st [data]="repairRecords()" [columns]="repairColumns" />
            }
          </ng-template>
        </nz-tab>

        <!-- 保固證明 Tab -->
        <nz-tab nzTitle="保固證明">
          <ng-template nz-tab>
            <nz-alert
              nzType="info"
              nzMessage="保固證明生成"
              nzDescription="選擇保固項目後可生成正式的保固證明文件，用於交付業主或歸檔。"
              nzShowIcon
              class="mb-md"
            >
            </nz-alert>

            @if (warranties().length === 0) {
              <nz-empty nzNotFoundContent="暫無可生成證明的保固項目"></nz-empty>
            } @else {
              <nz-list [nzDataSource]="warranties()" nzBordered>
                @for (warranty of warranties(); track warranty.id) {
                  <nz-list-item [nzActions]="[certificateAction]">
                    <nz-list-item-meta
                      [nzTitle]="warranty.warrantyNumber"
                      [nzDescription]="
                        '有效期：' + (warranty.startDate | date: 'yyyy-MM-dd') + ' ~ ' + (warranty.endDate | date: 'yyyy-MM-dd')
                      "
                    >
                      <nz-list-item-meta-avatar>
                        <nz-avatar nzIcon="safety-certificate" [nzShape]="'square'" style="background-color: #1890ff;"></nz-avatar>
                      </nz-list-item-meta-avatar>
                    </nz-list-item-meta>
                    <ng-template #certificateAction>
                      <button nz-button nzType="primary" nzSize="small" (click)="generateCertificate(warranty)">
                        <span nz-icon nzType="file-pdf"></span>
                        生成證明
                      </button>
                    </ng-template>
                  </nz-list-item>
                }
              </nz-list>
            }
          </ng-template>
        </nz-tab>
      </nz-tabset>
    </nz-card>
  `,
  styles: [
    `
      .timeline-item {
        padding: 8px 0;
      }

      .mb-md {
        margin-bottom: 16px;
      }
    `
  ]
})
export class WarrantyModuleViewComponent implements OnInit {
  blueprintId = input.required<string>();
  private readonly message = inject(NzMessageService);
  private readonly modal = inject(NzModalService);

  // 狀態
  loading = signal(false);
  statusFilter = '';
  warranties = signal<WarrantyItem[]>([]);
  repairRecords = signal<
    Array<{ id: string; warrantyId: string; description: string; repairedAt: Date; repairedBy: string; status: string }>
  >([]);

  // 統計
  stats = signal({ total: 0, active: 0, expiring: 0, expired: 0, completed: 0 });

  // 計算屬性
  filteredWarranties = computed(() => {
    const items = this.warranties();
    if (!this.statusFilter) return items;
    return items.filter(w => w.status === this.statusFilter);
  });

  expiringWarranties = computed(() =>
    this.warranties()
      .filter(w => w.status === 'expiring' || w.status === 'active')
      .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())
      .slice(0, 10)
  );

  // 狀態選項
  statusOptions = [
    { value: 'pending', label: '待生效' },
    { value: 'active', label: '進行中' },
    { value: 'expiring', label: '即將到期' },
    { value: 'expired', label: '已過期' },
    { value: 'completed', label: '已結案' },
    { value: 'voided', label: '已作廢' }
  ];

  // 保固列表欄位
  warrantyColumns: STColumn[] = [
    { title: '保固編號', index: 'warrantyNumber', width: 150 },
    {
      title: '類型',
      index: 'warrantyType',
      width: 100,
      type: 'badge',
      badge: {
        standard: { text: '標準', color: 'default' },
        extended: { text: '延長', color: 'processing' },
        special: { text: '特殊', color: 'warning' }
      }
    },
    { title: '責任方', index: 'warrantor.name', width: 150 },
    { title: '開始日期', index: 'startDate', type: 'date', dateFormat: 'yyyy-MM-dd', width: 110 },
    { title: '結束日期', index: 'endDate', type: 'date', dateFormat: 'yyyy-MM-dd', width: 110 },
    {
      title: '狀態',
      index: 'status',
      width: 100,
      type: 'badge',
      badge: {
        pending: { text: '待生效', color: 'default' },
        active: { text: '進行中', color: 'success' },
        expiring: { text: '即將到期', color: 'warning' },
        expired: { text: '已過期', color: 'error' },
        completed: { text: '已結案', color: 'default' },
        voided: { text: '已作廢', color: 'default' }
      }
    },
    {
      title: '操作',
      width: 180,
      buttons: [
        { text: '查看', click: (record: WarrantyItem) => this.viewWarranty(record) },
        {
          text: '維修',
          click: (record: WarrantyItem) => this.createRepairForWarranty(record),
          iif: (record: WarrantyItem) => record.status === 'active' || record.status === 'expiring'
        },
        {
          text: '結案',
          click: (record: WarrantyItem) => this.completeWarranty(record),
          iif: (record: WarrantyItem) => record.status === 'active'
        }
      ]
    }
  ];

  // 維修記錄欄位
  repairColumns: STColumn[] = [
    { title: '維修說明', index: 'description', width: 200 },
    { title: '維修日期', index: 'repairedAt', type: 'date', dateFormat: 'yyyy-MM-dd', width: 110 },
    { title: '維修人員', index: 'repairedBy', width: 120 },
    {
      title: '狀態',
      index: 'status',
      width: 100,
      type: 'badge',
      badge: {
        pending: { text: '待處理', color: 'default' },
        in_progress: { text: '進行中', color: 'processing' },
        completed: { text: '已完成', color: 'success' }
      }
    },
    {
      title: '操作',
      width: 120,
      buttons: [{ text: '查看', click: (record: { id: string }) => this.message.info(`查看維修記錄：${record.id}`) }]
    }
  ];

  ngOnInit(): void {
    this.loadData();
  }

  /** 載入資料 */
  private loadData(): void {
    this.loading.set(true);

    // MVP: 使用模擬資料
    setTimeout(() => {
      this.loadMockData();
      this.loading.set(false);
    }, 500);
  }

  /** 載入模擬資料 */
  private loadMockData(): void {
    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    const sixMonthsLater = new Date(now.getFullYear(), now.getMonth() + 6, now.getDate());
    const oneMonthLater = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
    const twoYearsLater = new Date(now.getFullYear() + 2, now.getMonth(), now.getDate());

    this.warranties.set([
      this.createMockWarranty('WRT-2024-001', 'standard', 'active', oneYearAgo, twoYearsLater, '承商A'),
      this.createMockWarranty('WRT-2024-002', 'extended', 'expiring', oneYearAgo, oneMonthLater, '承商B'),
      this.createMockWarranty('WRT-2024-003', 'standard', 'active', oneYearAgo, sixMonthsLater, '承商C'),
      this.createMockWarranty('WRT-2023-001', 'standard', 'expired', new Date(2022, 0, 1), new Date(2023, 11, 31), '承商D')
    ]);

    this.repairRecords.set([
      {
        id: 'REP-001',
        warrantyId: 'WRT-2024-001',
        description: '門窗密封修復',
        repairedAt: new Date(),
        repairedBy: '維修工A',
        status: 'completed'
      },
      {
        id: 'REP-002',
        warrantyId: 'WRT-2024-002',
        description: '防水層補強',
        repairedAt: new Date(),
        repairedBy: '維修工B',
        status: 'in_progress'
      }
    ]);

    this.stats.set({
      total: 4,
      active: 2,
      expiring: 1,
      expired: 1,
      completed: 0
    });
  }

  /** 建立模擬保固 */
  private createMockWarranty(
    warrantyNumber: string,
    warrantyType: 'standard' | 'extended' | 'special',
    status: WarrantyStatus,
    startDate: Date,
    endDate: Date,
    warrantorName: string
  ): WarrantyItem {
    return {
      id: warrantyNumber,
      blueprintId: this.blueprintId(),
      warrantyNumber,
      warrantyType,
      startDate,
      endDate,
      periodInMonths: 24,
      warrantor: {
        id: 'vendor-001',
        name: warrantorName,
        contactName: '聯絡人',
        contactPhone: '02-12345678',
        contactEmail: 'contact@example.com',
        address: '台北市'
      },
      status
    };
  }

  /** 重新整理 */
  refreshData(): void {
    this.loadData();
    this.message.success('資料已重新整理');
  }

  /** 篩選保固 */
  filterWarranties(): void {
    // computed 自動更新
  }

  /** 計算剩餘天數 */
  calculateDaysRemaining(endDate: Date): number {
    const now = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

  /** 計算保固進度 */
  calculateWarrantyProgress(warranty: WarrantyItem): number {
    const start = new Date(warranty.startDate).getTime();
    const end = new Date(warranty.endDate).getTime();
    const now = Date.now();
    const total = end - start;
    const elapsed = now - start;
    return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
  }

  /** 取得時間軸顏色 */
  getTimelineColor(warranty: WarrantyItem): string {
    const days = this.calculateDaysRemaining(warranty.endDate);
    if (days <= 7) return 'red';
    if (days <= 30) return 'orange';
    return 'blue';
  }

  /** 新增保固 */
  createWarranty(): void {
    this.message.info('新增保固功能開發中');
  }

  /** 查看保固詳情 */
  viewWarranty(warranty: WarrantyItem): void {
    this.modal.info({
      nzTitle: '保固詳情',
      nzContent:
        `<div>` +
        `<p><strong>保固編號：</strong>${warranty.warrantyNumber}</p>` +
        `<p><strong>類型：</strong>${warranty.warrantyType}</p>` +
        `<p><strong>責任方：</strong>${warranty.warrantor.name}</p>` +
        `<p><strong>有效期：</strong>${new Date(warranty.startDate).toLocaleDateString()} ~ ${new Date(warranty.endDate).toLocaleDateString()}</p>` +
        `<p><strong>狀態：</strong>${this.getStatusLabel(warranty.status)}</p>` +
        `</div>`,
      nzWidth: 500
    });
  }

  /** 為保固新增維修記錄 */
  createRepairForWarranty(warranty: WarrantyItem): void {
    this.message.info(`新增維修記錄：${warranty.warrantyNumber}`);
  }

  /** 結案保固 */
  completeWarranty(warranty: WarrantyItem): void {
    this.modal.confirm({
      nzTitle: '確認結案',
      nzContent: `確定要將保固 ${warranty.warrantyNumber} 結案嗎？`,
      nzOnOk: () => {
        this.message.success('保固已結案');
      }
    });
  }

  /** 新增維修記錄 */
  createRepairRecord(): void {
    this.message.info('新增維修記錄功能開發中');
  }

  /** 生成保固證明 */
  generateCertificate(warranty: WarrantyItem): void {
    this.message.info(`生成保固證明：${warranty.warrantyNumber}`);
  }

  /** 取得狀態標籤 */
  private getStatusLabel(status: WarrantyStatus): string {
    const option = this.statusOptions.find(s => s.value === status);
    return option?.label ?? status;
  }
}
