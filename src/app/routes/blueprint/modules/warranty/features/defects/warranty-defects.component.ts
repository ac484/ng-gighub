/**
 * Warranty Defects Component (Feature Main)
 * 保固缺失功能元件
 *
 * Feature-based architecture main component for warranty defects
 * 整合統計、篩選、表格子元件
 *
 * @module WarrantyDefectsComponent
 * @author GigHub Development Team
 * @date 2025-12-19
 */

import { Component, ChangeDetectionStrategy, OnInit, inject, signal, computed, DestroyRef, output, input } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { WarrantyDefectRepository, WarrantyDefectService, DefectStatistics } from '../../../../core';
import type { WarrantyDefect, WarrantyDefectStatus } from '../../../../core';
import { SHARED_IMPORTS } from '@shared';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';

import { DefectFiltersComponent } from './components/defect-filters.component';
import { DefectStatisticsComponent } from './components/defect-statistics.component';
import { DefectTableComponent } from './components/defect-table.component';

/**
 * 保固缺失元件 (Feature 協調器)
 */
@Component({
  selector: 'app-warranty-defects',
  standalone: true,
  imports: [SHARED_IMPORTS, DefectStatisticsComponent, DefectFiltersComponent, DefectTableComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nz-card [nzTitle]="cardTitle" [nzExtra]="cardExtra">
      <ng-template #cardTitle>
        <span style="font-size: 18px; font-weight: 500;">缺失管理</span>
        <span style="color: #999; font-size: 14px; margin-left: 12px;"> 保固 #{{ warrantyNumber() }} 的缺失記錄 </span>
      </ng-template>
      <ng-template #cardExtra>
        <button nz-button nzType="primary" (click)="reportDefect.emit()">
          <span nz-icon nzType="plus"></span>
          回報缺失
        </button>
        <button nz-button style="margin-left: 8px;" (click)="goBack.emit()">
          <span nz-icon nzType="arrow-left"></span>
          返回
        </button>
      </ng-template>

      <!-- 統計區域 -->
      <app-defect-statistics [statistics]="statistics()" />

      <!-- 篩選區域 -->
      <app-defect-filters (statusChange)="onStatusChange($event)" (severityChange)="onSeverityChange($event)" (refresh)="refresh()" />

      <!-- 缺失列表 -->
      <app-defect-table
        [defects]="filteredDefects()"
        [loading]="loading()"
        (confirmDefect)="onConfirmDefect($event)"
        (createRepair)="createRepair.emit($event)"
        (viewDetail)="viewDetail.emit($event)"
        (change)="onTableChange()"
      />
    </nz-card>
  `
})
export class WarrantyDefectsComponent implements OnInit {
  private readonly defectRepository = inject(WarrantyDefectRepository);
  private readonly defectService = inject(WarrantyDefectService);
  private readonly modal = inject(NzModalService);
  private readonly message = inject(NzMessageService);
  private readonly destroyRef = inject(DestroyRef);

  /**
   * 藍圖 ID (從父元件傳入)
   */
  blueprintId = input.required<string>();

  /**
   * 保固 ID (從父元件傳入)
   */
  warrantyId = input.required<string>();

  /**
   * 保固編號 (從父元件傳入)
   */
  warrantyNumber = input<string>('');

  /**
   * 回報缺失事件
   */
  reportDefect = output<void>();

  /**
   * 建立維修事件
   */
  createRepair = output<WarrantyDefect>();

  /**
   * 查看詳情事件
   */
  viewDetail = output<WarrantyDefect>();

  /**
   * 返回事件
   */
  goBack = output<void>();

  /**
   * 狀態
   */
  loading = signal(false);
  defects = signal<WarrantyDefect[]>([]);
  statistics = signal<DefectStatistics | null>(null);
  selectedStatus = signal<WarrantyDefectStatus | null>(null);
  selectedSeverity = signal<string | null>(null);

  /**
   * 計算屬性 - 過濾後的缺失列表
   */
  filteredDefects = computed(() => {
    let result = this.defects();

    // 狀態篩選
    const status = this.selectedStatus();
    if (status) {
      result = result.filter(d => d.status === status);
    }

    // 嚴重程度篩選
    const severity = this.selectedSeverity();
    if (severity) {
      result = result.filter(d => d.severity === severity);
    }

    return result;
  });

  ngOnInit(): void {
    this.loadDefects();
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

  onStatusChange(status: WarrantyDefectStatus | null): void {
    this.selectedStatus.set(status);
  }

  onSeverityChange(severity: string | null): void {
    this.selectedSeverity.set(severity);
  }

  refresh(): void {
    this.loadDefects();
  }

  onTableChange(): void {
    // 處理表格變更事件
  }

  async onConfirmDefect(defect: WarrantyDefect): Promise<void> {
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
}
