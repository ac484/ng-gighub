import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';

@Component({
  selector: 'app-contract-upload',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS],
  template: `
    <page-header [title]="'上傳合約 (僅示意)'" />
    <nz-card>
      <p class="text-muted">僅示意：限制 PDF，大小 10MB。實作時串接 Storage 與 Cloud Functions。</p>
      <input type="file" accept="application/pdf" (change)="onFileChange($event)" />
      @if (fileName()) {
        <p class="mt-sm">已選擇：{{ fileName() }}</p>
      }
      <button nz-button nzType="primary" [disabled]="!fileName()" class="mt-md">
        上傳
      </button>
    </nz-card>
  `
})
export class ContractUploadComponent {
  readonly blueprintId = input<string>();
  readonly fileName = signal<string | null>(null);

  onFileChange(event: Event): void {
    const inputEl = event.target as HTMLInputElement;
    const file = inputEl.files?.[0];
    this.fileName.set(file?.name ?? null);
  }
}
