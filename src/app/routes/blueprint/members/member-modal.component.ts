import { Component, ChangeDetectionStrategy, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BlueprintMember, BlueprintRole, BusinessRole, LoggerService, FirebaseAuthService } from '@core';
import { BlueprintMemberRepository } from '@core/blueprint/repositories';
import { SHARED_IMPORTS } from '@shared';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';

/**
 * Member Modal Component
 * 成員模態元件 - 新增/編輯成員
 *
 * Following Occam's Razor: Simple form for member management
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-member-modal',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <form nz-form [formGroup]="form" (ngSubmit)="submit()">
      <nz-form-item>
        <nz-form-label [nzSpan]="6" nzRequired>帳號 ID</nz-form-label>
        <nz-form-control [nzSpan]="16" nzErrorTip="請輸入帳號 ID">
          <input nz-input formControlName="accountId" placeholder="輸入 Firebase Auth UID" [disabled]="isEdit" />
        </nz-form-control>
      </nz-form-item>

      <nz-form-item>
        <nz-form-label [nzSpan]="6" nzRequired>系統角色</nz-form-label>
        <nz-form-control [nzSpan]="16" nzErrorTip="請選擇系統角色">
          <nz-radio-group formControlName="role">
            <label nz-radio [nzValue]="BlueprintRole.VIEWER"> 檢視者（唯讀） </label>
            <label nz-radio [nzValue]="BlueprintRole.CONTRIBUTOR"> 貢獻者（編輯） </label>
            <label nz-radio [nzValue]="BlueprintRole.MAINTAINER"> 維護者（完整權限） </label>
          </nz-radio-group>
        </nz-form-control>
      </nz-form-item>

      <nz-form-item>
        <nz-form-label [nzSpan]="6">業務角色</nz-form-label>
        <nz-form-control [nzSpan]="16">
          <nz-select formControlName="businessRole" nzPlaceHolder="選擇業務角色（選填）" nzAllowClear>
            @for (role of businessRoles; track role) {
              <nz-option [nzLabel]="role.label" [nzValue]="role.value"></nz-option>
            }
          </nz-select>
        </nz-form-control>
      </nz-form-item>

      <nz-form-item>
        <nz-form-label [nzSpan]="6">外部成員</nz-form-label>
        <nz-form-control [nzSpan]="16">
          <label nz-checkbox formControlName="isExternal"> 標記為外部成員（承包商、顧問等） </label>
        </nz-form-control>
      </nz-form-item>

      <nz-form-item>
        <nz-form-control [nzOffset]="6" [nzSpan]="16">
          <button nz-button nzType="primary" type="submit" [nzLoading]="submitting()" [disabled]="!form.valid">
            {{ isEdit ? '更新' : '新增' }}
          </button>
          <button nz-button type="button" class="ml-sm" (click)="cancel()" [disabled]="submitting()"> 取消 </button>
        </nz-form-control>
      </nz-form-item>
    </form>
  `
})
export class MemberModalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly modal = inject(NzModalRef);
  private readonly message = inject(NzMessageService);
  private readonly logger = inject(LoggerService);
  private readonly authService = inject(FirebaseAuthService);
  private readonly memberRepository: BlueprintMemberRepository = inject(BlueprintMemberRepository);
  private readonly data: { blueprintId: string; member?: BlueprintMember } = inject(NZ_MODAL_DATA);

  // Expose enum for template
  BlueprintRole = BlueprintRole;

  submitting = signal(false);
  isEdit = false;

  form: FormGroup = this.fb.group({
    accountId: ['', [Validators.required]],
    role: [BlueprintRole.VIEWER, [Validators.required]],
    businessRole: [null],
    isExternal: [false]
  });

  // Business roles options
  businessRoles = [
    { label: '專案經理', value: BusinessRole.PROJECT_MANAGER },
    { label: '工地主任', value: BusinessRole.SITE_SUPERVISOR },
    { label: '工程師', value: BusinessRole.ENGINEER },
    { label: '品管人員', value: BusinessRole.QUALITY_INSPECTOR },
    { label: '建築師', value: BusinessRole.ARCHITECT },
    { label: '承包商', value: BusinessRole.CONTRACTOR },
    { label: '業主', value: BusinessRole.CLIENT }
  ];

  ngOnInit(): void {
    // If editing, populate form
    if (this.data.member) {
      this.isEdit = true;
      this.populateForm(this.data.member);
    }
  }

  /**
   * Populate form with member data
   * 填充表單資料
   */
  private populateForm(member: BlueprintMember): void {
    this.form.patchValue({
      accountId: member.accountId,
      role: member.role,
      businessRole: member.businessRole,
      isExternal: member.isExternal || false
    });
  }

  /**
   * Submit form
   * 提交表單
   */
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

      if (this.isEdit) {
        // Update existing member
        await this.memberRepository.updateMember(this.data.blueprintId, this.data.member!.id, {
          role: formValue.role,
          businessRole: formValue.businessRole,
          isExternal: formValue.isExternal
        });
        this.message.success('成員已更新');
      } else {
        // Add new member
        const currentUser = this.authService.currentUser;
        await this.memberRepository.addMember(this.data.blueprintId, {
          accountId: formValue.accountId,
          role: formValue.role,
          businessRole: formValue.businessRole,
          isExternal: formValue.isExternal,
          blueprintId: this.data.blueprintId,
          grantedBy: currentUser?.uid || 'system'
        });
        this.message.success('成員已新增');
      }

      this.modal.close(true);
    } catch (error) {
      this.message.error(this.isEdit ? '更新成員失敗' : '新增成員失敗');
      this.logger.error('[MemberModalComponent]', 'Failed to save member', error as Error);
    } finally {
      this.submitting.set(false);
    }
  }

  /**
   * Cancel and close modal
   * 取消並關閉模態視窗
   */
  cancel(): void {
    this.modal.close();
  }
}
