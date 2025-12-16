/**
 * Warranty List Component - 保固記錄列表
 *
 * SETC-038: Warranty UI Components
 *
 * 使用 ng-alain ST 表格顯示保固記錄列表
 * 支援狀態篩選、即將到期提醒、操作按鈕
 *
 * @module WarrantyListComponent
 * @author GigHub Development Team
 * @date 2025-12-16
 */

import { Component, ChangeDetectionStrategy, OnInit, inject, signal, computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { WarrantyRepository, WarrantyQueryOptions } from '@core/blueprint/modules/implementations/warranty';
import type { Warranty, WarrantyStatus } from '@core/blueprint/modules/implementations/warranty';
import { STColumn } from '@delon/abc/st';
import { SHARED_IMPORTS } from '@shared';
import { NzMessageService } from 'ng-zorro-antd/message';

/**
 * 保固記錄列表元件
 */
@Component({
  selector: 'app-warranty-list',
  standalone: true,
  imports: [SHARED_IMPORTS],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nz-card [nzTitle]="cardTitle" [nzExtra]="cardExtra">
      <ng-template #cardTitle>
        <span style="font-size: 18px; font-weight: 500;">保固管理</span>
        <span style="color: #999; font-size: 14px; margin-left: 12px;"> 管理保固期限與缺失追蹤 </span>
      </ng-template>
      <ng-template #cardExtra>
        @if (expiringCount() > 0) {
          <nz-tag nzColor="volcano" style="margin-right: 16px;">
            <span nz-icon nzType="warning"></span>
            即將到期：{{ expiringCount() }}
          </nz-tag>
        }
      </ng-template>

      <!-- 狀態統計 -->
      <div class="stats-bar" style="margin-bottom: 16px; display: flex; gap: 24px; flex-wrap: wrap;">
        <nz-statistic nzTitle="活動中" [nzValue]="activeCount()" nzPrefix="🟢" />
        <nz-statistic nzTitle="即將到期" [nzValue]="expiringCount()" nzPrefix="🟡" />
        <nz-statistic nzTitle="已過期" [nzValue]="expiredCount()" nzPrefix="🔴" />
        <nz-statistic nzTitle="已完成" [nzValue]="completedCount()" nzPrefix="✅" />
      </div>

      <!-- 篩選區域 -->
      <div class="filter-bar" style="margin-bottom: 16px; display: flex; gap: 16px; flex-wrap: wrap;">
        <nz-select
          [(ngModel)]="selectedStatus"
          (ngModelChange)="onStatusChange($event)"
          nzPlaceHolder="選擇狀態"
          nzAllowClear
          style="width: 150px;"
        >
          @for (opt of statusOptions; track opt.value) {
            <nz-option [nzValue]="opt.value" [nzLabel]="opt.label" />
          }
        </nz-select>
        <nz-input-group nzPrefixIcon="search" style="width: 240px;">
          <input nz-input [(ngModel)]="searchText" (ngModelChange)="onSearch($event)" placeholder="搜尋保固編號..." />
        </nz-input-group>
        <button nz-button (click)="refresh()">
          <span nz-icon nzType="reload"></span>
          重新整理
        </button>
      </div>

      <!-- 保固列表 -->
      <st
        #st
        [data]="filteredWarranties()"
        [columns]="columns"
        [loading]="loading()"
        [page]="{ show: true, pageSize: 10 }"
        (change)="onTableChange($event)"
      />
    </nz-card>
  `,
  styles: [
    `
      .stats-bar ::ng-deep .ant-statistic {
        min-width: 100px;
      }
      .stats-bar ::ng-deep .ant-statistic-title {
        font-size: 12px;
        color: #999;
      }
      .stats-bar ::ng-deep .ant-statistic-content {
        font-size: 20px;
      }
    `
  ]
})
export class WarrantyListComponent implements OnInit {
  private readonly warrantyRepository = inject(WarrantyRepository);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly message = inject(NzMessageService);
  private readonly destroyRef = inject(DestroyRef);

  // 狀態
  loading = signal(false);
  warranties = signal<Warranty[]>([]);
  selectedStatus: WarrantyStatus | null = null;
  searchText = '';

  // 藍圖 ID（從路由取得）
  blueprintId = signal('');

  // 狀態選項
  statusOptions: Array<{ value: WarrantyStatus; label: string }> = [
    { value: 'pending', label: '待啟動' },
    { value: 'active', label: '活動中' },
    { value: 'expiring', label: '即將到期' },
    { value: 'expired', label: '已過期' },
    { value: 'completed', label: '已完成' },
    { value: 'voided', label: '已作廢' }
  ];

  // 計算屬性
  activeCount = computed(() => this.warranties().filter(w => w.status === 'active').length);
  expiringCount = computed(() => this.warranties().filter(w => w.status === 'expiring').length);
  expiredCount = computed(() => this.warranties().filter(w => w.status === 'expired').length);
  completedCount = computed(() => this.warranties().filter(w => w.status === 'completed').length);

  filteredWarranties = computed(() => {
    let result = this.warranties();

    if (this.selectedStatus) {
      result = result.filter(w => w.status === this.selectedStatus);
    }

    if (this.searchText) {
      const text = this.searchText.toLowerCase();
      result = result.filter(w => w.warrantyNumber.toLowerCase().includes(text) || w.warrantor.name.toLowerCase().includes(text));
    }

    return result;
  });

  // ST 表格欄位
  columns: STColumn[] = [
    { title: '保固編號', index: 'warrantyNumber', width: 150 },
    {
      title: '狀態',
      index: 'status',
      width: 100,
      type: 'badge',
      badge: {
        pending: { text: '待啟動', color: 'default' },
        active: { text: '活動中', color: 'success' },
        expiring: { text: '即將到期', color: 'warning' },
        expired: { text: '已過期', color: 'error' },
        completed: { text: '已完成', color: 'processing' },
        voided: { text: '已作廢', color: 'default' }
      }
    },
    { title: '保固責任方', index: 'warrantor.name', width: 150 },
    {
      title: '保固期限',
      index: 'periodInMonths',
      width: 80,
      format: item => `${item.periodInMonths} 個月`
    },
    {
      title: '開始日期',
      index: 'startDate',
      type: 'date',
      dateFormat: 'yyyy-MM-dd',
      width: 120
    },
    {
      title: '結束日期',
      index: 'endDate',
      type: 'date',
      dateFormat: 'yyyy-MM-dd',
      width: 120
    },
    { title: '缺失數', index: 'defectCount', width: 80, className: 'text-center' },
    { title: '維修數', index: 'repairCount', width: 80, className: 'text-center' },
    {
      title: '操作',
      width: 120,
      buttons: [
        {
          text: '查看',
          type: 'link',
          click: (record: Warranty) => this.viewDetail(record)
        },
        {
          text: '缺失',
          type: 'link',
          click: (record: Warranty) => this.viewDefects(record)
        }
      ]
    }
  ];

  ngOnInit(): void {
    // 取得藍圖 ID
    this.route.parent?.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const id = params['id'];
      if (id) {
        this.blueprintId.set(id);
        this.loadWarranties();
      }
    });
  }

  loadWarranties(): void {
    const bpId = this.blueprintId();
    if (!bpId) return;

    this.loading.set(true);

    const options: WarrantyQueryOptions = {};
    if (this.selectedStatus) {
      options.status = this.selectedStatus;
    }

    this.warrantyRepository
      .findByBlueprintId(bpId, options)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: warranties => {
          this.warranties.set(warranties);
          this.loading.set(false);
        },
        error: () => {
          this.message.error('載入保固記錄失敗');
          this.loading.set(false);
        }
      });
  }

  onStatusChange(): void {
    this.loadWarranties();
  }

  onSearch(): void {
    // 本地過濾，不需要重新載入
  }

  refresh(): void {
    this.loadWarranties();
  }

  onTableChange(): void {
    // 處理表格變更事件（分頁、排序等）
  }

  viewDetail(warranty: Warranty): void {
    this.router.navigate(['warranty', warranty.id], { relativeTo: this.route.parent });
  }

  viewDefects(warranty: Warranty): void {
    this.router.navigate(['warranty', warranty.id, 'defects'], { relativeTo: this.route.parent });
  }
}
