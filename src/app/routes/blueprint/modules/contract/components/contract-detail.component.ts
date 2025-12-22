import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SHARED_IMPORTS } from '@shared';
import { ContractFacade } from '../services/contract.facade';
import { ContractStatusBadgeComponent } from '../ui/contract-status-badge.component';

@Component({
  selector: 'app-contract-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS, ContractStatusBadgeComponent],
  template: `
    <page-header [title]="contract()?.title || '合約詳情'" />
    @if (loading()) {
      <nz-spin nzSimple />
    } @else if (!contract()) {
      <nz-empty nzNotFoundContent="找不到合約" />
    } @else {
      <nz-card>
        <div class="flex gap-sm items-center mb-sm">
          <app-contract-status-badge [status]="contract()!.status" />
          <span class="text-muted">編號：{{ contract()!.contractNumber }}</span>
        </div>
        <p class="text-muted mb-md">{{ contract()!.description || '尚無描述' }}</p>
        <div class="grid grid-cols-2 gap-md">
          <div>
            <strong>甲方：</strong>{{ contract()!.partyA.name }}
          </div>
          <div>
            <strong>乙方：</strong>{{ contract()!.partyB.name }}
          </div>
          <div>
            <strong>總額：</strong>{{ contract()!.totalAmount | number: '1.0-0' }}
            {{ contract()!.currency }}
          </div>
          <div>
            <strong>已付：</strong>{{ contract()!.paidAmount | number: '1.0-0' }}
          </div>
          <div>
            <strong>期間：</strong>
            {{ contract()!.startDate | date: 'yyyy-MM-dd' }} ~
            {{ contract()!.endDate | date: 'yyyy-MM-dd' }}
          </div>
          <div>
            <strong>版本：</strong>{{ contract()!.version }}
          </div>
        </div>
      </nz-card>
    }
  `
})
export class ContractDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(ContractFacade);

  readonly contract = this.facade.selectedContract;
  readonly loading = this.facade.contractsState.loading;

  constructor() {
    const id = this.route.snapshot.paramMap.get('contractId');
    const blueprintId =
      this.route.snapshot.paramMap.get('blueprintId') ??
      this.route.parent?.snapshot.paramMap.get('blueprintId') ??
      '';

    if (blueprintId) {
      void this.facade.loadByBlueprint(blueprintId);
    }
    if (id) this.facade.select(id);
  }
}
