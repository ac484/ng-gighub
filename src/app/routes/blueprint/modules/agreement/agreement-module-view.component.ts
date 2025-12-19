import { ChangeDetectionStrategy, Component, effect, inject, input, output, computed, signal } from '@angular/core';
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
            <div class="stat__value">{{ totalCount() }}</div>
          </div>
        </nz-col>
        <nz-col [nzSpan]="8">
          <div class="stat">
            <div class="stat__label">有效</div>
            <div class="stat__value">{{ activeCount() }}</div>
          </div>
        </nz-col>
        <nz-col [nzSpan]="8">
          <div class="stat">
            <div class="stat__label">草稿</div>
            <div class="stat__value">{{ draftCount() }}</div>
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
              <th scope="col">序號</th>
              <th scope="col">附件</th>
              <th scope="col">欄位3</th>
              <th scope="col">欄位4</th>
              <th scope="col">欄位5</th>
              <th scope="col">欄位6</th>
            </tr>
          </thead>
          <tbody>
            @for (agreement of agreements(); track agreement.id; let idx = $index) {
              <tr>
                <td>{{ idx + 1 }}</td>
                <td>
                  <button
                    nz-button
                    nzType="link"
                    [disabled]="uploadingId() === agreement.id"
                    (click)="agreement.attachmentUrl ? viewAttachment(agreement.attachmentUrl) : triggerUpload(fileInput, agreement.id)"
                  >
                    <span nz-icon [nzType]="agreement.attachmentUrl ? 'eye' : 'plus'"></span>
                  </button>
                  <input
                    #fileInput
                    type="file"
                    accept="application/pdf"
                    style="display: none;"
                    (change)="onFileSelected($event, agreement.id)"
                  />
                </td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
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
  readonly totalCount = computed(() => this.agreements().length);
  readonly activeCount = computed(() => this.agreements().filter(a => a.status === 'active').length);
  readonly draftCount = computed(() => this.agreements().filter(a => a.status === 'draft').length);
  uploadingId = signal<string | null>(null);

  constructor() {
    effect(() => {
      const id = this.blueprintId();
      void this.agreementService.loadByBlueprint(id);
    });
  }

  onSelect(agreement: Agreement): void {
    this.agreementSelected.emit(agreement);
  }

  triggerUpload(input: HTMLInputElement, agreementId: string): void {
    this.uploadingId.set(agreementId);
    input.click();
  }

  async onFileSelected(event: Event, agreementId: string): Promise<void> {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    target.value = '';
    if (!file || !this.blueprintId()) {
      this.uploadingId.set(null);
      return;
    }
    try {
      await this.agreementService.uploadAttachment(this.blueprintId(), agreementId, file);
    } catch (error) {
      console.error('[AgreementModuleView]', 'Upload failed', error);
    } finally {
      this.uploadingId.set(null);
    }
  }

  viewAttachment(url: string): void {
    const viewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`;
    window.open(viewerUrl, '_blank');
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
