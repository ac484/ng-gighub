/**
 * Warranty Module View Component (Refactored)
 * 保固管理模組視圖元件
 *
 * Feature-based architecture main orchestrator
 * Thin coordination layer that manages feature interactions
 *
 * @module WarrantyModuleViewComponent
 * @author GigHub Development Team
 * @date 2025-12-19
 */

import { Component, ChangeDetectionStrategy, inject, input, signal } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import type { Warranty, WarrantyDefect } from './core';
import { WarrantyDefectRepository } from './core';
import { SHARED_IMPORTS } from '@shared';

import { WarrantyDetailDrawerComponent } from './features/detail';
import { WarrantyListComponent } from './features/list';

/**
 * 保固管理模組視圖元件 (主協調器)
 *
 * 職責:
 * - 管理高層狀態 (warranties, loading, drawer visibility)
 * - 協調 features 互動
 * - 處理 feature 事件
 *
 * 特點:
 * - Thin Layer: 最小化邏輯，委託給 features
 * - Event-Driven: 透過 inputs/outputs 與 features 溝通
 * - Stateful: 只管理必要的全域狀態
 */
@Component({
  selector: 'app-warranty-module-view',
  standalone: true,
  imports: [SHARED_IMPORTS, WarrantyListComponent, WarrantyDetailDrawerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- List Feature -->
    <app-warranty-list [blueprintId]="blueprintId()" (viewDetail)="openDetailDrawer($event)" (viewDefects)="navigateToDefects($event)" />

    <!-- Detail Feature (Drawer) -->
    <app-warranty-detail-drawer
      [visible]="drawerVisible()"
      [warranty]="selectedWarranty()"
      [defects]="selectedDefects()"
      [repairs]="[]"
      (close)="closeDetailDrawer()"
      (edit)="editWarranty($event)"
      (viewDefect)="viewDefect($event)"
    />
  `
})
export class WarrantyModuleViewComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly defectRepository = inject(WarrantyDefectRepository);

  /**
   * 藍圖 ID (從父元件傳入)
   */
  blueprintId = input.required<string>();

  /**
   * 全域狀態
   */
  drawerVisible = signal(false);
  selectedWarranty = signal<Warranty | null>(null);
  selectedDefects = signal<WarrantyDefect[]>([]);

  /**
   * 開啟詳情抽屜
   */
  async openDetailDrawer(warranty: Warranty): Promise<void> {
    this.selectedWarranty.set(warranty);
    this.drawerVisible.set(true);

    // 載入缺失列表
    try {
      const defects = await this.defectRepository.getByWarrantyId(this.blueprintId(), warranty.id);
      this.selectedDefects.set(defects);
    } catch {
      this.selectedDefects.set([]);
    }
  }

  /**
   * 關閉詳情抽屜
   */
  closeDetailDrawer(): void {
    this.drawerVisible.set(false);
    this.selectedWarranty.set(null);
    this.selectedDefects.set([]);
  }

  /**
   * 導航到缺失列表頁面
   */
  navigateToDefects(warranty: Warranty): void {
    this.router.navigate(['warranty', warranty.id, 'defects'], { relativeTo: this.route.parent });
  }

  /**
   * 編輯保固 (待實作)
   */
  editWarranty(warranty: Warranty): void {
    console.log('Edit warranty:', warranty);
    // TODO: Open edit modal/drawer
  }

  /**
   * 查看缺失詳情 (待實作)
   */
  viewDefect(defect: WarrantyDefect): void {
    console.log('View defect:', defect);
    // TODO: Open defect detail drawer
  }
}
