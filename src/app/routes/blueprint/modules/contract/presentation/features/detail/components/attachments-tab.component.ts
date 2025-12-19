/**
 * Attachments Tab Component
 * 附件標籤元件
 *
 * Feature: Detail
 * Responsibility: Display and manage contract attachments
 * Interface: Outputs download event
 */

import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import type { Contract } from '@core/blueprint/modules/implementations/contract/models';
import { SHARED_IMPORTS } from '@shared';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzTableModule } from 'ng-zorro-antd/table';

@Component({
  selector: 'app-attachments-tab',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS, NzTableModule, NzEmptyModule],
  template: `
    @if (attachments() && attachments().length > 0) {
      <nz-table #attachmentsTable [nzData]="attachments()" [nzPageSize]="10" nzSize="small">
        <thead>
          <tr>
            <th>檔案名稱</th>
            <th nzWidth="100px">類型</th>
            <th nzWidth="100px">大小</th>
            <th nzWidth="120px">上傳時間</th>
            <th nzWidth="80px">操作</th>
          </tr>
        </thead>
        <tbody>
          @for (file of attachmentsTable.data; track file.id) {
            <tr>
              <td>{{ file.fileName }}</td>
              <td>{{ file.fileType }}</td>
              <td>{{ formatFileSize(file.fileSize) }}</td>
              <td>{{ file.uploadedAt | date: 'yyyy-MM-dd HH:mm' }}</td>
              <td>
                <button nz-button nzType="link" nzSize="small" (click)="downloadFile.emit(file)">
                  <span nz-icon nzType="download"></span>
                </button>
              </td>
            </tr>
          }
        </tbody>
      </nz-table>
    } @else {
      <nz-empty nzNotFoundContent="尚無附件"></nz-empty>
    }
  `
})
export class AttachmentsTabComponent {
  contract = input.required<Contract>();

  attachments = computed(() => {
    return this.contract()?.attachments || [];
  });

  readonly downloadFile = output<any>();

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
  }
}
