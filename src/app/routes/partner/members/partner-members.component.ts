import { ChangeDetectionStrategy, Component, computed, inject, OnInit, effect, DestroyRef, untracked } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ContextType, PartnerMember, PartnerRole, OrganizationMember, PartnerStore } from '@core';
import { OrganizationMemberRepository } from '@core/repositories';
import { SHARED_IMPORTS, WorkspaceContextService } from '@shared';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpaceModule } from 'ng-zorro-antd/space';

@Component({
  selector: 'app-partner-members',
  standalone: true,
  imports: [SHARED_IMPORTS, NzAlertModule, NzEmptyModule, NzSelectModule, NzSpaceModule, FormsModule],
  template: `
    <page-header [title]="'夥伴成員'" [content]="headerContent" [breadcrumb]="breadcrumb"></page-header>

    <ng-template #headerContent>
      <div>檢視並管理目前夥伴的成員。</div>
    </ng-template>

    <ng-template #breadcrumb>
      <nz-breadcrumb>
        <nz-breadcrumb-item>
          <a routerLink="/">
            <span nz-icon nzType="home"></span>
            首頁
          </a>
        </nz-breadcrumb-item>
        @if (currentPartnerId()) {
          <nz-breadcrumb-item>
            <span nz-icon nzType="team"></span>
            {{ organizationName() }}
          </nz-breadcrumb-item>
          <nz-breadcrumb-item>
            <span nz-icon nzType="solution"></span>
            {{ workspaceContext.contextLabel() }}
          </nz-breadcrumb-item>
        }
        <nz-breadcrumb-item>成員管理</nz-breadcrumb-item>
      </nz-breadcrumb>
    </ng-template>

    @if (!isPartnerContext()) {
      <nz-alert
        nzType="info"
        nzShowIcon
        nzMessage="請選擇夥伴"
        nzDescription="請從組織管理 → 夥伴管理頁面選擇要管理的夥伴，或從側邊欄選擇一個夥伴。"
        class="mb-md"
      />
    }

    <nz-card nzTitle="成員列表" [nzExtra]="extraTemplate" [nzLoading]="loading()">
      <ng-template #extraTemplate>
        @if (isPartnerContext()) {
          <nz-space>
            <button *nzSpaceItem nz-button nzType="primary" (click)="openAddMemberModal()">
              <span nz-icon nzType="user-add"></span>
              新增成員
            </button>
            <button *nzSpaceItem nz-button nzType="default" (click)="refreshMembers()">
              <span nz-icon nzType="reload"></span>
              重新整理
            </button>
          </nz-space>
        }
      </ng-template>

      @if (displayMembers().length > 0) {
        <nz-table #table [nzData]="displayMembers()">
          <thead>
            <tr>
              <th nzWidth="200px">成員 ID</th>
              <th nzWidth="140px">角色</th>
              <th nzWidth="200px">加入時間</th>
              <th nzWidth="200px">操作</th>
            </tr>
          </thead>
          <tbody>
            @for (member of table.data; track member.id) {
              <tr>
                <td>{{ member.user_id }}</td>
                <td>
                  <nz-tag [nzColor]="roleColor(member.role)">{{ roleLabel(member.role) }}</nz-tag>
                </td>
                <td>{{ member.joined_at || '-' }}</td>
                <td>
                  <nz-space>
                    <button *nzSpaceItem nz-button nzType="link" nzSize="small" (click)="changeRole(member)">
                      <span nz-icon nzType="swap"></span>
                      變更角色
                    </button>
                    <button
                      *nzSpaceItem
                      nz-button
                      nzType="link"
                      nzSize="small"
                      nzDanger
                      nz-popconfirm
                      nzPopconfirmTitle="確定移除此成員？"
                      (nzOnConfirm)="removeMember(member)"
                    >
                      <span nz-icon nzType="user-delete"></span>
                      移除
                    </button>
                  </nz-space>
                </td>
              </tr>
            }
          </tbody>
        </nz-table>
      } @else {
        <nz-empty nzNotFoundContent="暫無成員"></nz-empty>
      }
    </nz-card>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
/**
 * Partner Members Component
 * 夥伴成員管理元件
 *
 * Features:
 * - View partner members list
 * - Add new members from organization
 * - Change member roles
 * - Remove members
 *
 * Architecture Compliance:
 * ✅ Modern Angular 20+ with Signals
 * ✅ OnPush change detection strategy
 * ✅ Standalone component
 * ✅ inject() for dependency injection
 * ✅ Proper effect() usage in ngOnInit
 *
 * @since Angular 20.3.0
 */
export class PartnerMembersComponent implements OnInit {
  readonly workspaceContext = inject(WorkspaceContextService);
  readonly partnerStore = inject(PartnerStore);
  private readonly orgMemberRepository = inject(OrganizationMemberRepository);
  private readonly modal = inject(NzModalService);
  private readonly message = inject(NzMessageService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  private previousContext: { type: ContextType; id: string | null } | null = null;
  private didSwitchContext = false;
  private readonly queryParams = toSignal(this.route.queryParams, { initialValue: {} as Record<string, string> });
  private readonly queryParamPartnerId = computed(() => {
    const params = this.queryParams();
    return (params['partnerId'] as string) || null;
  });

  readonly PartnerRole = PartnerRole;

  ngOnInit(): void {
    this.previousContext = {
      type: this.workspaceContext.contextType(),
      id: this.workspaceContext.contextId()
    };

    this.destroyRef.onDestroy(() => {
      if (this.didSwitchContext && this.previousContext && this.previousContext.type !== ContextType.PARTNER) {
        console.log('[PartnerMembersComponent] Restoring previous context:', this.previousContext);
        this.workspaceContext.switchContext(this.previousContext.type, this.previousContext.id);
      }
    });

    effect(() => {
      const partnerId = this.queryParamPartnerId();
      if (partnerId) {
        const needsSwitch = untracked(
          () => this.workspaceContext.contextType() !== ContextType.PARTNER || this.workspaceContext.contextId() !== partnerId
        );

        if (needsSwitch) {
          this.didSwitchContext = true;
          this.workspaceContext.switchToPartner(partnerId);
        }
      }
    });

    effect(() => {
      const partnerId = this.effectivePartnerId();
      if (partnerId) {
        queueMicrotask(() => {
          this.partnerStore.loadMembers(partnerId);
        });
      }
    });
  }

  readonly organizationName = computed(() => {
    const partners = this.workspaceContext.partners();
    const currentPartner = partners.find(p => p.id === this.currentPartnerId());
    if (currentPartner) {
      const orgs = this.workspaceContext.organizations();
      const org = orgs.find(o => o.id === currentPartner.organization_id);
      return org?.name || '組織';
    }
    return '組織';
  });

  readonly currentPartnerId = computed(() =>
    this.workspaceContext.contextType() === ContextType.PARTNER ? this.workspaceContext.contextId() : null
  );

  private readonly effectivePartnerId = computed(() => {
    return this.queryParamPartnerId() || this.currentPartnerId();
  });

  displayMembers = computed(() => {
    const partnerId = this.effectivePartnerId();
    if (!partnerId) {
      return [];
    }
    return this.partnerStore.currentPartnerMembers();
  });

  readonly loading = this.partnerStore.loading;
  readonly isPartnerContext = computed(() => !!this.effectivePartnerId());

  refreshMembers(): void {
    const partnerId = this.effectivePartnerId();
    if (partnerId) {
      this.message.info('正在重新整理...');
      this.partnerStore.loadMembers(partnerId);
    }
  }

  openAddMemberModal(): void {
    const partnerId = this.effectivePartnerId();
    if (!partnerId) {
      this.message.error('無法獲取夥伴 ID');
      return;
    }

    const currentPartner = this.workspaceContext.partners().find(p => p.id === partnerId);
    if (!currentPartner) {
      this.message.error('找不到夥伴資訊');
      return;
    }

    this.orgMemberRepository
      .findByOrganization(currentPartner.organization_id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (orgMembers: OrganizationMember[]) => {
          const currentMemberIds = this.partnerStore.currentPartnerMembers().map(m => m.user_id);
          const availableMembers = orgMembers.filter(om => !currentMemberIds.includes(om.user_id));

          if (availableMembers.length === 0) {
            this.message.warning('所有組織成員都已加入此夥伴');
            return;
          }

          this.showAddMemberModal(partnerId, availableMembers);
        },
        error: (error: Error) => {
          console.error('[PartnerMembersComponent] ❌ Failed to load org members:', error);
          this.message.error('載入組織成員失敗');
        }
      });
  }

  private showAddMemberModal(partnerId: string, availableMembers: OrganizationMember[]): void {
    import('./partner-member-modal.component').then(({ PartnerMemberModalComponent }) => {
      const modalRef = this.modal.create({
        nzTitle: '新增夥伴成員',
        nzContent: PartnerMemberModalComponent,
        nzData: { availableMembers },
        nzWidth: 600,
        nzFooter: null,
        nzMaskClosable: false
      });

      modalRef.afterClose.subscribe(async result => {
        if (result) {
          try {
            await this.partnerStore.addMember(partnerId, result.userId, result.role);
            this.message.success('成員已加入夥伴');
          } catch (error) {
            console.error('[PartnerMembersComponent] ❌ Failed to add member:', error);
            this.message.error('新增成員失敗');
          }
        }
      });
    });
  }

  changeRole(member: PartnerMember): void {
    const partnerId = this.effectivePartnerId();
    if (!partnerId) return;

    const currentRole = member.role;
    const availableRoles = Object.values(PartnerRole).filter(role => role !== currentRole);

    this.modal.create({
      nzTitle: '變更成員角色',
      nzContent: `
        <div>
          <p>當前角色：<strong>${this.roleLabel(currentRole)}</strong></p>
          <div class="mb-md">
            <label class="d-block mb-sm"><strong>選擇新角色</strong></label>
            <nz-radio-group id="roleSelector" style="display: flex; flex-direction: column; gap: 12px;">
              ${availableRoles
                .map(
                  role => `
                <label nz-radio nzValue="${role}" style="display: flex; align-items: center; padding: 8px; border: 1px solid; border-radius: 4px;">
                  <input type="radio" name="role" value="${role}" />
                  <span style="margin-left: 8px;">
                    <strong>${this.roleLabel(role)}</strong>
                    <span style="display: block; font-size: 12px;">
                      ${role === PartnerRole.ADMIN ? '可管理夥伴成員和設定' : '可檢視和執行夥伴任務'}
                    </span>
                  </span>
                </label>
              `
                )
                .join('')}
            </nz-radio-group>
          </div>
        </div>
      `,
      nzOnOk: async () => {
        const selectedInput = document.querySelector('input[name="role"]:checked') as HTMLInputElement;
        const newRole = selectedInput?.value as PartnerRole;

        if (!newRole) {
          this.message.error('請選擇角色');
          return false;
        }

        try {
          await this.partnerStore.updateMemberRole(member.id, partnerId, member.user_id, newRole);
          this.message.success('角色已變更');
          return true;
        } catch (error) {
          console.error('[PartnerMembersComponent] ❌ Failed to change role:', error);
          this.message.error('變更角色失敗');
          return false;
        }
      }
    });
  }

  async removeMember(member: PartnerMember): Promise<void> {
    try {
      const partnerId = this.effectivePartnerId();
      if (!partnerId) {
        this.message.error('無法獲取夥伴 ID');
        return;
      }

      await this.partnerStore.removeMember(member.id, partnerId);
      this.message.success('成員已移除');
    } catch (error) {
      console.error('[PartnerMembersComponent] ❌ Failed to remove member:', error);
      this.message.error('移除成員失敗');
    }
  }

  roleLabel(role: PartnerRole): string {
    switch (role) {
      case PartnerRole.ADMIN:
        return '管理員';
      case PartnerRole.MEMBER:
      default:
        return '成員';
    }
  }

  roleColor(role: PartnerRole): string {
    switch (role) {
      case PartnerRole.ADMIN:
        return 'purple';
      case PartnerRole.MEMBER:
      default:
        return 'default';
    }
  }
}
