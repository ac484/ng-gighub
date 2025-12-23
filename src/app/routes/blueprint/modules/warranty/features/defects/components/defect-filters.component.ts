/**
 * Defect Filters Component
 * 缺失篩選元件
 *
 * 提供狀態和嚴重程度篩選功能
 *
 * @module DefectFiltersComponent
 * @author GigHub Development Team
 * @date 2025-12-19
 */

import { Component, ChangeDetectionStrategy, output } from '@angular/core';
import type { WarrantyDefectStatus } from '../../core';
import { SHARED_IMPORTS } from '@shared';

/**
 * 缺失篩選元件
 */
@Component({
  selector: 'app-defect-filters',
  standalone: true,
  imports: [SHARED_IMPORTS],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="filter-bar" style="margin-bottom: 16px; display: flex; gap: 16px; flex-wrap: wrap;">
      <nz-select
        [(ngModel)]="selectedStatus"
        (ngModelChange)="statusChange.emit($event)"
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
        (ngModelChange)="severityChange.emit($event)"
        nzPlaceHolder="選擇嚴重程度"
        nzAllowClear
        style="width: 150px;"
      >
        <nz-option nzValue="critical" nzLabel="嚴重" />
        <nz-option nzValue="major" nzLabel="主要" />
        <nz-option nzValue="minor" nzLabel="輕微" />
      </nz-select>
      <button nz-button (click)="refresh.emit()">
        <span nz-icon nzType="reload"></span>
        重新整理
      </button>
    </div>
  `
})
export class DefectFiltersComponent {
  /**
   * 選中的狀態
   */
  selectedStatus: WarrantyDefectStatus | null = null;

  /**
   * 選中的嚴重程度
   */
  selectedSeverity: string | null = null;

  /**
   * 狀態選項
   */
  statusOptions: Array<{ value: WarrantyDefectStatus; label: string }> = [
    { value: 'reported', label: '已回報' },
    { value: 'confirmed', label: '已確認' },
    { value: 'under_repair', label: '維修中' },
    { value: 'repaired', label: '已維修' },
    { value: 'verified', label: '已驗收' },
    { value: 'closed', label: '已結案' },
    { value: 'rejected', label: '已拒絕' }
  ];

  /**
   * 狀態變更事件
   */
  statusChange = output<WarrantyDefectStatus | null>();

  /**
   * 嚴重程度變更事件
   */
  severityChange = output<string | null>();

  /**
   * 重新整理事件
   */
  refresh = output<void>();
}
