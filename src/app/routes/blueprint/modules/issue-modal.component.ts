/**
 * Issue Modal Component
 * 問題建立/編輯模態元件
 *
 * ✅ Modern Angular 20 patterns:
 * - Signals for reactive state
 * - Standalone component
 * - inject() for DI
 * - takeUntilDestroyed for cleanup
 */

import { Component, ChangeDetectionStrategy, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FirebaseAuthService, LoggerService } from '@core';
import type {
  Issue,
  CreateIssueData,
  UpdateIssueData,
  IssueSeverity,
  IssueCategory
} from '@core/blueprint/modules/implementations/issue/models';
import { IssueManagementService } from '@core/blueprint/modules/implementations/issue/services/issue-management.service';
import { SHARED_IMPORTS } from '@shared';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';

interface IssueModalData {
  blueprintId: string;
  issue?: Issue;
}

/**
 * Type guard to check if user object has uid property
 */
function isValidUser(user: unknown): user is { uid: string } {
  return typeof user === 'object' && user !== null && 'uid' in user && typeof (user as { uid: unknown }).uid === 'string';
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-issue-modal',
  standalone: true,
  imports: [SHARED_IMPORTS, NzFormModule],
  template: `
    <form nz-form [formGroup]="form" (ngSubmit)="submit()">
      <nz-form-item>
        <nz-form-label [nzSpan]="6" nzRequired>標題</nz-form-label>
        <nz-form-control [nzSpan]="16" nzErrorTip="請輸入問題標題（至少 5 個字元）">
          <input nz-input formControlName="title" placeholder="輸入問題標題" />
        </nz-form-control>
      </nz-form-item>

      <nz-form-item>
        <nz-form-label [nzSpan]="6" nzRequired>描述</nz-form-label>
        <nz-form-control [nzSpan]="16" nzErrorTip="請輸入問題描述">
          <textarea
            nz-input
            formControlName="description"
            [nzAutosize]="{ minRows: 3, maxRows: 6 }"
            placeholder="詳細描述問題內容"
          ></textarea>
        </nz-form-control>
      </nz-form-item>

      <nz-form-item>
        <nz-form-label [nzSpan]="6" nzRequired>位置</nz-form-label>
        <nz-form-control [nzSpan]="16" nzErrorTip="請輸入問題位置">
          <input nz-input formControlName="location" placeholder="例如：2F-客廳" />
        </nz-form-control>
      </nz-form-item>

      <nz-form-item>
        <nz-form-label [nzSpan]="6" nzRequired>嚴重度</nz-form-label>
        <nz-form-control [nzSpan]="16" nzErrorTip="請選擇嚴重度">
          <nz-select formControlName="severity" nzPlaceHolder="選擇嚴重程度">
            @for (option of severityOptions; track option.value) {
              <nz-option [nzValue]="option.value" [nzLabel]="option.label"></nz-option>
            }
          </nz-select>
        </nz-form-control>
      </nz-form-item>

      <nz-form-item>
        <nz-form-label [nzSpan]="6" nzRequired>分類</nz-form-label>
        <nz-form-control [nzSpan]="16" nzErrorTip="請選擇分類">
          <nz-select formControlName="category" nzPlaceHolder="選擇問題分類">
            @for (option of categoryOptions; track option.value) {
              <nz-option [nzValue]="option.value" [nzLabel]="option.label"></nz-option>
            }
          </nz-select>
        </nz-form-control>
      </nz-form-item>

      <nz-form-item>
        <nz-form-label [nzSpan]="6" nzRequired>負責方</nz-form-label>
        <nz-form-control [nzSpan]="16" nzErrorTip="請輸入負責方">
          <input nz-input formControlName="responsibleParty" placeholder="負責處理的廠商或人員" />
        </nz-form-control>
      </nz-form-item>

      <nz-form-item>
        <nz-form-label [nzSpan]="6">指派給</nz-form-label>
        <nz-form-control [nzSpan]="16">
          <input nz-input formControlName="assignedTo" placeholder="指派處理人員（選填）" />
        </nz-form-control>
      </nz-form-item>

      <nz-form-item>
        <nz-form-control [nzOffset]="6" [nzSpan]="16">
          <button nz-button nzType="primary" type="submit" [nzLoading]="submitting()" [disabled]="!form.valid">
            {{ isEdit ? '更新' : '建立' }}
          </button>
          <button nz-button type="button" class="ml-sm" (click)="cancel()" [disabled]="submitting()"> 取消 </button>
        </nz-form-control>
      </nz-form-item>
    </form>
  `
})
export class IssueModalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly modal = inject(NzModalRef);
  private readonly message = inject(NzMessageService);
  private readonly logger = inject(LoggerService);
  private readonly managementService = inject(IssueManagementService);
  private readonly authService = inject(FirebaseAuthService);
  private readonly data: IssueModalData = inject(NZ_MODAL_DATA, { optional: true }) || { blueprintId: '' };
  private readonly destroyRef = inject(DestroyRef);

  // State
  submitting = signal(false);
  isEdit = false;

  // Form definition
  form: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(200)]],
    description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(2000)]],
    location: ['', [Validators.required, Validators.maxLength(200)]],
    severity: ['major' as IssueSeverity, [Validators.required]],
    category: ['quality' as IssueCategory, [Validators.required]],
    responsibleParty: ['', [Validators.required, Validators.maxLength(100)]],
    assignedTo: ['', [Validators.maxLength(100)]]
  });

  // Options
  severityOptions: Array<{ value: IssueSeverity; label: string }> = [
    { value: 'critical', label: '嚴重 - 需立即處理' },
    { value: 'major', label: '重要 - 需儘快處理' },
    { value: 'minor', label: '輕微 - 可稍後處理' }
  ];

  categoryOptions: Array<{ value: IssueCategory; label: string }> = [
    { value: 'quality', label: '品質問題' },
    { value: 'safety', label: '安全問題' },
    { value: 'warranty', label: '保固問題' },
    { value: 'other', label: '其他' }
  ];

  ngOnInit(): void {
    // If editing, populate form with existing issue data
    if (this.data.issue) {
      this.isEdit = true;
      this.populateForm(this.data.issue);
    }
  }

  /**
   * Populate form with existing issue data
   */
  private populateForm(issue: Issue): void {
    this.form.patchValue({
      title: issue.title,
      description: issue.description,
      location: issue.location,
      severity: issue.severity,
      category: issue.category,
      responsibleParty: issue.responsibleParty,
      assignedTo: issue.assignedTo || ''
    });
  }

  /**
   * Submit form - create or update issue
   */
  async submit(): Promise<void> {
    if (!this.form.valid) {
      // Mark all fields as touched to show validation errors
      Object.values(this.form.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      return;
    }

    const user = this.authService.currentUser;
    if (!isValidUser(user)) {
      this.message.error('請先登入');
      return;
    }

    this.submitting.set(true);

    try {
      const formValue = this.form.value;

      if (this.isEdit && this.data.issue) {
        // Update existing issue
        const updateData: UpdateIssueData = {
          title: formValue.title,
          description: formValue.description,
          location: formValue.location,
          severity: formValue.severity,
          category: formValue.category,
          responsibleParty: formValue.responsibleParty,
          assignedTo: formValue.assignedTo || undefined
        };

        const updatedIssue = await this.managementService.updateIssue(this.data.issue.id, updateData);
        this.message.success('問題已更新');
        this.modal.close(updatedIssue);
      } else {
        // Create new issue
        if (!this.data.blueprintId) {
          this.message.error('缺少藍圖資訊');
          return;
        }

        const createData: CreateIssueData = {
          blueprintId: this.data.blueprintId,
          title: formValue.title,
          description: formValue.description,
          location: formValue.location,
          severity: formValue.severity,
          category: formValue.category,
          responsibleParty: formValue.responsibleParty,
          assignedTo: formValue.assignedTo || undefined,
          createdBy: user.uid
        };

        const newIssue = await this.managementService.createIssue(createData);
        this.message.success('問題已建立');
        this.modal.close(newIssue);
      }
    } catch (error) {
      this.message.error(this.isEdit ? '更新問題失敗' : '建立問題失敗');
      this.logger.error('[IssueModalComponent]', 'Failed to save issue', error as Error);
    } finally {
      this.submitting.set(false);
    }
  }

  /**
   * Cancel and close modal
   */
  cancel(): void {
    this.modal.close();
  }
}
