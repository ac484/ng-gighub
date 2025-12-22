/**
 * Warranty List Component (Feature Main)
 * 保固列表功能元件
 *
 * Feature-based architecture main component for warranty list
 * 整合統計、篩選、表格子元件
 *
 * @module WarrantyListComponent
 * @author GigHub Development Team
 * @date 2025-12-19
 */

import { Component, ChangeDetectionStrategy, OnInit, DestroyRef, computed, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { WarrantyPeriodService, WarrantyQueryOptions } from '@core/blueprint/modules/implementations/warranty';
import type { Warranty, WarrantyStatus } from '@core/blueprint/modules/implementations/warranty';
import { SHARED_IMPORTS } from '@shared';
import { NzMessageService } from 'ng-zorro-antd/message';

import { WarrantyFiltersComponent } from './components/warranty-filters.component';
import { WarrantyStatisticsComponent, type WarrantyStatistics } from './components/warranty-statistics.component';
import { WarrantyTableComponent } from './components/warranty-table.component';

/**
 * 保固列表元件 (Feature 協調器)
 */
@Component({
  selector: 'app-warranty-list',
  standalone: true,
  imports: [SHARED_IMPORTS, WarrantyStatisticsComponent, WarrantyFiltersComponent, WarrantyTableComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nz-card [nzTitle]="cardTitle" [nzExtra]="cardExtra">
      <ng-template #cardTitle>
        <span style="font-size: 18px; font-weight: 500;">保固管理</span>
        <span style="color: #999; font-size: 14px; margin-left: 12px;"> 管理保固期限與缺失追蹤 </span>
      </ng-template>
      <ng-template #cardExtra>
        @if (statistics().expiring > 0) {
          <nz-tag nzColor="volcano" style="margin-right: 16px;">
            <span nz-icon nzType="warning"></span>
            即將到期：{{ statistics().expiring }}
          </nz-tag>
        }
      </ng-template>

      <!-- 統計區域 -->
      <app-warranty-statistics [statistics]="statistics()" />

      <!-- 篩選區域 -->
      <app-warranty-filters (statusChange)="onStatusChange($event)" (searchChange)="onSearchChange($event)" (refresh)="refresh()" />

      <!-- 保固列表 -->
      <app-warranty-table
        [warranties]="filteredWarranties()"
        [loading]="loading()"
        (viewDetail)="viewDetail.emit($event)"
        (viewDefects)="viewDefects.emit($event)"
        (change)="onTableChange()"
      />
    </nz-card>
  `
})
export class WarrantyListComponent implements OnInit {
  private readonly warrantyService = inject(WarrantyPeriodService);
  private readonly message = inject(NzMessageService);
  private readonly destroyRef = inject(DestroyRef);

  /**
   * 藍圖 ID (從父元件傳入)
   */
  blueprintId = input.required<string>();

  /**
   * 查看詳情事件
   */
  viewDetail = output<Warranty>();

  /**
   * 查看缺失事件
   */
  viewDefects = output<Warranty>();

  /**
   * 狀態
   */
  loading = signal(false);
  warranties = signal<Warranty[]>([]);
  selectedStatus = signal<WarrantyStatus | null>(null);
  searchText = signal('');

  /**
   * 計算屬性 - 統計
   */
  statistics = computed<WarrantyStatistics>(() => ({
    active: this.warranties().filter(w => w.status === 'active').length,
    expiring: this.warranties().filter(w => w.status === 'expiring').length,
    expired: this.warranties().filter(w => w.status === 'expired').length,
    completed: this.warranties().filter(w => w.status === 'completed').length
  }));

  /**
   * 計算屬性 - 過濾後的保固列表
   */
  filteredWarranties = computed(() => {
    let result = this.warranties();

    // 狀態篩選
    const status = this.selectedStatus();
    if (status) {
      result = result.filter(w => w.status === status);
    }

    // 搜尋篩選
    const text = this.searchText();
    if (text) {
      const lowerText = text.toLowerCase();
      result = result.filter(w => w.warrantyNumber.toLowerCase().includes(lowerText) || w.warrantor.name.toLowerCase().includes(lowerText));
    }

    return result;
  });

  ngOnInit(): void {
    this.loadWarranties();
  }

  loadWarranties(): void {
    const bpId = this.blueprintId();
    if (!bpId) return;

    this.loading.set(true);

    const options: WarrantyQueryOptions = {};
    const status = this.selectedStatus();
    if (status) {
      options.status = status;
    }

    this.warrantyService
      .getWarranties(bpId, options)
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

  onStatusChange(status: WarrantyStatus | null): void {
    this.selectedStatus.set(status);
    this.loadWarranties();
  }

  onSearchChange(text: string): void {
    this.searchText.set(text);
    // 本地過濾，不需要重新載入
  }

  refresh(): void {
    this.loadWarranties();
  }

  onTableChange(): void {
    // 處理表格變更事件（分頁、排序等）
  }
}
