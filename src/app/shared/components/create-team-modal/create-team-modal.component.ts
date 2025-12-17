/**
 * Create Team Modal Component - Modern Angular 20 Implementation
 *
 * 建立團隊模態元件 - 現代化 Angular 20 實作
 *
 * Modern Angular 20 Patterns:
 * - Standalone Component
 * - Signals for state management
 * - input() function for inputs
 * - output() function for outputs
 * - Reactive Forms with proper validation
 * - OnPush change detection
 *
 * @module shared/components
 */

import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Team, TeamStore } from '@core';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalRef, NZ_MODAL_DATA } from 'ng-zorro-antd/modal';

@Component({
  selector: 'app-create-team-modal',
  standalone: true,
  imports: [ReactiveFormsModule, NzFormModule, NzInputModule, NzButtonModule],
  template: `
    <div class="modal-content">
      <form nz-form [formGroup]="form" nzLayout="vertical">
        <nz-form-item>
          <nz-form-label [nzRequired]="true">團隊名稱</nz-form-label>
          <nz-form-control [nzErrorTip]="nameErrorTip">
            <input nz-input formControlName="name" placeholder="請輸入團隊名稱（2-50個字符）" [disabled]="loading()" />
          </nz-form-control>
        </nz-form-item>

        <nz-form-item>
          <nz-form-label>描述</nz-form-label>
          <nz-form-control>
            <textarea
              nz-input
              formControlName="description"
              placeholder="請輸入團隊描述（選填）"
              [disabled]="loading()"
              rows="4"
            ></textarea>
          </nz-form-control>
        </nz-form-item>
      </form>

      <div class="modal-footer">
        <button nz-button type="button" (click)="cancel()" [disabled]="loading()"> 取消 </button>
        <button nz-button type="button" nzType="primary" (click)="submit()" [nzLoading]="loading()" [disabled]="form.invalid">
          建立團隊
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .modal-content {
        padding: 8px 0;
      }
      .modal-footer {
        margin-top: 24px;
        padding-top: 16px;
        border-top: 1px solid #f0f0f0;
        text-align: right;
      }
      .modal-footer button + button {
        margin-left: 8px;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateTeamModalComponent {
  private readonly fb = inject(FormBuilder);
  private readonly teamStore = inject(TeamStore);
  private readonly modal = inject(NzModalRef);
  private readonly message = inject(NzMessageService);

  // Inject modal data using NZ_MODAL_DATA token
  private readonly modalData = inject<{ organizationId: string }>(NZ_MODAL_DATA);

  loading = signal(false);

  form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    description: ['', [Validators.maxLength(500)]]
  });

  get nameErrorTip(): string {
    const nameControl = this.form.get('name');
    if (nameControl?.hasError('required')) {
      return '請輸入團隊名稱';
    }
    if (nameControl?.hasError('minlength')) {
      return '團隊名稱至少需要 2 個字符';
    }
    if (nameControl?.hasError('maxlength')) {
      return '團隊名稱最多 50 個字符';
    }
    return '';
  }

  cancel(): void {
    this.modal.destroy();
  }

  async submit(): Promise<void> {
    if (this.form.invalid) {
      // Mark all fields as touched to show validation errors
      Object.values(this.form.controls).forEach(control => {
        control.markAsTouched();
        control.updateValueAndValidity();
      });
      return;
    }

    const orgId = this.modalData.organizationId;
    if (!orgId) {
      this.message.error('無法獲取組織 ID');
      return;
    }

    this.loading.set(true);
    try {
      const newTeam: Team = await this.teamStore.createTeam(
        orgId,
        this.form.value.name.trim(),
        this.form.value.description?.trim() || null
      );

      this.message.success('團隊建立成功！');
      this.modal.destroy(newTeam); // Return created team to parent
    } catch (error) {
      console.error('[CreateTeamModalComponent] ❌ Create team failed:', error);
      this.message.error('建立團隊失敗，請稍後再試');
      this.loading.set(false);
    }
  }
}
