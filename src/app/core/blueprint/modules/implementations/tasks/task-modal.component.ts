/**
 * Task Modal Component
 * 任務模態框元件
 *
 * Features:
 * - Create/Edit/View tasks
 * - Form validation
 * - Reactive Forms integration
 *
 * ✅ Uses ng-zorro-antd modal and form
 * ✅ Uses Angular 20 Signals and modern syntax
 * ✅ Follows ConstructionLogModalComponent pattern
 *
 * @author GigHub Development Team
 * @date 2025-12-12
 */

import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BlueprintMemberRepository } from '@core/blueprint/repositories/blueprint-member.repository';
import { FirebaseService } from '@core/services/firebase.service';
import { TaskStore } from '@core/state/stores/task.store';
import { BlueprintMember, BlueprintRole } from '@core/types/blueprint/blueprint.types';
import { Task, TaskStatus, TaskPriority, CreateTaskRequest, UpdateTaskRequest, AssigneeType } from '@core/types/task';
import { Team, Partner } from '@core';
import { TeamRepository } from '@core/data-access/repositories/shared/team.repository';
import { PartnerRepository } from '@core/data-access/repositories/shared/partner.repository';
import { SHARED_IMPORTS } from '@shared';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NzSliderModule } from 'ng-zorro-antd/slider';
import { firstValueFrom } from 'rxjs';
interface ModalData {
  blueprintId: string;
  task?: Task;
  parentTask?: Task;
  mode: 'create' | 'edit' | 'view';
}

