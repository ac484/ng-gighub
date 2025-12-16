/**
 * Team Store - Modern Angular 20 Signal-based State Management
 *
 * 團隊 Store - 現代化 Angular 20 Signal 狀態管理
 *
 * Following Occam's Razor: Simple signal-based state management
 * Using Angular 20 Signals for reactive state
 *
 * Consolidates team and member management into a unified store
 * Eliminates duplicate state management across components
 *
 * Key Benefits:
 * - Single source of truth for team and member data
 * - Automatic state synchronization across components
 * - Simplified component logic (remove ~300 lines of duplicate code)
 * - Better performance with computed signals and batched queries
 *
 * @module core/stores
 * @author GigHub Development Team
 * @date 2025-12-12
 */

import { Injectable, signal, computed, inject } from '@angular/core';
import { LoggerService, Team, TeamMember, TeamRole } from '@core';
import { TeamRepository, TeamMemberRepository } from '@core/repositories';
import { firstValueFrom } from 'rxjs';

/**
 * Team with member count
 * 包含成員數量的團隊
 */
export interface TeamWithMembers extends Team {
  memberCount?: number;
}

/**
 * Team Store Injectable Service
 * 團隊 Store 可注入服務
 */
@Injectable({
  providedIn: 'root'
})
export class TeamStore {
  private readonly teamRepository = inject(TeamRepository);
  private readonly memberRepository = inject(TeamMemberRepository);
  private readonly logger = inject(LoggerService);

  // ============================================================================
  // Private State - 私有狀態
  // ============================================================================

  private _teams = signal<Team[]>([]);
  private _members = signal<TeamMember[]>([]);
  private _memberCounts = signal<Map<string, number>>(new Map());
  private _loading = signal(false);
  private _error = signal<string | null>(null);
  private _currentOrganizationId = signal<string | null>(null);
  private _currentTeamId = signal<string | null>(null);

  // ============================================================================
  // Public Readonly State - 公開只讀狀態
  // ============================================================================

  readonly teams = this._teams.asReadonly();
  readonly members = this._members.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly currentOrganizationId = this._currentOrganizationId.asReadonly();
  readonly currentTeamId = this._currentTeamId.asReadonly();

  // ============================================================================
  // Computed Signals - 計算信號
  // ============================================================================

  /**
   * Teams with member counts
   * 包含成員數量的團隊列表
   */
  readonly teamsWithMembers = computed<TeamWithMembers[]>(() => {
    const teams = this._teams();
    const counts = this._memberCounts();
    return teams.map(team => ({
      ...team,
      memberCount: counts.get(team.id) || 0
    }));
  });

  /**
   * Current team data
   * 當前團隊資料
   */
  readonly currentTeam = computed(() => {
    const teamId = this._currentTeamId();
    if (!teamId) return null;
    return this._teams().find(t => t.id === teamId) || null;
  });

  /**
   * Members filtered by current team
   * 依當前團隊篩選的成員
   */
  readonly currentTeamMembers = computed(() => {
    const teamId = this._currentTeamId();
    if (!teamId) return [];
    return this._members().filter(m => m.team_id === teamId);
  });

  /**
   * Members grouped by role
   * 依角色分組的成員
   */
  readonly membersByRole = computed(() => {
    const members = this.currentTeamMembers();
    return {
      leaders: members.filter(m => m.role === TeamRole.LEADER),
      members: members.filter(m => m.role === TeamRole.MEMBER)
    };
  });

  /**
   * Team statistics
   * 團隊統計
   */
  readonly teamStats = computed(() => {
    const teams = this._teams();
    const members = this._members();
    return {
      totalTeams: teams.length,
      totalMembers: members.length,
      averageMembersPerTeam: teams.length > 0 ? Math.round(members.length / teams.length) : 0
    };
  });

  // ============================================================================
  // Organization Operations - 組織操作
  // ============================================================================

