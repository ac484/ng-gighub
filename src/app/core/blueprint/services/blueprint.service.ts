import { Injectable, inject } from '@angular/core';
import {
  Blueprint,
  BlueprintQueryOptions,
  BlueprintRole,
  CreateBlueprintRequest,
  OwnerType,
  UpdateBlueprintRequest,
  LoggerService,
  FirebaseAuthService
} from '@core';
import {
  AuditLogsService,
  AuditEventType,
  AuditCategory,
  AuditSeverity,
  ActorType,
  AuditStatus
} from '@core/blueprint/modules/implementations/audit-logs';
import { BlueprintMemberRepository, BlueprintRepository } from '@core/blueprint/repositories';
import { Observable } from 'rxjs';

import { BlueprintCreateSchema, BlueprintUpdateSchema } from './blueprint-validation-schemas';
import { ValidationService } from './validation.service';

@Injectable({
  providedIn: 'root'
})
export class BlueprintService {
  private readonly repository = inject(BlueprintRepository);
  private readonly memberRepository = inject(BlueprintMemberRepository);
  private readonly logger = inject(LoggerService);
  private readonly validator = inject(ValidationService);
  private readonly auditService = inject(AuditLogsService);
  private readonly authService = inject(FirebaseAuthService);

  getById(id: string): Observable<Blueprint | null> {
    return this.repository.findById(id);
  }

  getByOwner(ownerType: OwnerType, ownerId: string): Observable<Blueprint[]> {
    return this.repository.findByOwner(ownerType, ownerId);
  }

  query(options: BlueprintQueryOptions): Observable<Blueprint[]> {
    return this.repository.findWithOptions(options);
  }

  async create(request: CreateBlueprintRequest): Promise<Blueprint> {
    // Validate request
    this.validator.validateOrThrow(request, BlueprintCreateSchema, 'blueprint');

    try {
      const blueprint = await this.repository.create(request);
      this.logger.info('[BlueprintService]', `Blueprint created ${blueprint.id}`);

      // Record audit log for blueprint creation
      try {
        await this.auditService.recordLog({
          blueprintId: blueprint.id,
          eventType: AuditEventType.BLUEPRINT_CREATED,
          category: AuditCategory.BLUEPRINT,
          severity: AuditSeverity.INFO,
          actorId: request.createdBy,
          actorType: ActorType.USER,
          resourceType: 'blueprint',
          resourceId: blueprint.id,
          action: '建立藍圖',
          message: `藍圖 "${blueprint.name}" 已建立`,
          status: AuditStatus.SUCCESS
        });
      } catch (auditError) {
        this.logger.error('[BlueprintService]', 'Failed to record audit log for blueprint creation', auditError as Error);
        // Don't fail the operation if audit logging fails
      }

      // ✅ Auto-add creator as member with MAINTAINER role
      try {
        await this.memberRepository.addMember(blueprint.id, blueprint.ownerType, {
          accountId: request.createdBy,
          blueprintId: blueprint.id,
          memberType: 'user' as any, // Creator is always a user
          accountName: undefined, // Will be populated later if needed
          role: BlueprintRole.MAINTAINER,
          isExternal: false,
          grantedBy: request.createdBy,
          permissions: {
            canManageMembers: true,
            canManageSettings: true,
            canExportData: true,
            canDeleteBlueprint: true
          }
        });
        this.logger.info('[BlueprintService]', `Creator ${request.createdBy} added as MAINTAINER to blueprint ${blueprint.id}`);

        // Record audit log for member addition
        try {
          await this.auditService.recordLog({
            blueprintId: blueprint.id,
            eventType: AuditEventType.MEMBER_ADDED,
            category: AuditCategory.MEMBER,
            severity: AuditSeverity.INFO,
            actorId: request.createdBy,
            actorType: ActorType.USER,
            resourceType: 'member',
            resourceId: request.createdBy,
            action: '新增成員',
            message: `建立者自動加入為維護者`,
            status: AuditStatus.SUCCESS
          });
        } catch (auditError) {
          this.logger.error('[BlueprintService]', 'Failed to record audit log for member addition', auditError as Error);
        }
      } catch (memberError) {
        // Graceful degradation: Log error but don't fail blueprint creation
        this.logger.error('[BlueprintService]', 'Failed to add creator as member', memberError as Error);
        this.logger.warn('[BlueprintService]', `Blueprint ${blueprint.id} created but creator not added as member`);
      }

      return blueprint;
    } catch (error) {
      this.logger.error('[BlueprintService]', 'Failed to create blueprint', error as Error);
      throw error;
    }
  }

  async update(id: string, updates: UpdateBlueprintRequest, actorId?: string): Promise<void> {
    // Validate updates
    this.validator.validateOrThrow(updates, BlueprintUpdateSchema, 'blueprint');

    // Get actorId from auth service if not provided
    const currentActorId = actorId || this.authService.currentUser?.uid || 'system';

    try {
      await this.repository.update(id, updates);
      this.logger.info('[BlueprintService]', `Blueprint updated ${id}`);

      // Record audit log
      try {
        await this.auditService.recordLog({
          blueprintId: id,
          eventType: AuditEventType.BLUEPRINT_UPDATED,
          category: AuditCategory.BLUEPRINT,
          severity: AuditSeverity.INFO,
          actorId: currentActorId,
          actorType: ActorType.USER,
          resourceType: 'blueprint',
          resourceId: id,
          action: '更新藍圖',
          message: `藍圖已更新`,
          status: AuditStatus.SUCCESS
        });
      } catch (auditError) {
        this.logger.error('[BlueprintService]', 'Failed to record audit log for blueprint update', auditError as Error);
      }
    } catch (error) {
      this.logger.error('[BlueprintService]', 'Failed to update blueprint', error as Error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.repository.delete(id);
      this.logger.info('[BlueprintService]', `Blueprint deleted ${id}`);
    } catch (error) {
      this.logger.error('[BlueprintService]', 'Failed to delete blueprint', error as Error);
      throw error;
    }
  }

  async addMember(
    blueprintId: string,
    blueprintOwnerType: OwnerType,
    member: Omit<Parameters<BlueprintMemberRepository['addMember']>[2], 'id' | 'grantedAt'>
  ): Promise<void> {
    try {
      await this.memberRepository.addMember(blueprintId, blueprintOwnerType, member);
      this.logger.info('[BlueprintService]', `Member added to ${blueprintId}`);
    } catch (error) {
      this.logger.error('[BlueprintService]', 'Failed to add member', error as Error);
      throw error;
    }
  }
}
