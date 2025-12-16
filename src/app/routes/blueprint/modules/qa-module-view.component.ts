/**
 * QA Module View Component
 * 品質控管域視圖元件 - 顯示於藍圖詳情頁面的 Tab 中
 *
 * ✅ Updated: 2025-12-15
 * - 移除 QC 和 NCR tabs (NCR 功能已遷移至問題模組)
 * - 簡化為僅顯示說明訊息
 */

import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzResultModule } from 'ng-zorro-antd/result';

@Component({
  selector: 'app-qa-module-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS, NzEmptyModule, NzResultModule, NzAlertModule],
  template: `
    <nz-card>
      <nz-alert
        nzType="info"
        nzMessage="品質控管模組功能調整"
        nzDescription="NCR (不符合報告) 功能已遷移至「問題」模組，提供更完整的問題追蹤與管理功能。"
        nzShowIcon
        class="mb-md"
      />

      <nz-result nzIcon="info-circle" nzTitle="品質控管模組" nzSubTitle="此模組的 QC 和 NCR 功能已被清空">
        <div nz-result-extra>
          <p class="text-grey">
            <span nz-icon nzType="arrow-right"></span>
            NCR 相關功能請使用「問題」模組
          </p>
          <p class="text-grey">
            <span nz-icon nzType="arrow-right"></span>
            未來品質管理功能將在此模組重新設計
          </p>
        </div>
      </nz-result>
    </nz-card>
  `,
  styles: [
    `
      .text-grey {
        color: rgba(0, 0, 0, 0.45);
        margin: 8px 0;
      }
    `
  ]
})
export class QaModuleViewComponent {
  blueprintId = input.required<string>();
}
