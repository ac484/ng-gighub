import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { ContractStatus } from '../shared/types/contract.types';

@Component({
  selector: 'app-contract-status-badge',
  standalone: true,
  imports: [NzTagModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nz-tag [nzColor]="color">
      {{ label }}
    </nz-tag>
  `
})
export class ContractStatusBadgeComponent {
  @Input({ required: true }) status!: ContractStatus;

  get color(): string {
    const map: Record<ContractStatus, string> = {
      draft: 'default',
      under_review: 'processing',
      active: 'success',
      completed: 'green',
      terminated: 'error',
      suspended: 'warning'
    };
    return map[this.status] ?? 'default';
  }

  get label(): string {
    const map: Record<ContractStatus, string> = {
      draft: '草稿',
      under_review: '審核中',
      active: '生效中',
      completed: '已完成',
      terminated: '已終止',
      suspended: '暫停'
    };
    return map[this.status] ?? this.status;
  }
}
