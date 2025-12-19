/**
 * Contract Preview Modal Component
 * 合約預覽彈窗元件
 *
 * Feature: Preview
 * Responsibility: Display contract document using Google Docs Viewer
 * Interface: Modal for viewing contract files
 */

import { Component, ChangeDetectionStrategy, inject, input, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import type { FileAttachment } from '@core/blueprint/modules/implementations/contract/models';
import { SHARED_IMPORTS } from '@shared';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';

/**
 * Modal data interface
 */
export interface ContractPreviewModalData {
  file: FileAttachment;
  contractNumber?: string;
}

@Component({
  selector: 'app-contract-preview-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS],
  template: `
    <div class="preview-container">
      <!-- Header Info -->
      <nz-alert nzType="info" nzMessage="文件預覽" [nzDescription]="fileDescription" [nzShowIcon]="true" class="mb-md" />

      <!-- Preview Frame -->
      @if (isPreviewable()) {
        <div class="preview-frame-wrapper">
          @if (isPdfFile()) {
            <!-- Use Google Docs Viewer for PDF -->
            <iframe [src]="googleDocsViewerUrl()" class="preview-frame" frameborder="0" allowfullscreen></iframe>
          } @else if (isImageFile()) {
            <!-- Direct image display -->
            <div class="image-preview">
              <img [src]="file().fileUrl" [alt]="file().fileName" />
            </div>
          }
        </div>
      } @else {
        <!-- Not previewable -->
        <nz-empty nzNotFoundImage="simple" [nzNotFoundContent]="notPreviewableContent" />
      }

      <!-- Footer Actions -->
      <div class="modal-footer">
        <button nz-button nzType="default" (click)="downloadFile()">
          <span nz-icon nzType="download" nzTheme="outline"></span>
          下載文件
        </button>
        <button nz-button nzType="primary" (click)="closeModal()">關閉</button>
      </div>
    </div>

    <!-- Template for not previewable content -->
    <ng-template #notPreviewableContent>
      <p>此文件類型無法直接預覽</p>
      <p>請下載文件後使用相應應用程式開啟</p>
    </ng-template>

    <!-- Template for file description -->
    <ng-template #fileDescription>
      <div>
        <strong>檔名：</strong>{{ file().fileName }}<br />
        <strong>大小：</strong>{{ formatFileSize(file().fileSize) }}<br />
        <strong>上傳時間：</strong>{{ file().uploadedAt | date: 'yyyy-MM-dd HH:mm:ss' }}
      </div>
    </ng-template>
  `,
  styles: [
    `
      .preview-container {
        display: flex;
        flex-direction: column;
        height: 100%;
      }

      .preview-frame-wrapper {
        flex: 1;
        min-height: 600px;
        position: relative;
        background-color: #f0f0f0;
        border-radius: 4px;
        overflow: hidden;
      }

      .preview-frame {
        width: 100%;
        height: 100%;
        min-height: 600px;
        border: none;
      }

      .image-preview {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        padding: 24px;
      }

      .image-preview img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      }

      .modal-footer {
        margin-top: 16px;
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        padding-top: 16px;
        border-top: 1px solid #f0f0f0;
      }
    `
  ]
})
export class ContractPreviewModalComponent {
  private readonly modalRef = inject(NzModalRef);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly modalData = inject<ContractPreviewModalData>(NZ_MODAL_DATA);

  // File from modal data
  file = signal<FileAttachment>(this.modalData.file);
  contractNumber = signal<string | undefined>(this.modalData.contractNumber);

  /**
   * Check if file is PDF
   */
  isPdfFile(): boolean {
    return this.file().fileType.includes('pdf');
  }

  /**
   * Check if file is image
   */
  isImageFile(): boolean {
    const fileType = this.file().fileType;
    return fileType.includes('image') || fileType.includes('jpeg') || fileType.includes('jpg') || fileType.includes('png');
  }

  /**
   * Check if file is previewable
   */
  isPreviewable(): boolean {
    return this.isPdfFile() || this.isImageFile();
  }

  /**
   * Get Google Docs Viewer URL for PDF
   */
  googleDocsViewerUrl(): SafeResourceUrl {
    const fileUrl = encodeURIComponent(this.file().fileUrl);
    const viewerUrl = `https://docs.google.com/viewer?url=${fileUrl}&embedded=true`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(viewerUrl);
  }

  /**
   * Download file
   */
  downloadFile(): void {
    const file = this.file();
    const link = document.createElement('a');
    link.href = file.fileUrl;
    link.download = file.fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Close modal
   */
  closeModal(): void {
    this.modalRef.close();
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
  }
}
