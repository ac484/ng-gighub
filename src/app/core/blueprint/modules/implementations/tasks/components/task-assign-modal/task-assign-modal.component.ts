/**
 * Task Assign Modal Component
 * 任務指派模態框元件
 *
 * Dedicated modal for assigning tasks to users, teams, or partners.
 * Validates against blueprint membership to ensure only valid assignees can be selected.
 *
 * Following ⭐.md: Standalone component with Signal-based state
 *
 * @author GigHub Development Team
 * @date 2025-12-17
 */

import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Team, Partner } from '@core';
import { BlueprintMemberRepository } from '@core/blueprint/repositories/blueprint-member.repository';
import { TaskStore } from '@core/state/stores/task.store';
import { BlueprintMember } from '@core/types/blueprint/blueprint.types';
import { Task, AssigneeType } from '@core/types/task';
import { SHARED_IMPORTS } from '@shared';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { firstValueFrom } from 'rxjs';

interface ModalData {
  blueprintId: string;
  task: Task;
}

@Component({
  selector: 'app-task-assign-modal',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <form nz-form [formGroup]="form" (ngSubmit)="submit()">
      <!-- Current Assignment Info -->
      @if (task()) {
        <nz-alert
          nzType="info"
          nzShowIcon
          [nzMessage]="'當前任務: ' + task()!.title"
          [nzDescription]="getCurrentAssignmentDescription()"
          style="margin-bottom: 16px;"
        />
      }

      <!-- Assignment Type Selector -->
      <nz-form-item>
        <nz-form-label [nzSpan]="6" nzRequired>指派類型</nz-form-label>
        <nz-form-control [nzSpan]="14">
          <nz-radio-group formControlName="assigneeType">
            <label nz-radio [nzValue]="AssigneeType.USER">
              <span nz-icon nzType="user" nzTheme="outline"></span>
              用戶
            </label>
            <label nz-radio [nzValue]="AssigneeType.TEAM">
              <span nz-icon nzType="team" nzTheme="outline"></span>
              團隊
            </label>
            <label nz-radio [nzValue]="AssigneeType.PARTNER">
              <span nz-icon nzType="solution" nzTheme="outline"></span>
              夥伴
            </label>
          </nz-radio-group>
        </nz-form-control>
      </nz-form-item>

      <!-- User Assignee Selector -->
      @if (form.get('assigneeType')?.value === AssigneeType.USER) {
        <nz-form-item>
          <nz-form-label [nzSpan]="6" nzRequired>指派用戶</nz-form-label>
          <nz-form-control [nzSpan]="14" nzErrorTip="請選擇用戶">
            <nz-select
              formControlName="assigneeId"
              nzPlaceHolder="選擇用戶"
              nzShowSearch
              nzAllowClear
              style="width: 100%;"
              [nzLoading]="loadingMembers()"
            >
              @for (member of members(); track member.accountId) {
                <nz-option [nzValue]="member.accountId" [nzLabel]="member.accountId">
                  <span nz-icon nzType="user" nzTheme="outline"></span>
                  {{ member.accountId }}
                  <nz-tag [nzColor]="getRoleColor(member.role)" style="margin-left: 8px;">
                    {{ getRoleLabel(member.role) }}
                  </nz-tag>
                </nz-option>
              }
            </nz-select>
          </nz-form-control>
        </nz-form-item>
      }

      <!-- Team Assignee Selector -->
      @if (form.get('assigneeType')?.value === AssigneeType.TEAM) {
        <nz-form-item>
          <nz-form-label [nzSpan]="6" nzRequired>指派團隊</nz-form-label>
          <nz-form-control [nzSpan]="14" nzErrorTip="請選擇團隊">
            <nz-select
              formControlName="assigneeTeamId"
              nzPlaceHolder="選擇團隊"
              nzShowSearch
              nzAllowClear
              style="width: 100%;"
              [nzLoading]="loadingTeams()"
            >
              @for (team of teams(); track team.id) {
                <nz-option [nzValue]="team.id" [nzLabel]="team.name">
                  <span nz-icon nzType="team" nzTheme="outline"></span>
                  {{ team.name }}
                  @if (team.description) {
                    <span style="color: #8c8c8c; margin-left: 8px;">{{ team.description }}</span>
                  }
                </nz-option>
              }
            </nz-select>
          </nz-form-control>
        </nz-form-item>
      }

      <!-- Partner Assignee Selector -->
      @if (form.get('assigneeType')?.value === AssigneeType.PARTNER) {
        <nz-form-item>
          <nz-form-label [nzSpan]="6" nzRequired>指派夥伴</nz-form-label>
          <nz-form-control [nzSpan]="14" nzErrorTip="請選擇夥伴">
            <nz-select
              formControlName="assigneePartnerId"
              nzPlaceHolder="選擇夥伴"
              nzShowSearch
              nzAllowClear
              style="width: 100%;"
              [nzLoading]="loadingPartners()"
            >
              @for (partner of partners(); track partner.id) {
                <nz-option [nzValue]="partner.id" [nzLabel]="partner.name">
                  <span nz-icon nzType="solution" nzTheme="outline"></span>
                  {{ partner.name }}
                  @if (partner.company_name) {
                    <span style="color: #8c8c8c; margin-left: 8px;">({{ partner.company_name }})</span>
                  }
                </nz-option>
              }
            </nz-select>
          </nz-form-control>
        </nz-form-item>
      }

      <!-- Assignment Note (Optional) -->
      <nz-form-item>
        <nz-form-label [nzSpan]="6">指派備註</nz-form-label>
        <nz-form-control [nzSpan]="14">
          <textarea
            nz-input
            formControlName="note"
            [nzAutosize]="{ minRows: 2, maxRows: 4 }"
            placeholder="可選：指派原因或特別說明"
          ></textarea>
        </nz-form-control>
      </nz-form-item>

      <!-- Form Actions -->
      <div class="modal-footer">
        <button nz-button nzType="default" (click)="cancel()" type="button"> 取消 </button>
        <button nz-button nzType="primary" [nzLoading]="submitting()" [disabled]="!form.valid" type="submit"> 確認指派 </button>
      </div>
    </form>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        margin-top: 24px;
        padding-top: 16px;
        border-top: 1px solid #f0f0f0;
      }

      :host ::ng-deep .ant-form-item {
        margin-bottom: 16px;
      }

      :host ::ng-deep nz-option {
        display: flex;
        align-items: center;
      }
    `
  ]
})
export class TaskAssignModalComponent implements OnInit {
  private fb = inject(FormBuilder);
  private modal = inject(NzModalRef);
  private message = inject(NzMessageService);
  private taskStore = inject(TaskStore);
  private memberRepository = inject(BlueprintMemberRepository);
  readonly modalData = inject<ModalData>(NZ_MODAL_DATA);

  // Expose enum to template
  readonly AssigneeType = AssigneeType;

  // State
  task = signal<Task | null>(null);
  members = signal<BlueprintMember[]>([]);
  teams = signal<Team[]>([]);
  partners = signal<Partner[]>([]);
  loadingMembers = signal(false);
  loadingTeams = signal(false);
  loadingPartners = signal(false);
  submitting = signal(false);

  // Form
  form: FormGroup;

  constructor() {
    // Initialize form
    this.form = this.fb.group({
      assigneeType: [AssigneeType.USER, [Validators.required]],
      assigneeId: [null],
      assigneeTeamId: [null],
      assigneePartnerId: [null],
      note: ['']
    });

    // Watch assigneeType changes to update validators
    this.form.get('assigneeType')?.valueChanges.subscribe(type => {
      this.updateValidators(type);
    });
  }

  async ngOnInit(): Promise<void> {
    this.task.set(this.modalData.task);

    // Set current assignment in form
    const task = this.modalData.task;
    if (task.assigneeType) {
      this.form.patchValue({
        assigneeType: task.assigneeType,
        assigneeId: task.assigneeId,
        assigneeTeamId: task.assigneeTeamId,
        assigneePartnerId: task.assigneePartnerId
      });
    }

    // Load blueprint members
    await this.loadMembers();

    // TODO: Load teams and partners based on organization context
    // For now, show empty lists with TODO message
  }

  /**
   * Load blueprint members
   * 載入藍圖成員
   */
  private async loadMembers(): Promise<void> {
    this.loadingMembers.set(true);
    try {
      const membersObservable = this.memberRepository.findByBlueprint(this.modalData.blueprintId);
      const members = await firstValueFrom(membersObservable);
      this.members.set(members);
    } catch (error) {
      console.error('Failed to load blueprint members:', error);
      this.message.error('載入成員列表失敗');
    } finally {
      this.loadingMembers.set(false);
    }
  }

  /**
   * Update form validators based on assignee type
   * 根據指派類型更新表單驗證器
   */
  private updateValidators(type: AssigneeType): void {
    // Clear all assignee validators
    this.form.get('assigneeId')?.clearValidators();
    this.form.get('assigneeTeamId')?.clearValidators();
    this.form.get('assigneePartnerId')?.clearValidators();

    // Clear values for non-selected types
    if (type !== AssigneeType.USER) {
      this.form.patchValue({ assigneeId: null });
    }
    if (type !== AssigneeType.TEAM) {
      this.form.patchValue({ assigneeTeamId: null });
    }
    if (type !== AssigneeType.PARTNER) {
      this.form.patchValue({ assigneePartnerId: null });
    }

    // Set validator for selected type
    switch (type) {
      case AssigneeType.USER:
        this.form.get('assigneeId')?.setValidators([Validators.required]);
        break;
      case AssigneeType.TEAM:
        this.form.get('assigneeTeamId')?.setValidators([Validators.required]);
        // TODO: Load teams from organization context
        this.message.warning('團隊載入功能尚未實作');
        break;
      case AssigneeType.PARTNER:
        this.form.get('assigneePartnerId')?.setValidators([Validators.required]);
        // TODO: Load partners from organization context
        this.message.warning('夥伴載入功能尚未實作');
        break;
    }

    // Update validity
    this.form.get('assigneeId')?.updateValueAndValidity();
    this.form.get('assigneeTeamId')?.updateValueAndValidity();
    this.form.get('assigneePartnerId')?.updateValueAndValidity();
  }

  /**
   * Get current assignment description
   * 取得當前指派描述
   */
  getCurrentAssignmentDescription(): string {
    const task = this.task();
    if (!task) return '無當前指派';

    if (!task.assigneeType || !task.assigneeId) {
      return '目前未指派';
    }

    switch (task.assigneeType) {
      case AssigneeType.USER:
        return `目前指派給用戶: ${task.assigneeName || task.assigneeId}`;
      case AssigneeType.TEAM:
        return `目前指派給團隊: ${task.assigneeTeamName || task.assigneeTeamId}`;
      case AssigneeType.PARTNER:
        return `目前指派給夥伴: ${task.assigneePartnerName || task.assigneePartnerId}`;
      default:
        return '未知指派類型';
    }
  }

  /**
   * Get role color for badge
   * 取得角色徽章顏色
   */
  getRoleColor(role: string): string {
    const colors: Record<string, string> = {
      owner: 'red',
      admin: 'orange',
      editor: 'blue',
      viewer: 'default'
    };
    return colors[role] || 'default';
  }

  /**
   * Get role label
   * 取得角色標籤
   */
  getRoleLabel(role: string): string {
    const labels: Record<string, string> = {
      owner: '擁有者',
      admin: '管理員',
      editor: '編輯者',
      viewer: '檢視者'
    };
    return labels[role] || role;
  }

  /**
   * Submit assignment
   * 提交指派
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
      const task = this.task()!;

      // Prepare update data based on assignee type
      const updateData: any = {
        assigneeType: formValue.assigneeType
      };

      switch (formValue.assigneeType) {
        case AssigneeType.USER:
          updateData.assigneeId = formValue.assigneeId;
          // Find member accountId
          const member = this.members().find(m => m.accountId === formValue.assigneeId);
          updateData.assigneeName = member?.accountId || formValue.assigneeId;
          // Clear team/partner fields
          updateData.assigneeTeamId = null;
          updateData.assigneeTeamName = null;
          updateData.assigneePartnerId = null;
          updateData.assigneePartnerName = null;
          break;

        case AssigneeType.TEAM:
          updateData.assigneeTeamId = formValue.assigneeTeamId;
          const team = this.teams().find(t => t.id === formValue.assigneeTeamId);
          updateData.assigneeTeamName = team?.name || formValue.assigneeTeamId;
          // Clear user/partner fields
          updateData.assigneeId = null;
          updateData.assigneeName = null;
          updateData.assigneePartnerId = null;
          updateData.assigneePartnerName = null;
          break;

        case AssigneeType.PARTNER:
          updateData.assigneePartnerId = formValue.assigneePartnerId;
          const partner = this.partners().find(p => p.id === formValue.assigneePartnerId);
          updateData.assigneePartnerName = partner?.name || formValue.assigneePartnerId;
          // Clear user/team fields
          updateData.assigneeId = null;
          updateData.assigneeName = null;
          updateData.assigneeTeamId = null;
          updateData.assigneeTeamName = null;
          break;
      }

      // Update task
      await this.taskStore.updateTask(
        this.modalData.blueprintId,
        task.id!,
        updateData,
        'current-user' // TODO: Get actual current user ID from auth service
      );

      this.message.success('任務指派成功');
      this.modal.close(true);
    } catch (error) {
      console.error('Failed to assign task:', error);
      this.message.error('任務指派失敗');
    } finally {
      this.submitting.set(false);
    }
  }

  /**
   * Cancel and close modal
   * 取消並關閉模態框
   */
  cancel(): void {
    this.modal.close(false);
  }
}
