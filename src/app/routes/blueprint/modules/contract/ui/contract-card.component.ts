import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { ContractModel } from '../data-access/models/contract.model';
import { ContractStatusBadgeComponent } from './contract-status-badge.component';

@Component({
  selector: 'app-contract-card',
  standalone: true,
  imports: [SHARED_IMPORTS, ContractStatusBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nz-card [nzTitle]="contract.title" class="contract-card">
      <div class="flex items-center gap-sm mb-sm">
        <app-contract-status-badge [status]="contract.status" />
        <span class="text-muted">編號：{{ contract.contractNumber }}</span>
      </div>
      <div class="mb-sm">
        <strong>金額：</strong>
        <span>{{ contract.totalAmount | number: '1.0-0' }} {{ contract.currency }}</span>
      </div>
      <div class="text-muted mb-sm">
        期間：{{ contract.startDate | date: 'yyyy-MM-dd' }} ~
        {{ contract.endDate | date: 'yyyy-MM-dd' }}
      </div>
      <div class="flex gap-sm justify-end">
        <button nz-button nzType="link" (click)="viewDetail.emit()">
          查看詳情
        </button>
      </div>
    </nz-card>
  `
})
export class ContractCardComponent {
  @Input({ required: true }) contract!: ContractModel;
  @Output() viewDetail = new EventEmitter<void>();
}
