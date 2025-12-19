/**
 * AI Document Processor Component
 *
 * Calls functions-ai-document Firebase Functions for document processing
 * - processDocumentFromStorage: Process document from Cloud Storage
 * - processDocumentFromContent: Process document from base64 content
 * - batchProcessDocuments: Batch process multiple documents
 *
 * @module ContractModule
 * @see functions-ai-document README for API documentation
 */

import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { SHARED_IMPORTS } from '@shared';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzUploadFile, NzUploadModule } from 'ng-zorro-antd/upload';

import {
  ProcessDocumentFromStorageRequest,
  ProcessDocumentFromContentRequest,
  BatchProcessDocumentsRequest,
  ProcessDocumentResponse,
  BatchProcessResponse,
  DocumentProcessingResult
} from './types/firebase-functions.types';

@Component({
  selector: 'app-ai-document-processor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS, NzUploadModule],
  template: `
    <nz-card nzTitle="AI 文件解析">
      <nz-tabset>
        <!-- Process from Storage -->
        <nz-tab nzTitle="從 Storage 解析">
          <div class="p-md">
            <nz-form-item>
              <nz-form-label [nzSpan]="4">GCS URI</nz-form-label>
              <nz-form-control [nzSpan]="20">
                <input nz-input [(ngModel)]="gcsUri" placeholder="gs://bucket-name/path/to/file.pdf" />
              </nz-form-control>
            </nz-form-item>

            <nz-form-item>
              <nz-form-label [nzSpan]="4">MIME Type</nz-form-label>
              <nz-form-control [nzSpan]="20">
                <nz-select [(ngModel)]="mimeType" nzPlaceHolder="選擇文件類型">
                  <nz-option nzValue="application/pdf" nzLabel="PDF" />
                  <nz-option nzValue="image/jpeg" nzLabel="JPEG" />
                  <nz-option nzValue="image/png" nzLabel="PNG" />
                  <nz-option nzValue="image/tiff" nzLabel="TIFF" />
                </nz-select>
              </nz-form-control>
            </nz-form-item>

            <nz-form-item>
              <nz-form-control [nzOffset]="4" [nzSpan]="20">
                <button nz-button nzType="primary" [nzLoading]="loading()" [disabled]="!gcsUri || !mimeType" (click)="processFromStorage()">
                  <span nz-icon nzType="cloud-download"></span>
                  解析文件
                </button>
              </nz-form-control>
            </nz-form-item>
          </div>
        </nz-tab>

        <!-- Process from Upload -->
        <nz-tab nzTitle="上傳文件解析">
          <div class="p-md">
            <nz-upload [nzBeforeUpload]="beforeUpload" [nzShowUploadList]="false" nzAccept=".pdf,.jpg,.jpeg,.png,.tiff">
              <button nz-button [nzLoading]="loading()">
                <span nz-icon nzType="upload"></span>
                選擇文件
              </button>
            </nz-upload>

            @if (selectedFile()) {
              <div class="mt-md">
                <nz-alert nzType="info" [nzMessage]="'已選擇: ' + selectedFile()!.name" nzShowIcon />
              </div>
            }

            <div class="mt-md">
              <button nz-button nzType="primary" [nzLoading]="loading()" [disabled]="!selectedFile()" (click)="processFromContent()">
                <span nz-icon nzType="robot"></span>
                開始解析
              </button>
            </div>
          </div>
        </nz-tab>

        <!-- Batch Process -->
        <nz-tab nzTitle="批次解析">
          <div class="p-md">
            <nz-form-item>
              <nz-form-label [nzSpan]="4">文件列表</nz-form-label>
              <nz-form-control [nzSpan]="20">
                <nz-textarea-count [nzMaxCharacterCount]="1000">
                  <textarea
                    rows="8"
                    nz-input
                    [(ngModel)]="batchInputText"
                    placeholder="每行一個文件 (格式: gs://bucket/path,mime-type)&#10;範例:&#10;gs://my-bucket/doc1.pdf,application/pdf&#10;gs://my-bucket/doc2.jpg,image/jpeg"
                  ></textarea>
                </nz-textarea-count>
              </nz-form-control>
            </nz-form-item>

            <nz-form-item>
              <nz-form-label [nzSpan]="4">輸出路徑</nz-form-label>
              <nz-form-control [nzSpan]="20">
                <input nz-input [(ngModel)]="batchOutputUri" placeholder="gs://bucket-name/output/" />
              </nz-form-control>
            </nz-form-item>

            <nz-form-item>
              <nz-form-control [nzOffset]="4" [nzSpan]="20">
                <button
                  nz-button
                  nzType="primary"
                  [nzLoading]="loading()"
                  [disabled]="!batchInputText || !batchOutputUri"
                  (click)="batchProcess()"
                >
                  <span nz-icon nzType="fire"></span>
                  批次解析
                </button>
              </nz-form-control>
            </nz-form-item>
          </div>
        </nz-tab>
      </nz-tabset>

      <!-- Results -->
      @if (result()) {
        <nz-divider />
        <h4>解析結果</h4>

        @if (result()!.success && result()!.result) {
          <nz-descriptions nzBordered [nzColumn]="2">
            <nz-descriptions-item nzTitle="處理器版本" [nzSpan]="2">
              {{ result()!.result!.metadata.processorVersion }}
            </nz-descriptions-item>
            <nz-descriptions-item nzTitle="處理時間"> {{ result()!.result!.metadata.processingTime }} ms </nz-descriptions-item>
            <nz-descriptions-item nzTitle="頁數">
              {{ result()!.result!.metadata.pageCount }}
            </nz-descriptions-item>
            <nz-descriptions-item nzTitle="文件類型" [nzSpan]="2">
              {{ result()!.result!.metadata.mimeType }}
            </nz-descriptions-item>
          </nz-descriptions>

          <nz-divider nzText="提取的文字" />
          <pre class="extracted-text">{{ result()!.result!.text }}</pre>

          @if (result()!.result!.entities && result()!.result!.entities!.length > 0) {
            <nz-divider nzText="識別的實體" />
            <nz-table [nzData]="result()!.result!.entities!" [nzPageSize]="10" nzSize="small">
              <thead>
                <tr>
                  <th>類型</th>
                  <th>文字</th>
                  <th>信心度</th>
                  <th>標準化值</th>
                </tr>
              </thead>
              <tbody>
                @for (entity of result()!.result!.entities!; track $index) {
                  <tr>
                    <td>{{ entity.type }}</td>
                    <td>{{ entity.mentionText }}</td>
                    <td>
                      @if (entity.confidence !== undefined) {
                        {{ (entity.confidence * 100).toFixed(1) }}%
                      } @else {
                        N/A
                      }
                    </td>
                    <td>{{ entity.normalizedValue || '-' }}</td>
                  </tr>
                }
              </tbody>
            </nz-table>
          }

          @if (result()!.result!.formFields && result()!.result!.formFields!.length > 0) {
            <nz-divider nzText="表單欄位" />
            <nz-table [nzData]="result()!.result!.formFields!" [nzPageSize]="10" nzSize="small">
              <thead>
                <tr>
                  <th>欄位名稱</th>
                  <th>欄位值</th>
                  <th>信心度</th>
                </tr>
              </thead>
              <tbody>
                @for (field of result()!.result!.formFields!; track $index) {
                  <tr>
                    <td>{{ field.fieldName }}</td>
                    <td>{{ field.fieldValue }}</td>
                    <td>
                      @if (field.confidence !== undefined) {
                        {{ (field.confidence * 100).toFixed(1) }}%
                      } @else {
                        N/A
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </nz-table>
          }
        } @else if (result()!.error) {
          <nz-alert nzType="error" [nzMessage]="result()!.error!.message" [nzDescription]="result()!.error!.code" nzShowIcon />
        }
      }

      @if (batchResult()) {
        <nz-divider />
        <h4>批次處理結果</h4>

        @if (batchResult()!.success && batchResult()!.result) {
          <nz-descriptions nzBordered [nzColumn]="2">
            <nz-descriptions-item nzTitle="操作名稱" [nzSpan]="2">
              {{ batchResult()!.result!.operationName }}
            </nz-descriptions-item>
            <nz-descriptions-item nzTitle="狀態">
              <nz-tag [nzColor]="batchResult()!.result!.status === 'pending' ? 'processing' : 'success'">
                {{ batchResult()!.result!.status }}
              </nz-tag>
            </nz-descriptions-item>
            <nz-descriptions-item nzTitle="文件數量">
              {{ batchResult()!.result!.totalDocuments }}
            </nz-descriptions-item>
            <nz-descriptions-item nzTitle="輸出路徑" [nzSpan]="2">
              {{ batchResult()!.result!.outputGcsUri }}
            </nz-descriptions-item>
          </nz-descriptions>
        } @else if (batchResult()!.error) {
          <nz-alert nzType="error" [nzMessage]="batchResult()!.error!.message" [nzDescription]="batchResult()!.error!.code" nzShowIcon />
        }
      }
    </nz-card>
  `,
  styles: [
    `
      .extracted-text {
        background: #f5f5f5;
        padding: 16px;
        border-radius: 4px;
        max-height: 400px;
        overflow-y: auto;
        white-space: pre-wrap;
        word-wrap: break-word;
      }
    `
  ]
})
export class AiDocumentProcessorComponent {
  private functions = inject(Functions);
  private message = inject(NzMessageService);

