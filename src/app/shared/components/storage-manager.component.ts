/**
 * Storage Manager Component
 *
 * Calls functions-storage Firebase Functions for file operations
 * - updateFileMetadata: Update file metadata in Cloud Storage
 * - File upload handling with validation
 *
 * @module ContractModule
 * @see functions-storage README for API documentation
 */

import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { Storage, ref, uploadBytesResumable, getDownloadURL, UploadTask } from '@angular/fire/storage';
import { SHARED_IMPORTS } from '@shared';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzUploadFile, NzUploadModule, NzUploadChangeParam } from 'ng-zorro-antd/upload';

import { UpdateFileMetadataRequest, UpdateFileMetadataResponse } from './types/firebase-functions.types';

interface FileItem {
  name: string;
  path: string;
  size: number;
  type: string;
  uploadProgress: number;
  downloadURL?: string;
  status: 'uploading' | 'success' | 'error';
}

@Component({
  selector: 'app-storage-manager',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS, NzUploadModule],
  template: `
    <nz-card nzTitle="Storage 檔案管理">
      <nz-tabset>
        <!-- Upload Tab -->
        <nz-tab nzTitle="檔案上傳">
          <div class="p-md">
            <nz-alert
              nzType="info"
              nzMessage="支援的檔案類型"
              nzDescription="圖片 (JPEG, PNG, GIF, WebP), 文件 (PDF, DOC, DOCX), 壓縮檔 (ZIP, RAR)"
              nzShowIcon
              class="mb-md"
            />

            <nz-upload
              nzType="drag"
              [nzMultiple]="true"
              [nzBeforeUpload]="beforeUpload"
              [nzShowUploadList]="false"
              nzAccept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp,.zip,.rar"
            >
              <p class="ant-upload-drag-icon">
                <span nz-icon nzType="inbox"></span>
              </p>
              <p class="ant-upload-text">點擊或拖曳檔案到此區域上傳</p>
              <p class="ant-upload-hint"> 支援單個或批量上傳。最大檔案大小: 100MB </p>
            </nz-upload>

            @if (uploadedFiles().length > 0) {
              <nz-divider />
              <nz-list [nzDataSource]="uploadedFiles()" nzBordered>
                <nz-list-item *ngFor="let item of uploadedFiles()">
                  <nz-list-item-meta [nzTitle]="item.name" [nzDescription]="formatFileSize(item.size) + ' - ' + item.type">
                    <nz-list-item-meta-avatar>
                      @if (item.status === 'uploading') {
                        <nz-spin nzSimple [nzSize]="'small'" />
                      } @else if (item.status === 'success') {
                        <span nz-icon nzType="check-circle" nzTheme="fill" style="color: #52c41a;"></span>
                      } @else {
                        <span nz-icon nzType="close-circle" nzTheme="fill" style="color: #ff4d4f;"></span>
                      }
                    </nz-list-item-meta-avatar>
                  </nz-list-item-meta>

                  @if (item.status === 'uploading') {
                    <nz-progress [nzPercent]="item.uploadProgress" [nzStatus]="'active'" [nzShowInfo]="false" class="upload-progress" />
                  }

                  @if (item.status === 'success' && item.downloadURL) {
                    <div>
                      <a [href]="item.downloadURL" target="_blank" nz-button nzType="link">
                        <span nz-icon nzType="download"></span>
                        下載
                      </a>
                      <button nz-button nzType="link" (click)="showMetadataEditor(item)">
                        <span nz-icon nzType="edit"></span>
                        編輯 Metadata
                      </button>
                    </div>
                  }
                </nz-list-item>
              </nz-list>
            }
          </div>
        </nz-tab>

        <!-- Metadata Editor Tab -->
        <nz-tab nzTitle="Metadata 編輯器">
          <div class="p-md">
            <nz-form-item>
              <nz-form-label [nzSpan]="4">檔案路徑</nz-form-label>
              <nz-form-control [nzSpan]="20">
                <input nz-input [(ngModel)]="metadataFilePath" placeholder="projects/project-id/file.pdf" />
              </nz-form-control>
            </nz-form-item>

            <nz-form-item>
              <nz-form-label [nzSpan]="4">描述</nz-form-label>
              <nz-form-control [nzSpan]="20">
                <textarea nz-input rows="3" [(ngModel)]="metadataDescription" placeholder="檔案描述..."></textarea>
              </nz-form-control>
            </nz-form-item>

            <nz-form-item>
              <nz-form-label [nzSpan]="4">標籤</nz-form-label>
              <nz-form-control [nzSpan]="20">
                <nz-select nzMode="tags" nzPlaceHolder="輸入標籤並按 Enter" [(ngModel)]="metadataTags"> </nz-select>
              </nz-form-control>
            </nz-form-item>

            <nz-form-item>
              <nz-form-label [nzSpan]="4">分類</nz-form-label>
              <nz-form-control [nzSpan]="20">
                <nz-select [(ngModel)]="metadataCategory" nzPlaceHolder="選擇分類">
                  <nz-option nzValue="contract" nzLabel="合約文件" />
                  <nz-option nzValue="drawing" nzLabel="施工圖" />
                  <nz-option nzValue="photo" nzLabel="現場照片" />
                  <nz-option nzValue="report" nzLabel="報告" />
                  <nz-option nzValue="other" nzLabel="其他" />
                </nz-select>
              </nz-form-control>
            </nz-form-item>

            <nz-form-item>
              <nz-form-control [nzOffset]="4" [nzSpan]="20">
                <button
                  nz-button
                  nzType="primary"
                  [nzLoading]="metadataLoading()"
                  [disabled]="!metadataFilePath"
                  (click)="updateMetadata()"
                >
                  <span nz-icon nzType="save"></span>
                  更新 Metadata
                </button>
              </nz-form-control>
            </nz-form-item>

            @if (metadataResult()) {
              <nz-alert
                [nzType]="metadataResult()!.success ? 'success' : 'error'"
                [nzMessage]="metadataResult()!.success ? 'Metadata 更新成功!' : 'Metadata 更新失敗'"
                [nzDescription]="metadataResult()!.message"
                nzShowIcon
                nzCloseable
                (nzOnClose)="metadataResult.set(null)"
              />
            }
          </div>
        </nz-tab>
      </nz-tabset>
    </nz-card>
  `,
  styles: [
    `
      .upload-progress {
        width: 200px;
      }
    `
  ]
})
export class StorageManagerComponent {
  private functions = inject(Functions);
  private storage = inject(Storage);
  private message = inject(NzMessageService);

