/**
 * Partner Store - Modern Angular 20 Signal-based State Management
 *
 * 夥伴 Store - 現代化 Angular 20 Signal 狀態管理
 *
 * Following Occam's Razor: Simple signal-based state management
 * Using Angular 20 Signals for reactive state
 *
 * Manages external partner and partner member state
 * Similar architecture to TeamStore but for external partners
 *
 * Key Benefits:
 * - Single source of truth for partner and member data
 * - Automatic state synchronization across components
 * - Simplified component logic
 * - Better performance with computed signals and batched queries
 *
 * @module core/stores
 * @author GigHub Development Team
 * @date 2025-12-17
 */

import { Injectable, signal, computed, inject } from '@angular/core';
import { LoggerService, Partner, PartnerMember, PartnerRole } from '@core';
import { PartnerRepository, PartnerMemberRepository } from '@core/repositories';
import { firstValueFrom } from 'rxjs';

/**
 * Partner with member count
 * 包含成員數量的夥伴
 */
export interface PartnerWithMembers extends Partner {
  memberCount?: number;
}

/**
 * Partner Store Injectable Service
 * 夥伴 Store 可注入服務
 */
@Injectable({
  providedIn: 'root'
})
export class PartnerStore {
  private readonly partnerRepository = inject(PartnerRepository);
  private readonly memberRepository = inject(PartnerMemberRepository);
  private readonly logger = inject(LoggerService);

  // ============================================================================
  // Private State - 私有狀態
  // ============================================================================

  private _partners = signal<Partner[]>([]);
  private _members = signal<PartnerMember[]>([]);
  private _memberCounts = signal<Map<string, number>>(new Map());
  private _loading = signal(false);
  private _error = signal<string | null>(null);
  private _currentOrganizationId = signal<string | null>(null);
  private _currentPartnerId = signal<string | null>(null);

  // ============================================================================
  // Public Readonly State - 公開只讀狀態
  // ============================================================================

  readonly partners = this._partners.asReadonly();
  readonly members = this._members.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly currentOrganizationId = this._currentOrganizationId.asReadonly();
  readonly currentPartnerId = this._currentPartnerId.asReadonly();

  // ============================================================================
  // Computed Signals - 計算信號
  // ============================================================================

  /**
   * Partners with member counts
   * 包含成員數量的夥伴列表
   */
  readonly partnersWithMembers = computed<PartnerWithMembers[]>(() => {
    const partners = this._partners();
    const counts = this._memberCounts();
    return partners.map(partner => ({
      ...partner,
      memberCount: counts.get(partner.id) || 0
    }));
  });

  /**
   * Current partner data
   * 當前夥伴資料
   */
  readonly currentPartner = computed(() => {
    const partnerId = this._currentPartnerId();
    if (!partnerId) return null;
    return this._partners().find(p => p.id === partnerId) || null;
  });

  /**
   * Members filtered by current partner
   * 依當前夥伴篩選的成員
   */
  readonly currentPartnerMembers = computed(() => {
    const partnerId = this._currentPartnerId();
    if (!partnerId) return [];
    return this._members().filter(m => m.partner_id === partnerId);
  });

  /**
   * Members grouped by role
   * 依角色分組的成員
   */
  readonly membersByRole = computed(() => {
    const members = this.currentPartnerMembers();
    return {
      admins: members.filter(m => m.role === PartnerRole.ADMIN),
      members: members.filter(m => m.role === PartnerRole.MEMBER)
    };
  });

  /**
   * Partner statistics
   * 夥伴統計
   */
  readonly partnerStats = computed(() => {
    const partners = this._partners();
    const members = this._members();
    return {
      totalPartners: partners.length,
      totalMembers: members.length,
      averageMembersPerPartner: partners.length > 0 ? Math.round(members.length / partners.length) : 0
    };
  });

  /**
   * Partners grouped by type
   * 依類型分組的夥伴
   */
  readonly partnersByType = computed(() => {
    const partners = this._partners();
    const grouped = new Map<string, Partner[]>();

    partners.forEach(partner => {
      const type = partner.type;
      if (!grouped.has(type)) {
        grouped.set(type, []);
      }
      grouped.get(type)!.push(partner);
    });

    return grouped;
  });

  // ============================================================================
  // Organization Operations - 組織操作
  // ============================================================================

