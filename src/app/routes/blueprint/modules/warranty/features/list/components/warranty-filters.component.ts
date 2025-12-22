/**
 * Warranty Filters Component
 * 保固篩選元件
 *
 * 提供狀態篩選和搜尋功能
 *
 * @module WarrantyFiltersComponent
 * @author GigHub Development Team
 * @date 2025-12-19
 */

import { Component, ChangeDetectionStrategy, output, signal } from '@angular/core';
import type { WarrantyStatus } from '@core/blueprint/modules/implementations/warranty';
import { SHARED_IMPORTS } from '@shared';

/**
 * 保固篩選元件
 */
@Component({
  selector: 'app-warranty-filters',
  standalone: true,
  imports: [SHARED_IMPORTS],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="filter-bar" style="margin-bottom: 16px; display: flex; gap: 16px; flex-wrap: wrap;">
      <nz-select
        [(ngModel)]="selectedStatusModel"
        nzPlaceHolder="選擇狀態"
        nzAllowClear
        style="width: 150px;"
      >
        @for (opt of statusOptions; track opt.value) {
          <nz-option [nzValue]="opt.value" [nzLabel]="opt.label" />
        }
      </nz-select>
      <nz-input-group nzPrefixIcon="search" style="width: 240px;">
        <input nz-input [(ngModel)]="searchTextModel" placeholder="搜尋保固編號..." />
      </nz-input-group>
      <button nz-button (click)="refresh.emit()">
        <span nz-icon nzType="reload"></span>
        重新整理
      </button>
    </div>
  `
})
export class WarrantyFiltersComponent {
  /**
   * 選中的狀態
   */
  private readonly selectedStatus = signal<WarrantyStatus | null>(null);

  /**
   * 搜尋文字
   */
  private readonly searchText = signal('');

  /**
   * 狀態選項
   */
  statusOptions: Array<{ value: WarrantyStatus; label: string }> = [
    { value: 'pending', label: '待啟動' },
    { value: 'active', label: '活動中' },
    { value: 'expiring', label: '即將到期' },
    { value: 'expired', label: '已過期' },
    { value: 'completed', label: '已完成' },
    { value: 'voided', label: '已作廢' }
  ];

  /**
   * 狀態變更事件
   */
  statusChange = output<WarrantyStatus | null>();

  /**
   * 搜尋變更事件
   */
  searchChange = output<string>();

  /**
   * 重新整理事件
   */
  refresh = output<void>();

  get selectedStatusModel(): WarrantyStatus | null {
    return this.selectedStatus();
  }

  set selectedStatusModel(value: WarrantyStatus | null) {
    this.selectedStatus.set(value);
    this.statusChange.emit(value);
  }

  get searchTextModel(): string {
    return this.searchText();
  }

  set searchTextModel(value: string) {
    const next = value ?? '';
    this.searchText.set(next);
    this.searchChange.emit(next);
  }
}
