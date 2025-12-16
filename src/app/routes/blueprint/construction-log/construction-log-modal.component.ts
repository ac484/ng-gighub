/**
 * Construction Log Modal Component
 * 工地施工日誌模態框元件
 *
 * Features:
 * - Create/Edit/View construction logs
 * - Photo upload with preview
 * - Form validation
 *
 * ✅ Uses ng-zorro-antd modal and form
 * ✅ Uses Angular 20 Signals
 *
 * @author GigHub Development Team
 * @date 2025-12-11
 */

import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FirebaseService } from '@core/services/firebase.service';
import { ConstructionLogStore } from '@core/stores';
import { Log, CreateLogRequest, UpdateLogRequest } from '@core/types/log/log.types';
import { SHARED_IMPORTS } from '@shared';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NzUploadFile } from 'ng-zorro-antd/upload';

interface ModalData {
  blueprintId: string;
  log?: Log;
  mode: 'create' | 'edit' | 'view';
}

@Component({
  selector: 'app-construction-log-modal',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <form nz-form [formGroup]="form" (ngSubmit)="submit()">
      <!-- Date -->
      <nz-form-item>
        <nz-form-label [nzSpan]="6" nzRequired>日期</nz-form-label>
        <nz-form-control [nzSpan]="14" nzErrorTip="請選擇日期">
          <nz-date-picker formControlName="date" nzFormat="yyyy-MM-dd" style="width: 100%;" />
        </nz-form-control>
      </nz-form-item>

      <!-- Title -->
      <nz-form-item>
        <nz-form-label [nzSpan]="6" nzRequired>標題</nz-form-label>
        <nz-form-control [nzSpan]="14" nzErrorTip="請輸入標題">
          <input nz-input formControlName="title" placeholder="例如：地基開挖" />
        </nz-form-control>
      </nz-form-item>

      <!-- Description -->
      <nz-form-item>
        <nz-form-label [nzSpan]="6">描述</nz-form-label>
        <nz-form-control [nzSpan]="14">
          <textarea nz-input formControlName="description" [nzAutosize]="{ minRows: 3, maxRows: 6 }" placeholder="工作內容描述"></textarea>
        </nz-form-control>
      </nz-form-item>

      <!-- Work Hours -->
      <nz-form-item>
        <nz-form-label [nzSpan]="6">工時</nz-form-label>
        <nz-form-control [nzSpan]="14">
          <nz-input-number formControlName="workHours" [nzMin]="0" [nzMax]="24" [nzStep]="0.5" style="width: 100%;" />
          <span style="margin-left: 8px;">小時</span>
        </nz-form-control>
      </nz-form-item>

      <!-- Workers -->
      <nz-form-item>
        <nz-form-label [nzSpan]="6">工人數</nz-form-label>
        <nz-form-control [nzSpan]="14">
          <nz-input-number formControlName="workers" [nzMin]="0" [nzMax]="1000" style="width: 100%;" />
          <span style="margin-left: 8px;">人</span>
        </nz-form-control>
      </nz-form-item>

      <!-- Equipment -->
      <nz-form-item>
        <nz-form-label [nzSpan]="6">設備</nz-form-label>
        <nz-form-control [nzSpan]="14">
          <input nz-input formControlName="equipment" placeholder="例如：挖土機、卡車" />
        </nz-form-control>
      </nz-form-item>

      <!-- Weather -->
      <nz-form-item>
        <nz-form-label [nzSpan]="6">天氣</nz-form-label>
        <nz-form-control [nzSpan]="14">
          <nz-select formControlName="weather" nzPlaceHolder="選擇天氣" nzAllowClear style="width: 100%;">
            <nz-option nzValue="晴" nzLabel="晴"></nz-option>
            <nz-option nzValue="多雲" nzLabel="多雲"></nz-option>
            <nz-option nzValue="陰" nzLabel="陰"></nz-option>
            <nz-option nzValue="雨" nzLabel="雨"></nz-option>
            <nz-option nzValue="大雨" nzLabel="大雨"></nz-option>
            <nz-option nzValue="雷雨" nzLabel="雷雨"></nz-option>
          </nz-select>
        </nz-form-control>
      </nz-form-item>

      <!-- Temperature -->
      <nz-form-item>
        <nz-form-label [nzSpan]="6">溫度</nz-form-label>
        <nz-form-control [nzSpan]="14">
          <nz-input-number formControlName="temperature" [nzMin]="-20" [nzMax]="50" style="width: 100%;" />
          <span style="margin-left: 8px;">°C</span>
        </nz-form-control>
      </nz-form-item>

      <!-- Photos -->
      @if (modalData.mode !== 'view') {
        <nz-form-item>
          <nz-form-label [nzSpan]="6">照片</nz-form-label>
          <nz-form-control [nzSpan]="14">
            <nz-upload
              nzType="drag"
              [nzMultiple]="true"
              [nzAccept]="'image/*'"
              [nzBeforeUpload]="beforeUpload"
              [nzFileList]="uploadFileList()"
              [nzShowUploadList]="{ showPreviewIcon: true, showRemoveIcon: true }"
              [nzRemove]="handleRemove"
            >
              <p class="ant-upload-drag-icon">
                <span nz-icon nzType="inbox"></span>
              </p>
              <p class="ant-upload-text">點擊或拖曳照片到此區域上傳</p>
              <p class="ant-upload-hint">支援單個或批量上傳，建議照片大小小於 5MB</p>
            </nz-upload>
          </nz-form-control>
        </nz-form-item>
      }

      <!-- Existing Photos (Edit/View mode) -->
      @if (modalData.log?.photos && (modalData.log?.photos?.length ?? 0) > 0) {
        <nz-form-item>
          <nz-form-label [nzSpan]="6">現有照片</nz-form-label>
          <nz-form-control [nzSpan]="14">
            <nz-row [nzGutter]="[8, 8]">
              @for (photo of modalData.log?.photos; track photo.id) {
                <nz-col [nzSpan]="8">
                  <div class="photo-item">
                    <img [src]="photo.publicUrl" [alt]="photo.caption || '照片'" style="width: 100%; height: 100px; object-fit: cover;" />
                    @if (modalData.mode === 'edit') {
                      <button
                        nz-button
                        nzType="link"
                        nzDanger
                        nzSize="small"
                        (click)="deletePhoto(photo.id)"
                        style="position: absolute; top: 0; right: 0;"
                      >
                        <span nz-icon nzType="delete"></span>
                      </button>
                    }
                  </div>
                </nz-col>
              }
            </nz-row>
          </nz-form-control>
        </nz-form-item>
      }

      <!-- Form Actions -->
      <nz-form-item>
        <nz-form-control [nzSpan]="14" [nzOffset]="6">
          <button nz-button nzType="default" (click)="cancel()" style="margin-right: 8px;"> 取消 </button>
          @if (modalData.mode !== 'view') {
            <button nz-button nzType="primary" type="submit" [nzLoading]="submitting()" [disabled]="!form.valid">
              {{ modalData.mode === 'create' ? '新增' : '更新' }}
            </button>
          }
        </nz-form-control>
      </nz-form-item>
    </form>
  `,
  styles: [
    `
      .photo-item {
        position: relative;
        border: 1px solid #d9d9d9;
        border-radius: 4px;
        overflow: hidden;
      }
    `
  ]
})
export class ConstructionLogModalComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private modalRef = inject(NzModalRef);
  private message = inject(NzMessageService);
  private logStore = inject(ConstructionLogStore);
  private firebaseService = inject(FirebaseService);

  // Modal data injected
  modalData: ModalData = inject(NZ_MODAL_DATA);

  // Form
  form!: FormGroup;

  // State
  submitting = signal(false);
  fileList = signal<File[]>([]);
  uploadFileList = signal<NzUploadFile[]>([]);

  ngOnInit(): void {
    this.initForm();
  }

  ngOnDestroy(): void {
    // Cleanup object URLs
    this.uploadFileList().forEach(file => {
      if (file.url) {
        URL.revokeObjectURL(file.url);
      }
    });
  }

  private initForm(): void {
    const log = this.modalData.log;
    const isView = this.modalData.mode === 'view';

    // Convert log.date to Date object if it exists
    // Repository layer will handle date validation, so we only need to convert to Date here
    const logDate = log?.date ? new Date(log.date) : null;

    this.form = this.fb.group({
      date: [{ value: logDate, disabled: isView }, [Validators.required]],
      title: [{ value: log?.title || '', disabled: isView }, [Validators.required, Validators.maxLength(100)]],
      description: [{ value: log?.description || '', disabled: isView }, [Validators.maxLength(1000)]],
      workHours: [{ value: log?.workHours || null, disabled: isView }],
      workers: [{ value: log?.workers || null, disabled: isView }],
      equipment: [{ value: log?.equipment || '', disabled: isView }],
      weather: [{ value: log?.weather || null, disabled: isView }],
      temperature: [{ value: log?.temperature || null, disabled: isView }]
    });
  }

  beforeUpload = (file: NzUploadFile): boolean => {
    // Validate file type and size
    if (!file.type?.startsWith('image/')) {
      this.message.error('只能上傳圖片檔案');
      return false;
    }

    if (file.size! / 1024 / 1024 >= 5) {
      this.message.error('圖片大小必須小於 5MB');
      return false;
    }

    // Add to file lists
    this.fileList.update(list => [...list, file as any]);

    // Add to upload file list for display
    const uploadFile: NzUploadFile = {
      uid: `${Date.now()}-${file.name}`,
      name: file.name,
      status: 'done',
      url: URL.createObjectURL(file as any),
      originFileObj: file as any
    };
    this.uploadFileList.update(list => [...list, uploadFile]);

    return false; // Prevent automatic upload
  };

  handleRemove = (file: NzUploadFile): boolean => {
    // Remove from file list
    this.fileList.update(list => list.filter(f => f.name !== file.name));

    // Remove from upload file list
    this.uploadFileList.update(list => list.filter(f => f.uid !== file.uid));

    // Revoke object URL to free memory
    if (file.url) {
      URL.revokeObjectURL(file.url);
    }

    return true;
  };

  async deletePhoto(photoId: string): Promise<void> {
    const logId = this.modalData.log?.id;
    if (!logId) return;

    try {
      await this.logStore.deletePhoto(this.modalData.blueprintId, logId, photoId);
      this.message.success('照片刪除成功');

      if (this.modalData.log) {
        this.modalData.log.photos = this.modalData.log.photos.filter(p => p.id !== photoId);
      }
    } catch (err) {
      console.error('Delete photo error:', err);
      this.message.error('照片刪除失敗');
    }
  }

  async submit(): Promise<void> {
    if (!this.form.valid) {
      Object.values(this.form.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      return;
    }

    this.submitting.set(true);

    try {
      const formValue = this.form.value;
      const isCreate = this.modalData.mode === 'create';

      // Create or update log - now throws error instead of returning null
      const log = isCreate ? await this.createLog(formValue) : await this.updateLog(formValue);

      // Upload photos if any
      if (this.fileList().length > 0) {
        await this.uploadPhotos(log.id);
      }

      this.modalRef.close({ success: true, log });
    } catch (error) {
      // More informative error messages using ternary operator
      const errorMessage = error instanceof Error ? error.message : '操作失敗';

      console.error('[ConstructionLogModal] Submit error:', error);
      this.message.error(errorMessage);
    } finally {
      this.submitting.set(false);
    }
  }

  private async createLog(formValue: any): Promise<Log> {
    // Validate date exists
    if (!formValue.date) {
      throw new Error('請選擇日期');
    }

    // Get current user ID
    const currentUserId = this.firebaseService.getCurrentUserId();
    if (!currentUserId) {
      throw new Error('無法取得使用者資訊，請重新登入');
    }

    const request: CreateLogRequest = {
      blueprintId: this.modalData.blueprintId,
      date: formValue.date, // Date validation will be done in repository layer
      title: formValue.title,
      description: formValue.description,
      workHours: formValue.workHours,
      workers: formValue.workers,
      equipment: formValue.equipment,
      weather: formValue.weather,
      temperature: formValue.temperature,
      creatorId: currentUserId
    };

    return this.logStore.createLog(request);
  }

  private async updateLog(formValue: any): Promise<Log> {
    const logId = this.modalData.log?.id;
    if (!logId) {
      throw new Error('無法取得日誌 ID');
    }

    // Validate date exists
    if (!formValue.date) {
      throw new Error('請選擇日期');
    }

    const request: UpdateLogRequest = {
      date: formValue.date, // Date validation will be done in repository layer
      title: formValue.title,
      description: formValue.description,
      workHours: formValue.workHours,
      workers: formValue.workers,
      equipment: formValue.equipment,
      weather: formValue.weather,
      temperature: formValue.temperature
    };

    return this.logStore.updateLog(this.modalData.blueprintId, logId, request);
  }

  private async uploadPhotos(logId: string): Promise<void> {
    const files = this.fileList();
    await Promise.all(files.map(file => this.logStore.uploadPhoto(this.modalData.blueprintId, logId, file)));
  }

  cancel(): void {
    this.modalRef.close({ success: false });
  }
}
