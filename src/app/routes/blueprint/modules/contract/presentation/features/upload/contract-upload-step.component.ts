/**
 * Contract Upload Step Component
 * 合約上傳步驟元件
 *
 * Feature: Upload
 * Responsibility: Handle contract file upload in creation wizard
 * Interface: Emits file upload events
 */

import { Component, ChangeDetectionStrategy, input, output, signal, inject } from '@angular/core';
import type { FileAttachment } from '../../../data/models';
import { ContractUploadService } from '../../../application/services';
import { SHARED_IMPORTS } from '@shared';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzUploadFile, NzUploadChangeParam } from 'ng-zorro-antd/upload';

@Component({
  selector: 'app-contract-upload-step',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS],
  template: `
    <nz-card nzTitle="上傳合約文件">
      <nz-alert
        nzType="info"
        nzMessage="請上傳合約文件 (PDF、JPG、PNG)"
        nzDescription="上傳的文件將用於 AI 自動解析合約內容，提升建立效率。您可以選擇跳過此步驟，手動輸入合約資訊。"
        [nzShowIcon]="true"
        class="mb-md"
      />

      <!-- Upload Area -->
      <nz-upload
        nzType="drag"
        [nzMultiple]="false"
        [nzAccept]="acceptedExtensions"
        [nzBeforeUpload]="beforeUpload"
        [nzFileList]="fileList()"
        (nzChange)="handleChange($event)"
        [nzShowUploadList]="true"
        [nzDisabled]="uploading()"
      >
        <p class="ant-upload-drag-icon">
          <span nz-icon nzType="inbox" nzTheme="outline"></span>
        </p>
        <p class="ant-upload-text">點擊或拖曳文件到此區域上傳</p>
        <p class="ant-upload-hint">支援 PDF、JPG、PNG 格式，最大 10MB</p>
      </nz-upload>

      <!-- Upload Progress -->
      @if (uploading()) {
        <nz-progress [nzPercent]="uploadProgress()" nzStatus="active" class="mt-md" />
      }

      <!-- Uploaded File Info -->
      @if (uploadedFile()) {
        <nz-card nzTitle="已上傳文件" [nzSize]="'small'" class="mt-md">
          <div class="file-info">
            <div class="file-icon">
              <span
                nz-icon
                [nzType]="getFileIcon(uploadedFile()!.fileType)"
                nzTheme="outline"
                style="font-size: 48px; color: #1890ff;"
              ></span>
            </div>
            <div class="file-details">
              <div><strong>檔名：</strong>{{ uploadedFile()!.fileName }}</div>
              <div><strong>大小：</strong>{{ formatFileSize(uploadedFile()!.fileSize) }}</div>
              <div><strong>類型：</strong>{{ uploadedFile()!.fileType }}</div>
              <div><strong>上傳時間：</strong>{{ uploadedFile()!.uploadedAt | date: 'yyyy-MM-dd HH:mm:ss' }}</div>
            </div>
          </div>
          <button nz-button nzType="link" nzDanger (click)="removeFile()">
            <span nz-icon nzType="delete" nzTheme="outline"></span>
            移除文件
          </button>
        </nz-card>
      }

      <!-- Instructions -->
      <nz-divider />
      <div class="instructions">
        <h4>說明：</h4>
        <ul>
          <li>上傳後系統將自動使用 AI 解析合約內容</li>
          <li>解析結果可在下一步驟檢視與修改</li>
          <li>若不上傳文件，請點擊「跳過」直接填寫合約資訊</li>
        </ul>
      </div>
    </nz-card>
  `,
  styles: [
    `
      .file-info {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 16px;
      }
      .file-icon {
        flex-shrink: 0;
      }
      .file-details {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .instructions {
        padding: 16px;
        background-color: #fafafa;
        border-radius: 4px;
      }
      .instructions ul {
        margin: 8px 0 0 0;
        padding-left: 24px;
      }
    `
  ]
})
export class ContractUploadStepComponent {
  private readonly uploadService = inject(ContractUploadService);
  private readonly message = inject(NzMessageService);

  // Inputs
  blueprintId = input.required<string>();
  contractId = input.required<string>();

  // Outputs
  fileUploaded = output<FileAttachment>();
  fileRemoved = output<void>();

  // State
  fileList = signal<NzUploadFile[]>([]);
  uploading = signal(false);
  uploadProgress = signal(0);
  uploadedFile = signal<FileAttachment | null>(null);

  // Accepted file extensions
  get acceptedExtensions(): string {
    return this.uploadService.getAcceptedExtensions();
  }

  /**
   * Before upload validation
   */
  beforeUpload = (file: NzUploadFile): boolean => {
    // Validate file
    const validation = this.uploadService.validateFile(file as any as File);

    if (!validation.isValid) {
      validation.errors.forEach(error => {
        this.message.error(error);
      });
      return false;
    }

    // Don't auto upload, we'll handle it manually
    return false;
  };

  /**
   * Handle file change event
   */
  async handleChange(event: NzUploadChangeParam): Promise<void> {
    const { file, fileList } = event;

    // Update file list
    this.fileList.set(fileList);

    // If file is selected and not uploading
    if (file.status !== 'uploading' && file.originFileObj) {
      await this.uploadFile(file.originFileObj);
    }
  }

  /**
   * Upload file to storage
   */
  private async uploadFile(file: File): Promise<void> {
    this.uploading.set(true);
    this.uploadProgress.set(0);

    try {
      const blueprintId = this.blueprintId();
      const contractId = this.contractId();

      // Simulate progress for user feedback
      const progressInterval = setInterval(() => {
        this.uploadProgress.update(p => Math.min(p + 10, 90));
      }, 200);

      // Upload file
      const fileAttachment = await this.uploadService.uploadContractFile(blueprintId, contractId, file, 'current-user');

      clearInterval(progressInterval);
      this.uploadProgress.set(100);

      // Store uploaded file
      this.uploadedFile.set(fileAttachment);

      // Emit event
      this.fileUploaded.emit(fileAttachment);

      this.message.success('文件上傳成功');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '上傳失敗';
      this.message.error(`上傳失敗: ${errorMessage}`);
      console.error('[ContractUploadStep]', 'Upload failed', error);

      // Clear file list on error
      this.fileList.set([]);
    } finally {
      this.uploading.set(false);
    }
  }

  /**
   * Remove uploaded file
   */
  removeFile(): void {
    this.uploadedFile.set(null);
    this.fileList.set([]);
    this.uploadProgress.set(0);
    this.fileRemoved.emit();
    this.message.info('已移除文件');
  }

  /**
   * Get file icon based on file type
   */
  getFileIcon(fileType: string): string {
    if (fileType.includes('pdf')) return 'file-pdf';
    if (fileType.includes('image')) return 'file-image';
    return 'file';
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
