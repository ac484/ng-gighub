import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SHARED_IMPORTS } from '@shared';
import { ContractFacade } from '../services/contract.facade';
import { ContractCardComponent } from '../ui/contract-card.component';

@Component({
  selector: 'app-contract-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS, RouterLink, ContractCardComponent],
  template: `
    <page-header [title]="'合約 (Contract)'" />
    <nz-card>
      <div class="grid grid-cols-2 gap-12 mb-md">
        <div>
          <p class="text-muted">合約模組依設計文件實作，支援狀態分組與金額統計。</p>
          <div class="flex gap-sm items-center">
            <strong>總數：</strong>
            <span>{{ statistics().count }}</span>
            <strong class="ml-md">總額：</strong>
            <span>{{ statistics().totalAmount | number: '1.0-0' }}</span>
          </div>
        </div>
        <div class="flex gap-sm items-center justify-end">
          <button nz-button nzType="primary" routerLink="new">建立合約</button>
          <button nz-button nzType="default" routerLink="upload">上傳合約</button>
        </div>
      </div>
      @if (loading()) {
        <nz-spin nzSimple />
      } @else if (contracts().length === 0) {
        <nz-alert nzType="info" nzMessage="尚未有合約資料" />
      } @else {
        <div class="grid grid-cols-2 gap-16">
          @for (contract of contracts(); track contract.id) {
            <app-contract-card
              [contract]="contract"
              (viewDetail)="onSelect(contract.id!)"
            />
          }
        </div>
      }
    </nz-card>
  `
})
export class ContractListComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(ContractFacade);
  readonly blueprintId = input<string>();

  readonly contracts = computed(() => this.facade.contractsState.data());
  readonly loading = computed(() => this.facade.contractsState.loading());
  readonly statistics = this.facade.statistics;

  constructor() {
    this.facade.ensureLoaded(this.blueprintIdSignal);
  }

  onSelect(contractId: string): void {
    this.facade.select(contractId);
  }

  private readonly blueprintIdSignal = computed(() => {
    const fromInput = this.blueprintId();
    if (fromInput) return fromInput;
    return this.route.snapshot.paramMap.get('blueprintId') ?? '';
  });
}
