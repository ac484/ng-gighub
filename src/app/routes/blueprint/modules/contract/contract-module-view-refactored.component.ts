import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';

import type { Contract } from './data/models';
import { ContractService } from './application/services';
import { ContractStore } from './application/state';

@Component({
  selector: 'app-contract-module-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS, NzCardModule, NzTableModule, NzTagModule, NzSpinModule, NzEmptyModule],
  template: `
    <nz-card nzTitle="合約概況" class="mb-md">
      <nz-row [nzGutter]="16">
        <nz-col [nzSpan]="6">
          <div class="stat">
            <div class="stat__label">總數</div>
            <div class="stat__value">{{ totalCount() }}</div>
          </div>
        </nz-col>
        <nz-col [nzSpan]="6">
          <div class="stat">
            <div class="stat__label">有效</div>
            <div class="stat__value">{{ activeCount() }}</div>
          </div>
        </nz-col>
        <nz-col [nzSpan]="6">
          <div class="stat">
            <div class="stat__label">草稿</div>
            <div class="stat__value">{{ draftCount() }}</div>
          </div>
        </nz-col>
        <nz-col [nzSpan]="6">
          <div class="stat">
            <div class="stat__label">待啟用</div>
            <div class="stat__value">{{ pendingCount() }}</div>
          </div>
        </nz-col>
      </nz-row>
    </nz-card>

    <nz-card nzTitle="合約列表" [nzExtra]="actionsTpl">
      <ng-template #actionsTpl>
        <button nz-button nzSize="small" (click)="reload()">重新整理</button>
      </ng-template>

      @if (loading()) {
        <nz-spin nzSimple />
      } @else if (contracts().length === 0) {
        <nz-empty nzNotFoundContent="尚未建立合約" />
      } @else {
        <nz-table [nzData]="contracts()" nzSize="small" [nzShowPagination]="false">
          <thead>
            <tr>
              <th scope="col">序號</th>
              <th scope="col">合約編號</th>
              <th scope="col">標題</th>
              <th scope="col">狀態</th>
              <th scope="col" class="text-right">金額</th>
            </tr>
          </thead>
          <tbody>
            @for (contract of contracts(); track contract.id; let idx = $index) {
              <tr>
                <td>{{ idx + 1 }}</td>
                <td>{{ contract.contractNumber || '—' }}</td>
                <td>{{ contract.title }}</td>
                <td>
                  <nz-tag [nzColor]="getStatusColor(contract.status)">{{ getStatusLabel(contract.status) }}</nz-tag>
                </td>
                <td class="text-right">{{ contract.totalAmount | number: '1.0-0' }}</td>
              </tr>
            }
          </tbody>
        </nz-table>
      }
    </nz-card>
  `,
  styles: [
    `
      .stat {
        padding: 12px 8px;
      }

      .stat__label {
        color: #666;
        font-size: 12px;
      }

      .stat__value {
        font-size: 20px;
        font-weight: 600;
      }

      .text-right {
        text-align: right;
      }
    `
  ]
})
export class ContractModuleViewComponent {
  blueprintId = input.required<string>();

  private readonly service = inject(ContractService);
  private readonly store = inject(ContractStore);
  private readonly message = inject(NzMessageService);

  readonly contracts = this.store.contracts;
  readonly loading = this.store.loading;

  readonly totalCount = computed(() => this.contracts().length);
  readonly activeCount = computed(() => this.contracts().filter(c => c.status === 'active').length);
  readonly draftCount = computed(() => this.contracts().filter(c => c.status === 'draft').length);
  readonly pendingCount = computed(() => this.contracts().filter(c => c.status === 'pending_activation').length);

  constructor() {
    effect(() => {
      const id = this.blueprintId();
      if (id) {
        void this.reload();
      }
    });
  }

  async reload(): Promise<void> {
    if (!this.blueprintId()) return;
    this.store.setLoading(true);
    try {
      await this.service.loadContracts(this.blueprintId());
    } catch (error) {
      this.message.error('載入合約失敗');
      console.error('[ContractModuleView]', 'reload failed', error);
    } finally {
      this.store.setLoading(false);
    }
  }

  getStatusColor(status: Contract['status']): string {
    const map: Record<Contract['status'], string> = {
      draft: 'default',
      pending_activation: 'processing',
      active: 'green',
      completed: 'blue',
      terminated: 'red'
    };
    return map[status] ?? 'default';
  }

  getStatusLabel(status: Contract['status']): string {
    const map: Record<Contract['status'], string> = {
      draft: '草稿',
      pending_activation: '待啟用',
      active: '生效',
      completed: '完成',
      terminated: '終止'
    };
    return map[status] ?? status;
  }
}
