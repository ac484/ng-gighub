/**
 * Contract Status Badge Component
 * 合約狀態標籤元件 - 可重用的狀態顯示元件
 *
 * Shared component for displaying contract status with consistent styling.
 * High cohesion: Single responsibility - display status
 * Low coupling: No dependencies on other features
 */

import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import type { ContractStatus } from '@routes/blueprint/modules/contract/data/models';
import { NzTagModule } from 'ng-zorro-antd/tag';

@Component({
  selector: 'app-contract-status-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NzTagModule],
  template: `
    <nz-tag [nzColor]="statusColor()" style="font-size: 14px; padding: 4px 12px;">
      {{ statusText() }}
    </nz-tag>
  `
})
export class ContractStatusBadgeComponent {
  status = input.required<ContractStatus>();

  statusColor = computed(() => {
    const colorMap: Record<ContractStatus, string> = {
      draft: 'default',
      pending_activation: 'processing',
      active: 'success',
      completed: 'purple',
      terminated: 'error'
    };
    return colorMap[this.status()];
  });

  statusText = computed(() => {
    const textMap: Record<ContractStatus, string> = {
      draft: '草稿',
      pending_activation: '待生效',
      active: '已生效',
      completed: '已完成',
      terminated: '已終止'
    };
    return textMap[this.status()];
  });
}
