/**
 * Warranty Defect List Component - 保固缺失列表
 *
 * SETC-038: Warranty UI Components
 *
 * 顯示保固缺失列表，支援狀態追蹤和操作
 *
 * @module WarrantyDefectListComponent
 * @author GigHub Development Team
 * @date 2025-12-16
 */

import { Component, ChangeDetectionStrategy, OnInit, inject, signal, computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { WarrantyDefectRepository, WarrantyDefectService, DefectStatistics } from '@core/blueprint/modules/implementations/warranty';
import type { WarrantyDefect, WarrantyDefectStatus } from '@core/blueprint/modules/implementations/warranty';
import { STColumn } from '@delon/abc/st';
import { SHARED_IMPORTS } from '@shared';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';

/**
 * 保固缺失列表元件
 */
@Component({
  selector: 'app-warranty-defect-list',
  standalone: true,
  imports: [SHARED_IMPORTS],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nz-card [nzTitle]="cardTitle" [nzExtra]="cardExtra">
      <ng-template #cardTitle>
        <span style="font-size: 18px; font-weight: 500;">缺失管理</span>
        <span style="color: #999; font-size: 14px; margin-left: 12px;"> 保固 #{{ warrantyNumber() }} 的缺失記錄 </span>
      </ng-template>
      <ng-template #cardExtra>
        <button nz-button nzType="primary" (click)="reportDefect()">
          <span nz-icon nzType="plus"></span>
          回報缺失
        </button>
        <button nz-button style="margin-left: 8px;" (click)="goBack()">
          <span nz-icon nzType="arrow-left"></span>
          返回
        </button>
      </ng-template>

      <!-- 統計區域 -->
      @if (statistics()) {
        <div class="stats-bar" style="margin-bottom: 16px; display: flex; gap: 24px; flex-wrap: wrap;">
          <nz-statistic nzTitle="總缺失" [nzValue]="statistics()!.total" />
          <nz-statistic nzTitle="嚴重" [nzValue]="statistics()!.bySeverity.critical" nzPrefix="🔴" />
          <nz-statistic nzTitle="主要" [nzValue]="statistics()!.bySeverity.major" nzPrefix="🟡" />
          <nz-statistic nzTitle="輕微" [nzValue]="statistics()!.bySeverity.minor" nzPrefix="🟢" />
          <nz-statistic nzTitle="待處理" [nzValue]="statistics()!.byStatus.open" />
          <nz-statistic nzTitle="已解決" [nzValue]="statistics()!.byStatus.resolved" />
        </div>
      }

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
        <nz-select
          [(ngModel)]="selectedSeverity"
          (ngModelChange)="onSeverityChange($event)"
          nzPlaceHolder="選擇嚴重程度"
          nzAllowClear
          style="width: 150px;"
        >
          <nz-option nzValue="critical" nzLabel="嚴重" />
          <nz-option nzValue="major" nzLabel="主要" />
          <nz-option nzValue="minor" nzLabel="輕微" />
        </nz-select>
        <button nz-button (click)="refresh()">
          <span nz-icon nzType="reload"></span>
          重新整理
        </button>
      </div>

      <!-- 缺失列表 -->
      <st
        #st
        [data]="filteredDefects()"
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
        min-width: 80px;
      }
      .stats-bar ::ng-deep .ant-statistic-title {
        font-size: 12px;
        color: #999;
      }
      .stats-bar ::ng-deep .ant-statistic-content {
        font-size: 18px;
      }
    `
  ]
})
export class WarrantyDefectListComponent implements OnInit {
  private readonly defectRepository = inject(WarrantyDefectRepository);
  private readonly defectService = inject(WarrantyDefectService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly modal = inject(NzModalService);
  private readonly message = inject(NzMessageService);
  private readonly destroyRef = inject(DestroyRef);

  // 狀態
  loading = signal(false);
  defects = signal<WarrantyDefect[]>([]);
  statistics = signal<DefectStatistics | null>(null);
  selectedStatus: WarrantyDefectStatus | null = null;
  selectedSeverity: string | null = null;

  // 路由參數
  blueprintId = signal('');
  warrantyId = signal('');
  warrantyNumber = signal('');

  // 狀態選項
  statusOptions: Array<{ value: WarrantyDefectStatus; label: string }> = [
    { value: 'reported', label: '已回報' },
    { value: 'confirmed', label: '已確認' },
    { value: 'under_repair', label: '維修中' },
    { value: 'repaired', label: '已維修' },
    { value: 'verified', label: '已驗收' },
    { value: 'closed', label: '已結案' },
    { value: 'rejected', label: '已拒絕' }
  ];

  // 過濾後的缺失
  filteredDefects = computed(() => {
    let result = this.defects();

    if (this.selectedStatus) {
      result = result.filter(d => d.status === this.selectedStatus);
    }

    if (this.selectedSeverity) {
      result = result.filter(d => d.severity === this.selectedSeverity);
    }

    return result;
  });

  // ST 表格欄位
  columns: STColumn[] = [
    { title: '缺失編號', index: 'defectNumber', width: 150 },
    {
      title: '嚴重程度',
      index: 'severity',
      width: 100,
      type: 'badge',
      badge: {
        critical: { text: '嚴重', color: 'error' },
        major: { text: '主要', color: 'warning' },
        minor: { text: '輕微', color: 'success' }
      }
    },
    {
      title: '狀態',
      index: 'status',
      width: 100,
      type: 'badge',
      badge: {
        reported: { text: '已回報', color: 'default' },
        confirmed: { text: '已確認', color: 'processing' },
        under_repair: { text: '維修中', color: 'warning' },
        repaired: { text: '已維修', color: 'success' },
        verified: { text: '已驗收', color: 'success' },
        closed: { text: '已結案', color: 'default' },
        rejected: { text: '已拒絕', color: 'error' }
      }
    },
    { title: '類別', index: 'category', width: 100 },
    { title: '位置', index: 'location', width: 150 },
    { title: '說明', index: 'description', width: 200 },
    {
      title: '發現日期',
      index: 'discoveredDate',
      type: 'date',
      dateFormat: 'yyyy-MM-dd',
      width: 120
    },
    {
      title: '操作',
      width: 150,
      buttons: [
        {
          text: '確認',
          type: 'link',
          iif: (record: WarrantyDefect) => record.status === 'reported',
          click: (record: WarrantyDefect) => this.confirmDefect(record)
        },
        {
          text: '維修',
          type: 'link',
          iif: (record: WarrantyDefect) => record.status === 'confirmed',
          click: (record: WarrantyDefect) => this.createRepair(record)
        },
        {
          text: '詳情',
          type: 'link',
          click: (record: WarrantyDefect) => this.viewDetail(record)
        }
      ]
    }
  ];

  ngOnInit(): void {
    // 取得路由參數
    this.route.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      this.warrantyId.set(params['warrantyId'] || '');
    });

    this.route.parent?.parent?.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      this.blueprintId.set(params['id'] || '');
      this.loadDefects();
    });
  }

  async loadDefects(): Promise<void> {
    const bpId = this.blueprintId();
    const wId = this.warrantyId();
    if (!bpId || !wId) return;

    this.loading.set(true);

    try {
      const defects = await this.defectRepository.getByWarrantyId(bpId, wId);
      this.defects.set(defects);

      const stats = await this.defectService.getDefectStatistics(bpId, wId);
      this.statistics.set(stats);
    } catch {
      this.message.error('載入缺失記錄失敗');
    } finally {
      this.loading.set(false);
    }
  }

  onStatusChange(): void {
    // 本地過濾
  }

  onSeverityChange(): void {
    // 本地過濾
  }

  refresh(): void {
    this.loadDefects();
  }

  onTableChange(): void {
    // 處理表格變更事件
  }

  reportDefect(): void {
    this.message.info('開啟回報缺失表單（待實作）');
  }

  async confirmDefect(defect: WarrantyDefect): Promise<void> {
    this.modal.confirm({
      nzTitle: '確認缺失',
      nzContent: `確認此缺失？編號：${defect.defectNumber}`,
      nzOnOk: async () => {
        try {
          await this.defectService.confirmDefect(
            this.blueprintId(),
            this.warrantyId(),
            defect.id,
            'current-user' // TODO: 從 auth service 取得
          );
          this.message.success('缺失已確認');
          this.loadDefects();
        } catch {
          this.message.error('確認缺失失敗');
        }
      }
    });
  }

  createRepair(defect: WarrantyDefect): void {
    this.message.info(`開啟建立維修工單表單（缺失：${defect.defectNumber}）（待實作）`);
  }

  viewDetail(defect: WarrantyDefect): void {
    this.message.info(`查看缺失詳情：${defect.defectNumber}（待實作）`);
  }

  goBack(): void {
    this.router.navigate(['../../'], { relativeTo: this.route });
  }
}