@Component({
  selector: 'app-task-modal',
  standalone: true,
  imports: [SHARED_IMPORTS, NzSliderModule],
  template: `
    <form nz-form [formGroup]="form" (ngSubmit)="submit()">
      <!-- Parent Task Info (for sub-tasks) -->
      @if (modalData.parentTask) {
        <nz-alert nzType="info" nzShowIcon [nzMessage]="'父任務: ' + modalData.parentTask.title" style="margin-bottom: 16px;" />
      }

      <!-- Title -->
      <nz-form-item>
        <nz-form-label [nzSpan]="6" nzRequired>標題</nz-form-label>
        <nz-form-control [nzSpan]="14" nzErrorTip="請輸入任務標題">
          <input nz-input formControlName="title" placeholder="例如：混凝土澆築" />
        </nz-form-control>
      </nz-form-item>

      <!-- Description -->
      <nz-form-item>
        <nz-form-label [nzSpan]="6">描述</nz-form-label>
        <nz-form-control [nzSpan]="14">
          <textarea nz-input formControlName="description" [nzAutosize]="{ minRows: 3, maxRows: 6 }" placeholder="任務詳細描述"></textarea>
        </nz-form-control>
      </nz-form-item>

      <!-- Status -->
      <nz-form-item>
        <nz-form-label [nzSpan]="6">狀態</nz-form-label>
        <nz-form-control [nzSpan]="14">
          <nz-select formControlName="status" nzPlaceHolder="選擇狀態" style="width: 100%;">
            <nz-option [nzValue]="TaskStatus.PENDING" nzLabel="待處理"></nz-option>
            <nz-option [nzValue]="TaskStatus.IN_PROGRESS" nzLabel="進行中"></nz-option>
            <nz-option [nzValue]="TaskStatus.ON_HOLD" nzLabel="暫停"></nz-option>
            <nz-option [nzValue]="TaskStatus.COMPLETED" nzLabel="已完成"></nz-option>
            <nz-option [nzValue]="TaskStatus.CANCELLED" nzLabel="已取消"></nz-option>
          </nz-select>
        </nz-form-control>
      </nz-form-item>

      <!-- Priority -->
      <nz-form-item>
        <nz-form-label [nzSpan]="6">優先級</nz-form-label>
        <nz-form-control [nzSpan]="14">
          <nz-select formControlName="priority" nzPlaceHolder="選擇優先級" style="width: 100%;">
            <nz-option [nzValue]="TaskPriority.LOW" nzLabel="低"></nz-option>
            <nz-option [nzValue]="TaskPriority.MEDIUM" nzLabel="中"></nz-option>
            <nz-option [nzValue]="TaskPriority.HIGH" nzLabel="高"></nz-option>
            <nz-option [nzValue]="TaskPriority.CRITICAL" nzLabel="緊急"></nz-option>
          </nz-select>
        </nz-form-control>
      </nz-form-item>

      <!-- Assignment Type Selector -->
      <nz-form-item>
        <nz-form-label [nzSpan]="6">指派類型</nz-form-label>
        <nz-form-control [nzSpan]="14">
          <nz-radio-group formControlName="assigneeType">
            <label nz-radio [nzValue]="AssigneeType.USER">用戶</label>
            <label nz-radio [nzValue]="AssigneeType.TEAM">團隊</label>
            <label nz-radio [nzValue]="AssigneeType.PARTNER">夥伴</label>
          </nz-radio-group>
        </nz-form-control>
      </nz-form-item>

      <!-- Assignee Selector - User -->
      @if (form.get('assigneeType')?.value === AssigneeType.USER) {
        <nz-form-item>
          <nz-form-label [nzSpan]="6">負責人</nz-form-label>
          <nz-form-control [nzSpan]="14">
            <nz-select
              formControlName="assigneeId"
              nzPlaceHolder="選擇負責人"
              nzShowSearch
              nzAllowClear
              style="width: 100%;"
              [nzLoading]="loadingMembers()"
            >
              @for (member of blueprintMembers(); track member.id) {
                <nz-option [nzValue]="member.accountId" [nzLabel]="member.accountId"></nz-option>
              }
            </nz-select>
          </nz-form-control>
        </nz-form-item>
      }

      <!-- Assignee Selector - Team -->
      @if (form.get('assigneeType')?.value === AssigneeType.TEAM) {
        <nz-form-item>
          <nz-form-label [nzSpan]="6">指派團隊</nz-form-label>
          <nz-form-control [nzSpan]="14">
            <nz-select
              formControlName="assigneeTeamId"
              nzPlaceHolder="選擇團隊"
              nzShowSearch
              nzAllowClear
              style="width: 100%;"
              [nzLoading]="loadingTeams()"
            >
              @for (team of teams(); track team.id) {
                <nz-option [nzValue]="team.id" [nzLabel]="team.name"></nz-option>
              }
            </nz-select>
          </nz-form-control>
        </nz-form-item>
      }

      <!-- Assignee Selector - Partner -->
      @if (form.get('assigneeType')?.value === AssigneeType.PARTNER) {
        <nz-form-item>
          <nz-form-label [nzSpan]="6">指派夥伴</nz-form-label>
          <nz-form-control [nzSpan]="14">
            <nz-select
              formControlName="assigneePartnerId"
              nzPlaceHolder="選擇夥伴"
              nzShowSearch
              nzAllowClear
              style="width: 100%;"
              [nzLoading]="loadingPartners()"
            >
              @for (partner of partners(); track partner.id) {
                <nz-option [nzValue]="partner.id" [nzLabel]="partner.name + ' (' + partner.type + ')'"></nz-option>
              }
            </nz-select>
          </nz-form-control>
        </nz-form-item>
      }

      <!-- Start Date -->
      <nz-form-item>
        <nz-form-label [nzSpan]="6">開始日期</nz-form-label>
        <nz-form-control [nzSpan]="14">
          <nz-date-picker formControlName="startDate" nzFormat="yyyy-MM-dd" style="width: 100%;" />
        </nz-form-control>
      </nz-form-item>

      <!-- Due Date -->
      <nz-form-item>
        <nz-form-label [nzSpan]="6">到期日</nz-form-label>
        <nz-form-control [nzSpan]="14">
          <nz-date-picker formControlName="dueDate" nzFormat="yyyy-MM-dd" style="width: 100%;" />
        </nz-form-control>
      </nz-form-item>

      <!-- Estimated Hours (with auto-calculation) -->
      <nz-form-item>
        <nz-form-label [nzSpan]="6">預估工時</nz-form-label>
        <nz-form-control [nzSpan]="14">
          <nz-input-number formControlName="estimatedHours" [nzMin]="0" [nzMax]="1000" [nzStep]="0.5" style="width: 100%;" />
          <span style="margin-left: 8px;">小時</span>
          @if (autoCalculatedHours() > 0) {
            <div style="color: #999; font-size: 12px; margin-top: 4px;"> 建議值: {{ autoCalculatedHours() }} 小時 (基於日期差異) </div>
          }
        </nz-form-control>
      </nz-form-item>

      <!-- Estimated Budget -->
      <nz-form-item>
        <nz-form-label [nzSpan]="6">預估金額</nz-form-label>
        <nz-form-control [nzSpan]="14" [nzErrorTip]="budgetErrorTip">
          <nz-input-number
            formControlName="estimatedBudget"
            [nzMin]="0"
            [nzMax]="99999999"
            [nzStep]="1000"
            [nzFormatter]="formatCurrency"
            [nzParser]="parseCurrency"
            style="width: 100%;"
          />
          @if (modalData.parentTask?.estimatedBudget) {
            <div style="color: #999; font-size: 12px; margin-top: 4px;">
              父任務預算: {{ modalData.parentTask?.estimatedBudget | number: '1.0-0' }}
              @if (remainingBudget() !== null) {
                <span style="margin-left: 8px;">
                  剩餘可分配:
                  <span [style.color]="remainingBudget()! >= 0 ? '#52c41a' : '#ff4d4f'">
                    {{ remainingBudget() | number: '1.0-0' }}
                  </span>
                </span>
              }
            </div>
          }
        </nz-form-control>
      </nz-form-item>

      <ng-template #budgetErrorTip>
        @if (form.get('estimatedBudget')?.hasError('budgetExceeded')) {
          <span>預算超過父任務限制</span>
        }
      </ng-template>

      <!-- Progress -->
      @if (modalData.mode !== 'create') {
        <nz-form-item>
          <nz-form-label [nzSpan]="6">進度</nz-form-label>
          <nz-form-control [nzSpan]="14">
            <nz-slider formControlName="progress" [nzMin]="0" [nzMax]="100" [nzStep]="5" [nzMarks]="progressMarks" />
          </nz-form-control>
        </nz-form-item>
      }

      <!-- Tags -->
      <nz-form-item>
        <nz-form-label [nzSpan]="6">標籤</nz-form-label>
        <nz-form-control [nzSpan]="14">
          <nz-select formControlName="tags" nzMode="tags" nzPlaceHolder="輸入標籤後按Enter" style="width: 100%;"> </nz-select>
        </nz-form-control>
      </nz-form-item>

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
      :host {
        display: block;
      }
    `
  ]
})
export class TaskModalComponent implements OnInit {
  private fb = inject(FormBuilder);
  private modalRef = inject(NzModalRef);
  private message = inject(NzMessageService);
  private taskStore = inject(TaskStore);
  private memberRepo = inject(BlueprintMemberRepository);
  private teamRepo = inject(TeamRepository);
  private partnerRepo = inject(PartnerRepository);
  private firebaseService = inject(FirebaseService);