  /**
   * Load partners for an organization
   * 載入組織的夥伴
   *
   * @param organizationId Organization ID
   */
  async loadPartners(organizationId: string): Promise<void> {
    this._currentOrganizationId.set(organizationId);
    this._loading.set(true);
    this._error.set(null);

    try {
      const partners = await firstValueFrom(this.partnerRepository.findByOrganization(organizationId));
      this._partners.set(partners);
      this.logger.info('[PartnerStore]', `Loaded ${partners.length} partners for organization: ${organizationId}`);

      // Load member counts for all partners in batch
      await this.loadMemberCounts(partners);
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      this._error.set(error);
      this.logger.error('[PartnerStore]', 'Failed to load partners', err instanceof Error ? err : undefined);
      throw err;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Load member counts for partners (batch operation)
   * 載入夥伴成員數量（批次操作）
   *
   * @param partners Partners to load counts for
   */
  private async loadMemberCounts(partners: Partner[]): Promise<void> {
    if (partners.length === 0) {
      this._memberCounts.set(new Map());
      return;
    }

    try {
      // Load all member lists in parallel
      const memberListPromises = partners.map(partner =>
        firstValueFrom(this.memberRepository.findByPartner(partner.id)).then(members => ({
          partnerId: partner.id,
          count: members.length
        }))
      );

      const counts = await Promise.all(memberListPromises);
      const countMap = new Map<string, number>();
      counts.forEach(({ partnerId, count }) => countMap.set(partnerId, count));

      this._memberCounts.set(countMap);
      this.logger.info('[PartnerStore]', `Loaded member counts for ${partners.length} partners`);
    } catch (err) {
      this.logger.error('[PartnerStore]', 'Failed to load member counts', err as Error);
      // Don't throw - member counts are non-critical
      this._memberCounts.set(new Map());
    }
  }

  /**
   * Create a new partner
   * 建立新夥伴
   *
   * @param partner Partner data without id and created_at
   * @returns Created partner
   */
  async createPartner(partner: Omit<Partner, 'id' | 'created_at'>): Promise<Partner> {
    try {
      const newPartner = await this.partnerRepository.create(partner);

      // Update local state
      this._partners.update(partners => [newPartner, ...partners]);
      this._memberCounts.update(counts => {
        const newCounts = new Map(counts);
        newCounts.set(newPartner.id, 0);
        return newCounts;
      });

      this.logger.info('[PartnerStore]', `Partner created: ${newPartner.id}`);
      return newPartner;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      this._error.set(error);
      this.logger.error('[PartnerStore]', 'Failed to create partner', err as Error);
      throw err;
    }
  }

  /**
   * Update a partner
   * 更新夥伴
   *
   * @param partnerId Partner ID
   * @param data Updated partner data
   */
  async updatePartner(partnerId: string, data: Partial<Partner>): Promise<void> {
    try {
      await this.partnerRepository.update(partnerId, data);

      // Update local state
      this._partners.update(partners => partners.map(partner => (partner.id === partnerId ? { ...partner, ...data } : partner)));

      this.logger.info('[PartnerStore]', `Partner updated: ${partnerId}`);
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      this._error.set(error);
      this.logger.error('[PartnerStore]', 'Failed to update partner', err as Error);
      throw err;
    }
  }

  /**
   * Delete a partner
   * 刪除夥伴
   *
   * @param partnerId Partner ID
   */
  async deletePartner(partnerId: string): Promise<void> {
    try {
      await this.partnerRepository.delete(partnerId);

      // Remove from local state
      this._partners.update(partners => partners.filter(partner => partner.id !== partnerId));
      this._memberCounts.update(counts => {
        const newCounts = new Map(counts);
        newCounts.delete(partnerId);
        return newCounts;
      });

      // Clear members if this was the current partner
      if (this._currentPartnerId() === partnerId) {
        this._members.set([]);
        this._currentPartnerId.set(null);
      }

      this.logger.info('[PartnerStore]', `Partner deleted: ${partnerId}`);
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      this._error.set(error);
      this.logger.error('[PartnerStore]', 'Failed to delete partner', err as Error);
      throw err;
    }
  }

  // ============================================================================
  // Partner Member Operations - 夥伴成員操作
  // ============================================================================

  /**
   * Load members for a partner
   * 載入夥伴成員
   *
   * @param partnerId Partner ID
   */
  async loadMembers(partnerId: string): Promise<void> {
    this._currentPartnerId.set(partnerId);
    this._loading.set(true);
    this._error.set(null);

    try {
      const members = await firstValueFrom(this.memberRepository.findByPartner(partnerId));
      this._members.set(members);

      // Update member count
      this._memberCounts.update(counts => {
        const newCounts = new Map(counts);
        newCounts.set(partnerId, members.length);
        return newCounts;
      });

      this.logger.info('[PartnerStore]', `Loaded ${members.length} members for partner: ${partnerId}`);
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      this._error.set(error);
      this.logger.error('[PartnerStore]', 'Failed to load members', err instanceof Error ? err : undefined);
      throw err;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Add a member to a partner
   * 新增成員到夥伴
   *
   * @param partnerId Partner ID
   * @param userId User ID
   * @param role Partner role (default: MEMBER)
   * @returns Created partner member
   */
  async addMember(partnerId: string, userId: string, role: PartnerRole = PartnerRole.MEMBER): Promise<PartnerMember> {
    try {
      const newMember = await this.memberRepository.addMember(partnerId, userId, role);

      // Update local state
      this._members.update(members => [newMember, ...members]);
      this._memberCounts.update(counts => {
        const newCounts = new Map(counts);
        const currentCount = newCounts.get(partnerId) || 0;
        newCounts.set(partnerId, currentCount + 1);
        return newCounts;
      });

      this.logger.info('[PartnerStore]', `Member added: ${userId} to partner ${partnerId}`);
      return newMember;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      this._error.set(error);
      this.logger.error('[PartnerStore]', 'Failed to add member', err as Error);
      throw err;
    }
  }

  /**
   * Remove a member from a partner
   * 從夥伴移除成員
   *
   * @param memberId Member ID
   * @param partnerId Partner ID (for updating count)
   */
  async removeMember(memberId: string, partnerId: string): Promise<void> {
    try {
      await this.memberRepository.removeMember(memberId);

      // Remove from local state
      this._members.update(members => members.filter(member => member.id !== memberId));
      this._memberCounts.update(counts => {
        const newCounts = new Map(counts);
        const currentCount = newCounts.get(partnerId) || 0;
        newCounts.set(partnerId, Math.max(0, currentCount - 1));
        return newCounts;
      });

      this.logger.info('[PartnerStore]', `Member removed: ${memberId}`);
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      this._error.set(error);
      this.logger.error('[PartnerStore]', 'Failed to remove member', err as Error);
      throw err;
    }
  }

  /**
   * Update member role
   * 更新成員角色
   *
   * Modern implementation using the repository's updateRole method.
   * This preserves the member ID and joined_at timestamp.
   *
   * @param memberId Member ID
   * @param partnerId Partner ID (for validation and state update)
   * @param newRole New partner role
   */
  async updateMemberRole(memberId: string, partnerId: string, newRole: PartnerRole): Promise<void> {
    try {
      // Update role in Firestore
      await this.memberRepository.updateRole(memberId, newRole);

      // Update local state - find and update the member's role
      this._members.update(members => 
        members.map(member => 
          member.id === memberId 
            ? { ...member, role: newRole } 
            : member
        )
      );

      this.logger.info('[PartnerStore]', `Member role updated: ${memberId} to ${newRole}`);
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      this._error.set(error);
      this.logger.error('[PartnerStore]', 'Failed to update member role', err as Error);
      throw err;
    }
  }

  // ============================================================================
  // Utility Methods - 工具方法
  // ============================================================================

  /**
   * Get member count for a specific partner
   * 獲取特定夥伴的成員數量
   *
   * @param partnerId Partner ID
   * @returns Member count
   */
  getMemberCount(partnerId: string): number {
    return this._memberCounts().get(partnerId) || 0;
  }

  /**
   * Clear all state
   * 清除所有狀態
   */
  clear(): void {
    this._partners.set([]);
    this._members.set([]);
    this._memberCounts.set(new Map());
    this._loading.set(false);
    this._error.set(null);
    this._currentOrganizationId.set(null);
    this._currentPartnerId.set(null);
    this.logger.info('[PartnerStore]', 'State cleared');
  }

  /**
   * Refresh current data
   * 重新整理當前資料
   */
  async refresh(): Promise<void> {
    const orgId = this._currentOrganizationId();
    const partnerId = this._currentPartnerId();

    if (orgId) {
      await this.loadPartners(orgId);
    }

    if (partnerId) {
      await this.loadMembers(partnerId);
    }
  }
}