  /**
   * Load teams for an organization
   * 載入組織的團隊
   *
   * @param organizationId Organization ID
   */
  async loadTeams(organizationId: string): Promise<void> {
    this._currentOrganizationId.set(organizationId);
    this._loading.set(true);
    this._error.set(null);

    try {
      const teams = await firstValueFrom(this.teamRepository.findByOrganization(organizationId));
      this._teams.set(teams);
      this.logger.info('[TeamStore]', `Loaded ${teams.length} teams for organization: ${organizationId}`);

      // Load member counts for all teams in batch
      await this.loadMemberCounts(teams);
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      this._error.set(error);
      this.logger.error('[TeamStore]', 'Failed to load teams', err instanceof Error ? err : undefined);
      throw err;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Load member counts for teams (batch operation)
   * 載入團隊成員數量（批次操作）
   *
   * @param teams Teams to load counts for
   */
  private async loadMemberCounts(teams: Team[]): Promise<void> {
    if (teams.length === 0) {
      this._memberCounts.set(new Map());
      return;
    }

    try {
      // Load all member lists in parallel
      const memberListPromises = teams.map(team =>
        firstValueFrom(this.memberRepository.findByTeam(team.id)).then(members => ({ teamId: team.id, count: members.length }))
      );

      const counts = await Promise.all(memberListPromises);
      const countMap = new Map<string, number>();
      counts.forEach(({ teamId, count }) => countMap.set(teamId, count));

      this._memberCounts.set(countMap);
      this.logger.info('[TeamStore]', `Loaded member counts for ${teams.length} teams`);
    } catch (err) {
      this.logger.error('[TeamStore]', 'Failed to load member counts', err as Error);
      // Don't throw - member counts are non-critical
      this._memberCounts.set(new Map());
    }
  }

  /**
   * Create a new team
   * 建立新團隊
   *
   * @param organizationId Organization ID
   * @param name Team name
   * @param description Team description (optional)
   * @returns Created team
   */
  async createTeam(organizationId: string, name: string, description?: string | null): Promise<Team> {
    try {
      const newTeam = await this.teamRepository.create({
        organization_id: organizationId,
        name,
        description: description || null
      });

      // Update local state
      this._teams.update(teams => [newTeam, ...teams]);
      this._memberCounts.update(counts => {
        const newCounts = new Map(counts);
        newCounts.set(newTeam.id, 0);
        return newCounts;
      });

      this.logger.info('[TeamStore]', `Team created: ${newTeam.id}`);
      return newTeam;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      this._error.set(error);
      this.logger.error('[TeamStore]', 'Failed to create team', err as Error);
      throw err;
    }
  }

  /**
   * Update a team
   * 更新團隊
   *
   * @param teamId Team ID
   * @param data Updated team data
   */
  async updateTeam(teamId: string, data: Partial<Team>): Promise<void> {
    try {
      await this.teamRepository.update(teamId, data);

      // Update local state
      this._teams.update(teams => teams.map(team => (team.id === teamId ? { ...team, ...data } : team)));

      this.logger.info('[TeamStore]', `Team updated: ${teamId}`);
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      this._error.set(error);
      this.logger.error('[TeamStore]', 'Failed to update team', err as Error);
      throw err;
    }
  }

  /**
   * Delete a team
   * 刪除團隊
   *
   * @param teamId Team ID
   */
  async deleteTeam(teamId: string): Promise<void> {
    try {
      await this.teamRepository.delete(teamId);

      // Remove from local state
      this._teams.update(teams => teams.filter(team => team.id !== teamId));
      this._memberCounts.update(counts => {
        const newCounts = new Map(counts);
        newCounts.delete(teamId);
        return newCounts;
      });

      // Clear members if this was the current team
      if (this._currentTeamId() === teamId) {
        this._members.set([]);
        this._currentTeamId.set(null);
      }

      this.logger.info('[TeamStore]', `Team deleted: ${teamId}`);
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      this._error.set(error);
      this.logger.error('[TeamStore]', 'Failed to delete team', err as Error);
      throw err;
    }
  }

  // ============================================================================
  // Team Member Operations - 團隊成員操作
  // ============================================================================

  /**
   * Load members for a team
   * 載入團隊成員
   *
   * @param teamId Team ID
   */
  async loadMembers(teamId: string): Promise<void> {
    this._currentTeamId.set(teamId);
    this._loading.set(true);
    this._error.set(null);

    try {
      const members = await firstValueFrom(this.memberRepository.findByTeam(teamId));
      this._members.set(members);

      // Update member count
      this._memberCounts.update(counts => {
        const newCounts = new Map(counts);
        newCounts.set(teamId, members.length);
        return newCounts;
      });

      this.logger.info('[TeamStore]', `Loaded ${members.length} members for team: ${teamId}`);
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      this._error.set(error);
      this.logger.error('[TeamStore]', 'Failed to load members', err instanceof Error ? err : undefined);
      throw err;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Add a member to a team
   * 新增成員到團隊
   *
   * @param teamId Team ID
   * @param userId User ID
   * @param role Team role (default: MEMBER)
   * @returns Created team member
   */
  async addMember(teamId: string, userId: string, role: TeamRole = TeamRole.MEMBER): Promise<TeamMember> {
    try {
      const newMember = await this.memberRepository.addMember(teamId, userId, role);

      // Update local state
      this._members.update(members => [newMember, ...members]);
      this._memberCounts.update(counts => {
        const newCounts = new Map(counts);
        const currentCount = newCounts.get(teamId) || 0;
        newCounts.set(teamId, currentCount + 1);
        return newCounts;
      });

      this.logger.info('[TeamStore]', `Member added: ${userId} to team ${teamId}`);
      return newMember;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      this._error.set(error);
      this.logger.error('[TeamStore]', 'Failed to add member', err as Error);
      throw err;
    }
  }

  /**
   * Remove a member from a team
   * 從團隊移除成員
   *
   * @param memberId Member ID
   * @param teamId Team ID (for updating count)
   */
  async removeMember(memberId: string, teamId: string): Promise<void> {
    try {
      await this.memberRepository.removeMember(memberId);

      // Remove from local state
      this._members.update(members => members.filter(member => member.id !== memberId));
      this._memberCounts.update(counts => {
        const newCounts = new Map(counts);
        const currentCount = newCounts.get(teamId) || 0;
        newCounts.set(teamId, Math.max(0, currentCount - 1));
        return newCounts;
      });

      this.logger.info('[TeamStore]', `Member removed: ${memberId}`);
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      this._error.set(error);
      this.logger.error('[TeamStore]', 'Failed to remove member', err as Error);
      throw err;
    }
  }

  /**
   * Update member role (simplified - no delete/recreate)
   * 更新成員角色（簡化版 - 不刪除後重建）
   *
   * This is a simplified approach that removes and re-adds the member.
   * For a production system, consider adding an `updateRole` method to the repository.
   *
   * @param memberId Member ID
   * @param teamId Team ID
   * @param userId User ID
   * @param newRole New team role
   */
  async updateMemberRole(memberId: string, teamId: string, userId: string, newRole: TeamRole): Promise<void> {
    try {
      // Remove and re-add with new role
      // TODO: Consider adding a dedicated updateRole() method to TeamMemberRepository
      await this.memberRepository.removeMember(memberId);
      const updatedMember = await this.memberRepository.addMember(teamId, userId, newRole);

      // Update local state
      this._members.update(members => members.map(member => (member.id === memberId ? updatedMember : member)));

      this.logger.info('[TeamStore]', `Member role updated: ${memberId} to ${newRole}`);
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      this._error.set(error);
      this.logger.error('[TeamStore]', 'Failed to update member role', err as Error);
      throw err;
    }
  }

  // ============================================================================
  // Utility Methods - 工具方法
  // ============================================================================

  /**
   * Get member count for a specific team
   * 獲取特定團隊的成員數量
   *
   * @param teamId Team ID
   * @returns Member count
   */
  getMemberCount(teamId: string): number {
    return this._memberCounts().get(teamId) || 0;
  }

  /**
   * Clear all state
   * 清除所有狀態
   */
  clear(): void {
    this._teams.set([]);
    this._members.set([]);
    this._memberCounts.set(new Map());
    this._loading.set(false);
    this._error.set(null);
    this._currentOrganizationId.set(null);
    this._currentTeamId.set(null);
    this.logger.info('[TeamStore]', 'State cleared');
  }

  /**
   * Refresh current data
   * 重新整理當前資料
   */
  async refresh(): Promise<void> {
    const orgId = this._currentOrganizationId();
    const teamId = this._currentTeamId();

    if (orgId) {
      await this.loadTeams(orgId);
    }

    if (teamId) {
      await this.loadMembers(teamId);
    }
  }
}
