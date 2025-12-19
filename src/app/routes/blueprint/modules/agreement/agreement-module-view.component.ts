import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';

import { Agreement } from './agreement.model';
import { AgreementService } from './agreement.service';

@Component({
  selector: 'app-agreement-module-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS, NzTableModule, NzTagModule, NzEmptyModule, NzSpinModule],
  template: `
    <nz-card nzTitle="協議概況" class="mb-md">
      <nz-row [nzGutter]="16">
        <nz-col [nzSpan]="8">
          <div class="stat">
            <div class="stat__label">總數</div>
            <div class="stat__value">{{ agreements().length }}</div>
          </div>
        </nz-col>
        <nz-col [nzSpan]="8">
          <div class="stat">
            <div class="stat__label">有效</div>
            <div class="stat__value">{{ agreements().filter(a => a.status === 'active').length }}</div>
          </div>
        </nz-col>
        <nz-col [nzSpan]="8">
          <div class="stat">
            <div class="stat__label">草稿</div>
            <div class="stat__value">{{ agreements().filter(a => a.status === 'draft').length }}</div>
          </div>
        </nz-col>
      </nz-row>
    </nz-card>

    <nz-card nzTitle="協議列表">
      @if (loading()) {
        <nz-spin nzSimple />
      } @else if (agreements().length === 0) {
        <nz-empty nzNotFoundContent="尚未建立協議" />
      } @else {
        <nz-table [nzData]="agreements()" nzSize="small" [nzShowPagination]="false">
          <thead>
            <tr>
              <th scope="col">名稱</th>
              <th scope="col">相對方</th>
              <th scope="col">狀態</th>
              <th scope="col">生效日</th>
              <th scope="col">金額</th>
              <th scope="col" class="text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            @for (agreement of agreements(); track agreement.id) {
              <tr>
                <td>{{ agreement.title }}</td>
                <td>{{ agreement.counterparty }}</td>
                <td>
                  <nz-tag [nzColor]="getStatusColor(agreement.status)">{{ getStatusLabel(agreement.status) }}</nz-tag>
                </td>
                <td>{{ agreement.effectiveDate | date: 'yyyy-MM-dd' }}</td>
                <td>{{ agreement.value ? (agreement.value | number: '1.0-0') : '-' }}</td>
                <td class="text-right">
                  <button nz-button nzType="link" (click)="onSelect(agreement)">檢視</button>
                </td>
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
export class AgreementModuleViewComponent {
  blueprintId = input.required<string>();
  agreementSelected = output<Agreement>();

  private readonly agreementService = inject(AgreementService);

  readonly agreements = this.agreementService.agreements;
  readonly loading = this.agreementService.loading;

  constructor() {
    effect(() => {
      const id = this.blueprintId();
      void this.agreementService.loadByBlueprint(id);
    });
  }

  onSelect(agreement: Agreement): void {
    this.agreementSelected.emit(agreement);
  }

  getStatusColor(status: Agreement['status']): string {
    const map: Record<Agreement['status'], string> = {
      draft: 'default',
      active: 'green',
      expired: 'volcano'
    };
    return map[status] ?? 'default';
  }

  getStatusLabel(status: Agreement['status']): string {
    const map: Record<Agreement['status'], string> = {
      draft: '草稿',
      active: '有效',
      expired: '到期'
    };
    return map[status] ?? status;
  }
}