  // State
  loading = signal(false);
  result = signal<ProcessDocumentResponse | null>(null);
  batchResult = signal<BatchProcessResponse | null>(null);

  // Form data
  gcsUri = '';
  mimeType = 'application/pdf';
  selectedFile = signal<File | null>(null);
  batchInputText = '';
  batchOutputUri = '';

  /**
   * Process document from Cloud Storage
   */
  async processFromStorage(): Promise<void> {
    if (!this.gcsUri || !this.mimeType) {
      this.message.warning('請輸入 GCS URI 和 MIME 類型');
      return;
    }

    this.loading.set(true);
    this.result.set(null);

    try {
      const callable = httpsCallable<ProcessDocumentFromStorageRequest, ProcessDocumentResponse>(
        this.functions,
        'processDocumentFromStorage'
      );

      const response = await callable({
        gcsUri: this.gcsUri,
        mimeType: this.mimeType,
        skipHumanReview: true
      });

      this.result.set(response.data);

      if (response.data.success) {
        this.message.success('文件解析成功!');
      } else {
        this.message.error(response.data.error?.message || '文件解析失敗');
      }
    } catch (error: any) {
      console.error('processFromStorage error:', error);
      this.message.error(error.message || '呼叫函式失敗');
      this.result.set({
        success: false,
        error: {
          code: error.code || 'unknown',
          message: error.message || '未知錯誤'
        }
      });
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Before upload handler
   */
  beforeUpload = (file: NzUploadFile): boolean => {
    this.selectedFile.set(file as unknown as File);
    return false; // Prevent auto upload
  };

  /**
   * Process document from uploaded content
   */
  async processFromContent(): Promise<void> {
    const file = this.selectedFile();
    if (!file) {
      this.message.warning('請先選擇文件');
      return;
    }

    this.loading.set(true);
    this.result.set(null);

    try {
      // Convert file to base64
      const base64Content = await this.fileToBase64(file);

      const callable = httpsCallable<ProcessDocumentFromContentRequest, ProcessDocumentResponse>(
        this.functions,
        'processDocumentFromContent'
      );

      const response = await callable({
        content: base64Content,
        mimeType: file.type || 'application/pdf',
        skipHumanReview: true
      });

      this.result.set(response.data);

      if (response.data.success) {
        this.message.success('文件解析成功!');
      } else {
        this.message.error(response.data.error?.message || '文件解析失敗');
      }
    } catch (error: any) {
      console.error('processFromContent error:', error);
      this.message.error(error.message || '呼叫函式失敗');
      this.result.set({
        success: false,
        error: {
          code: error.code || 'unknown',
          message: error.message || '未知錯誤'
        }
      });
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Batch process documents
   */
  async batchProcess(): Promise<void> {
    if (!this.batchInputText || !this.batchOutputUri) {
      this.message.warning('請輸入文件列表和輸出路徑');
      return;
    }

    this.loading.set(true);
    this.batchResult.set(null);

    try {
      // Parse input text
      const lines = this.batchInputText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

      const inputDocuments = lines.map(line => {
        const [gcsUri, mimeType] = line.split(',').map(s => s.trim());
        return { gcsUri, mimeType };
      });

      if (inputDocuments.length === 0) {
        this.message.warning('請輸入至少一個文件');
        this.loading.set(false);
        return;
      }

      const callable = httpsCallable<BatchProcessDocumentsRequest, BatchProcessResponse>(this.functions, 'batchProcessDocuments');

      const response = await callable({
        inputDocuments,
        outputGcsUri: this.batchOutputUri,
        skipHumanReview: true
      });

      this.batchResult.set(response.data);

      if (response.data.success) {
        this.message.success(`批次處理已啟動! 共 ${inputDocuments.length} 個文件`);
      } else {
        this.message.error(response.data.error?.message || '批次處理失敗');
      }
    } catch (error: any) {
      console.error('batchProcess error:', error);
      this.message.error(error.message || '呼叫函式失敗');
      this.batchResult.set({
        success: false,
        error: {
          code: error.code || 'unknown',
          message: error.message || '未知錯誤'
        }
      });
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Convert file to base64
   */
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix (e.g., "data:application/pdf;base64,")
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
    });
  }
}
