/**
 * Warranty Detail Drawer Component (Feature Main)
 * 保固詳情抽屜元件
 *
 * Feature-based architecture main component for warranty detail
 * 使用 nz-drawer 顯示保固詳細資訊
 *
 * @module WarrantyDetailDrawerComponent
 * @author GigHub Development Team
 * @date 2025-12-19
 */

import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import type { Warranty, WarrantyDefect } from '@core/blueprint/modules/implementations/warranty';
import { SHARED_IMPORTS } from '@shared';

import { WarrantyStatusBadgeComponent } from '../../shared';
import { BasicInfoTabComponent } from './components/basic-info-tab.component';
import { DefectsTabComponent } from './components/defects-tab.component';
import { RepairsTabComponent } from './components/repairs-tab.component';

/**
 * 保固詳情抽屜元件 (Feature 協調器)
 */
@Component({
  selector: 'app-warranty-detail-drawer',
  standalone: true,
  imports: [SHARED_IMPORTS, WarrantyStatusBadgeComponent, BasicInfoTabComponent, DefectsTabComponent, RepairsTabComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nz-drawer [nzVisible]="visible()" [nzTitle]="drawerTitle" [nzWidth]="720" [nzClosable]="true" (nzOnClose)="close.emit()">
      <ng-template #drawerTitle>
        <div style="display: flex; align-items: center; gap: 12px;">
          <span style="font-size: 16px; font-weight: 500;">保固詳情</span>
          @if (warranty()) {
            <app-warranty-status-badge [status]="warranty()!.status" />
          }
        </div>
      </ng-template>

      <ng-container *nzDrawerContent>
        @if (warranty(); as w) {
          <nz-tabset>
            <nz-tab nzTitle="基本資訊">
              <app-basic-info-tab [warranty]="w" />
            </nz-tab>
            <nz-tab [nzTitle]="defectsTitle">
              <ng-template #defectsTitle>
                缺失記錄
                @if (w.defectCount > 0) {
                  <nz-badge [nzCount]="w.defectCount" [nzOverflowCount]="99" style="margin-left: 8px;" />
                }
              </ng-template>
              <app-defects-tab [defects]="defects()" (viewDefect)="viewDefect.emit($event)" />
            </nz-tab>
            <nz-tab [nzTitle]="repairsTitle">
              <ng-template #repairsTitle>
                維修記錄
                @if (w.repairCount > 0) {
                  <nz-badge [nzCount]="w.repairCount" [nzOverflowCount]="99" style="margin-left: 8px;" />
                }
              </ng-template>
              <app-repairs-tab [repairs]="repairs()" />
            </nz-tab>
          </nz-tabset>

          <!-- 操作按鈕 -->
          <div style="margin-top: 24px; text-align: right;">
            <button nz-button (click)="close.emit()" style="margin-right: 8px;">關閉</button>
            <button nz-button nzType="primary" (click)="edit.emit(w)">編輯</button>
          </div>
        } @else {
          <nz-empty nzNotFoundContent="無保固資料" />
        }
      </ng-container>
    </nz-drawer>
  `
})
export class WarrantyDetailDrawerComponent {
  /**
   * 抽屜可見性
   */
  visible = input<boolean>(false);

  /**
   * 保固資料
   */
  warranty = input<Warranty | null>(null);

  /**
   * 缺失列表
   */
  defects = input<WarrantyDefect[]>([]);

  /**
   * 維修列表 (暫時為空陣列)
   */
  repairs = input<any[]>([]);

  /**
   * 關閉事件
   */
  close = output<void>();

  /**
   * 編輯事件
   */
  edit = output<Warranty>();

  /**
   * 查看缺失事件
   */
  viewDefect = output<WarrantyDefect>();
}
