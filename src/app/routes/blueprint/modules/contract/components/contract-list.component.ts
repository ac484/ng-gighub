import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { ContractFacade } from '../services/contract.facade';

@Component({
  selector: 'app-contract-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS],
  template: `
    <page-header [title]="'合約 (Contract)'" />
    <nz-card>
      <p class="text-muted">Contract 模組雛形，待接資料與權限流程。</p>
      @if (loading()) {
        <nz-spin nzSimple />
      }
      @if (!loading()) {
        <nz-alert nzType="info" nzMessage="尚未串接資料" />
      }
    </nz-card>
  `
})
export class ContractListComponent {
  private readonly facade = inject(ContractFacade);
  loading = signal(false);
}