  // Modal data injected
  modalData: ModalData = inject(NZ_MODAL_DATA);

  // Make enums available to template
  readonly TaskStatus = TaskStatus;
  readonly TaskPriority = TaskPriority;
  readonly AssigneeType = AssigneeType;

  // Form
  form!: FormGroup;

  // State
  submitting = signal(false);
  blueprintMembers = signal<BlueprintMember[]>([]);
  teams = signal<Team[]>([]);
  partners = signal<Partner[]>([]);
  loadingMembers = signal(false);
  loadingTeams = signal(false);
  loadingPartners = signal(false);
  autoCalculatedHours = signal(0);
  remainingBudget = signal<number | null>(null);

  // Progress marks
  readonly progressMarks = {
    0: '0%',
    25: '25%',
    50: '50%',
    75: '75%',
    100: '100%'
  };

  // Currency formatter for input-number
  formatCurrency = (value: number): string => {
    return `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  parseCurrency = (value: string): number => {
    return Number(value.replace(/\$\s?|(,*)/g, ''));
  };

  ngOnInit(): void {
    this.initForm();
    this.loadBlueprintMembers();
    this.loadTeamsAndPartners();
    this.calculateRemainingBudget();
  }

  private async loadBlueprintMembers(): Promise<void> {
    this.loadingMembers.set(true);
    try {
      const members = await firstValueFrom(this.memberRepo.findByBlueprint(this.modalData.blueprintId));
      this.blueprintMembers.set(members);
    } catch (error) {
      console.error('Failed to load blueprint members:', error);
      this.message.warning('載入成員清單失敗');
    } finally {
      this.loadingMembers.set(false);
    }
  }

  private async loadTeamsAndPartners(): Promise<void> {
    try {
      // For now, we'll need to get organization ID from a different source
      // This is a limitation that will need to be addressed with proper organization context
      // For the MVP, we'll load teams/partners when available
      
      // TODO: Implement proper organization context service
      // For now, skip loading teams and partners if we can't determine organization
      console.warn('Organization context not available - teams/partners not loaded');
      
      // Placeholder: In future, get from OrganizationContextService or similar
      // const organizationId = this.organizationContext.getCurrentOrganizationId();
      // if (!organizationId) return;
      
      // Load teams
      // this.loadingTeams.set(true);
      // const teams = await firstValueFrom(this.teamRepo.findByOrganization(organizationId));
      // this.teams.set(teams);
      // this.loadingTeams.set(false);

      // Load partners
      // this.loadingPartners.set(true);
      // const partners = await firstValueFrom(this.partnerRepo.findByOrganization(organizationId));
      // this.partners.set(partners);
      // this.loadingPartners.set(false);
    } catch (error) {
      console.error('Failed to load teams/partners:', error);
      this.message.warning('載入團隊和夥伴清單失敗');
      this.loadingTeams.set(false);
      this.loadingPartners.set(false);
    }
  }

  private initForm(): void {
    const task = this.modalData.task;
    const isView = this.modalData.mode === 'view';

    this.form = this.fb.group({
      title: [{ value: task?.title || '', disabled: isView }, [Validators.required, Validators.maxLength(100)]],
      description: [{ value: task?.description || '', disabled: isView }, [Validators.maxLength(1000)]],
      status: [{ value: task?.status || TaskStatus.PENDING, disabled: isView || this.modalData.mode === 'create' }],
      priority: [{ value: task?.priority || TaskPriority.MEDIUM, disabled: isView }],
      assigneeType: [{ value: task?.assigneeType || AssigneeType.USER, disabled: isView }],
      assigneeId: [{ value: task?.assigneeId || null, disabled: isView }],
      assigneeTeamId: [{ value: task?.assigneeTeamId || null, disabled: isView }],
      assigneePartnerId: [{ value: task?.assigneePartnerId || null, disabled: isView }],
      startDate: [{ value: task?.startDate ? new Date(task.startDate as any) : null, disabled: isView }],
      dueDate: [{ value: task?.dueDate ? new Date(task.dueDate as any) : null, disabled: isView }],
      estimatedHours: [{ value: task?.estimatedHours || null, disabled: isView }],
      estimatedBudget: [{ value: task?.estimatedBudget || null, disabled: isView }, [Validators.min(0)]],
      progress: [{ value: task?.progress ?? 0, disabled: isView }, [Validators.min(0), Validators.max(100)]],
      tags: [{ value: task?.tags || [], disabled: isView }]
    });

    // Subscribe to date changes for auto-calculation
    this.form.get('startDate')?.valueChanges.subscribe(() => {
      this.calculateEstimatedHours();
    });
    this.form.get('dueDate')?.valueChanges.subscribe(() => {
      this.calculateEstimatedHours();
    });

    // Subscribe to budget changes for validation
    this.form.get('estimatedBudget')?.valueChanges.subscribe(() => {
      this.calculateRemainingBudget();
      this.validateBudget();
    });
  }

  private calculateRemainingBudget(): void {
    const parentBudget = this.modalData.parentTask?.estimatedBudget;
    if (!parentBudget) {
      this.remainingBudget.set(null);
      return;
    }

    // Get sibling tasks' budgets (tasks with same parent, excluding current task if editing)
    const tasks = this.taskStore.tasks();
    const currentTaskId = this.modalData.task?.id;
    const siblingBudgets = tasks
      .filter(t => t.parentId === this.modalData.parentTask?.id && t.id !== currentTaskId && t.estimatedBudget)
      .map(t => t.estimatedBudget || 0);

    const currentBudget = this.form?.get('estimatedBudget')?.value || 0;
    const totalSiblingBudget = siblingBudgets.reduce((sum, budget) => sum + budget, 0);
    const remaining = parentBudget - totalSiblingBudget - currentBudget;

    this.remainingBudget.set(remaining);
  }

  private validateBudget(): void {
    const budgetControl = this.form.get('estimatedBudget');
    if (!budgetControl || !this.modalData.parentTask?.estimatedBudget) {
      return;
    }

    const remaining = this.remainingBudget();
    if (remaining !== null && remaining < 0) {
      budgetControl.setErrors({ budgetExceeded: true });
    } else if (budgetControl.hasError('budgetExceeded')) {
      // Clear the error if budget is now valid
      const errors = { ...budgetControl.errors };
      delete errors['budgetExceeded'];
      budgetControl.setErrors(Object.keys(errors).length > 0 ? errors : null);
    }
  }

  private calculateEstimatedHours(): void {
    const startDate = this.form.get('startDate')?.value;
    const dueDate = this.form.get('dueDate')?.value;

    if (startDate && dueDate) {
      const start = new Date(startDate);
      const end = new Date(dueDate);

      if (end >= start) {
        const diffTime = end.getTime() - start.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both days

        // Calculate hours: assume 8 hours per working day
        const calculatedHours = diffDays * 8;
        this.autoCalculatedHours.set(calculatedHours);

        // Auto-fill if estimatedHours is empty or zero
        const currentValue = this.form.get('estimatedHours')?.value;
        if (!currentValue || currentValue === 0) {
          this.form.get('estimatedHours')?.setValue(calculatedHours, { emitEvent: false });
        }
      } else {
        this.autoCalculatedHours.set(0);
      }
    } else {
      this.autoCalculatedHours.set(0);
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

      if (this.modalData.mode === 'create') {
        await this.createTask(formValue);
      } else if (this.modalData.mode === 'edit') {
        await this.updateTask(formValue);
      }
    } catch (error) {
      console.error('Submit failed:', error);
      this.message.error('操作失敗');
    } finally {
      this.submitting.set(false);
    }
  }

  private async createTask(formValue: any): Promise<void> {
    const assigneeType = formValue.assigneeType || AssigneeType.USER;

    // Get assignee details based on type
    let assigneeName: string | undefined;
    let assigneeId: string | undefined;
    let assigneeTeamName: string | undefined;
    let assigneeTeamId: string | undefined;
    let assigneePartnerName: string | undefined;
    let assigneePartnerId: string | undefined;

    if (assigneeType === AssigneeType.USER && formValue.assigneeId) {
      assigneeId = formValue.assigneeId;
      const assignee = this.blueprintMembers().find(m => m.accountId === assigneeId);
      assigneeName = assignee?.accountId; // TODO: Get actual name from user profile
    } else if (assigneeType === AssigneeType.TEAM && formValue.assigneeTeamId) {
      assigneeTeamId = formValue.assigneeTeamId;
      const team = this.teams().find(t => t.id === assigneeTeamId);
      assigneeTeamName = team?.name;
    } else if (assigneeType === AssigneeType.PARTNER && formValue.assigneePartnerId) {
      assigneePartnerId = formValue.assigneePartnerId;
      const partner = this.partners().find(p => p.id === assigneePartnerId);
      assigneePartnerName = partner?.name;
    }

    // Get current user ID from Firebase Auth
    const currentUserId = this.firebaseService.getCurrentUserId();
    if (!currentUserId) {
      throw new Error('無法取得使用者資訊，請重新登入');
    }

    const createData: CreateTaskRequest = {
      title: formValue.title,
      description: formValue.description,
      priority: formValue.priority || TaskPriority.MEDIUM,
      assigneeType: assigneeType,
      assigneeName: assigneeName,
      assigneeId: assigneeId,
      assigneeTeamName: assigneeTeamName,
      assigneeTeamId: assigneeTeamId,
      assigneePartnerName: assigneePartnerName,
      assigneePartnerId: assigneePartnerId,
      startDate: formValue.startDate || undefined,
      dueDate: formValue.dueDate || undefined,
      estimatedHours: formValue.estimatedHours || undefined,
      estimatedBudget: formValue.estimatedBudget || undefined,
      tags: formValue.tags || [],
      creatorId: currentUserId,
      // Set parentId if creating a sub-task
      parentId: this.modalData.parentTask?.id || undefined
    };

    // Auto-add creator as blueprint member if not already a member
    await this.ensureCreatorIsMember(currentUserId);

    const newTask = await this.taskStore.createTask(this.modalData.blueprintId, createData);

    if (!newTask) {
      throw new Error('Failed to create task');
    }

    const successMessage = this.modalData.parentTask ? '子任務新增成功' : '任務新增成功';
    this.message.success(successMessage);
    this.modalRef.close({ success: true, task: newTask });
  }

  /**
   * Ensure the creator is added as a blueprint member
   * 確保建立者已加入藍圖成員
   */
  private async ensureCreatorIsMember(creatorId: string): Promise<void> {
    try {
      const existingMembers = this.blueprintMembers();
      const isAlreadyMember = existingMembers.some(m => m.accountId === creatorId);

      if (!isAlreadyMember) {
        // Add creator as CONTRIBUTOR
        await this.memberRepo.addMember(this.modalData.blueprintId, {
          blueprintId: this.modalData.blueprintId,
          accountId: creatorId,
          role: BlueprintRole.CONTRIBUTOR,
          isExternal: false,
          grantedBy: creatorId
        });

        // Reload members list
        await this.loadBlueprintMembers();
      }
    } catch (error) {
      console.error('Failed to add creator as member:', error);
      // Don't throw - this is not critical for task creation
    }
  }

  private async updateTask(formValue: any): Promise<void> {
    const taskId = this.modalData.task?.id;
    if (!taskId) {
      throw new Error('Task ID not found');
    }

    const assigneeType = formValue.assigneeType || AssigneeType.USER;

    // Get assignee details based on type
    let assigneeName: string | undefined;
    let assigneeId: string | undefined;
    let assigneeTeamName: string | undefined;
    let assigneeTeamId: string | undefined;
    let assigneePartnerName: string | undefined;
    let assigneePartnerId: string | undefined;

    if (assigneeType === AssigneeType.USER && formValue.assigneeId) {
      assigneeId = formValue.assigneeId;
      const assignee = this.blueprintMembers().find(m => m.accountId === assigneeId);
      assigneeName = assignee?.accountId; // TODO: Get actual name from user profile
    } else if (assigneeType === AssigneeType.TEAM && formValue.assigneeTeamId) {
      assigneeTeamId = formValue.assigneeTeamId;
      const team = this.teams().find(t => t.id === assigneeTeamId);
      assigneeTeamName = team?.name;
    } else if (assigneeType === AssigneeType.PARTNER && formValue.assigneePartnerId) {
      assigneePartnerId = formValue.assigneePartnerId;
      const partner = this.partners().find(p => p.id === assigneePartnerId);
      assigneePartnerName = partner?.name;
    }

    // Get current user ID from Firebase Auth
    const currentUserId = this.firebaseService.getCurrentUserId();
    if (!currentUserId) {
      throw new Error('無法取得使用者資訊，請重新登入');
    }

    const updateData: UpdateTaskRequest = {
      title: formValue.title,
      description: formValue.description,
      status: formValue.status,
      priority: formValue.priority,
      assigneeType: assigneeType,
      assigneeName: assigneeName,
      assigneeId: assigneeId,
      assigneeTeamName: assigneeTeamName,
      assigneeTeamId: assigneeTeamId,
      assigneePartnerName: assigneePartnerName,
      assigneePartnerId: assigneePartnerId,
      startDate: formValue.startDate || undefined,
      dueDate: formValue.dueDate || undefined,
      estimatedHours: formValue.estimatedHours || undefined,
      estimatedBudget: formValue.estimatedBudget || undefined,
      tags: formValue.tags || []
    };

    await this.taskStore.updateTask(this.modalData.blueprintId, taskId, updateData, currentUserId);

    this.message.success('任務更新成功');
    this.modalRef.close({ success: true });
  }

  cancel(): void {
    this.modalRef.close({ success: false });
  }
}