  // State
  uploadedFiles = signal<FileItem[]>([]);
  metadataLoading = signal(false);
  metadataResult = signal<UpdateFileMetadataResponse | null>(null);

  // Metadata form
  metadataFilePath = '';
  metadataDescription = '';
  metadataTags: string[] = [];
  metadataCategory = '';

  /**
   * Before upload handler
   */
  beforeUpload = (file: NzUploadFile): boolean => {
    this.uploadFile(file as unknown as File);
    return false; // Prevent auto upload
  };

  /**
   * Upload file to Firebase Storage
   */
  private async uploadFile(file: File): Promise<void> {
    // Validate file size (100MB max)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      this.message.error('檔案大小超過 100MB 限制');
      return;
    }

    // Create file item
    const fileItem: FileItem = {
      name: file.name,
      path: `contracts/${Date.now()}_${file.name}`,
      size: file.size,
      type: file.type,
      uploadProgress: 0,
      status: 'uploading'
    };

    // Add to list
    this.uploadedFiles.update(files => [...files, fileItem]);

    try {
      // Create storage reference
      const storageRef = ref(this.storage, fileItem.path);

      // Upload file
      const uploadTask: UploadTask = uploadBytesResumable(storageRef, file);

      // Monitor upload progress
      uploadTask.on(
        'state_changed',
        snapshot => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          this.updateFileProgress(fileItem.path, progress);
        },
        error => {
          console.error('Upload error:', error);
          this.updateFileStatus(fileItem.path, 'error');
          this.message.error(`上傳失敗: ${file.name}`);
        },
        async () => {
          // Upload complete
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          this.updateFileComplete(fileItem.path, downloadURL);
          this.message.success(`上傳成功: ${file.name}`);
        }
      );
    } catch (error: any) {
      console.error('Upload error:', error);
      this.updateFileStatus(fileItem.path, 'error');
      this.message.error(`上傳失敗: ${file.name}`);
    }
  }

  /**
   * Update file upload progress
   */
  private updateFileProgress(path: string, progress: number): void {
    this.uploadedFiles.update(files => files.map(file => (file.path === path ? { ...file, uploadProgress: Math.round(progress) } : file)));
  }

  /**
   * Update file status
   */
  private updateFileStatus(path: string, status: FileItem['status']): void {
    this.uploadedFiles.update(files => files.map(file => (file.path === path ? { ...file, status } : file)));
  }

  /**
   * Update file with download URL
   */
  private updateFileComplete(path: string, downloadURL: string): void {
    this.uploadedFiles.update(files =>
      files.map(file => (file.path === path ? { ...file, status: 'success' as const, downloadURL, uploadProgress: 100 } : file))
    );
  }

  /**
   * Format file size
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
  }

  /**
   * Show metadata editor for file
   */
  showMetadataEditor(file: FileItem): void {
    this.metadataFilePath = file.path;
    this.metadataDescription = '';
    this.metadataTags = [];
    this.metadataCategory = '';
    this.metadataResult.set(null);
  }

  /**
   * Update file metadata
   */
  async updateMetadata(): Promise<void> {
    if (!this.metadataFilePath) {
      this.message.warning('請輸入檔案路徑');
      return;
    }

    this.metadataLoading.set(true);
    this.metadataResult.set(null);

    try {
      const callable = httpsCallable<UpdateFileMetadataRequest, UpdateFileMetadataResponse>(this.functions, 'updateFileMetadata');

      const response = await callable({
        filePath: this.metadataFilePath,
        metadata: {
          description: this.metadataDescription,
          tags: this.metadataTags,
          category: this.metadataCategory
        }
      });

      this.metadataResult.set(response.data);

      if (response.data.success) {
        this.message.success('Metadata 更新成功!');
      } else {
        this.message.error(response.data.message || 'Metadata 更新失敗');
      }
    } catch (error: any) {
      console.error('updateMetadata error:', error);
      this.message.error(error.message || '呼叫函式失敗');
      this.metadataResult.set({
        success: false,
        message: error.message || '未知錯誤'
      });
    } finally {
      this.metadataLoading.set(false);
    }
  }
}
