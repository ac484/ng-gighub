/**
 * Module Manager Service
 *
 * Service layer for managing Blueprint modules with Signal-based state management.
 * Provides operations for loading, enabling, disabling, and configuring modules.
 *
 * @author GigHub Development Team
 * @date 2025-12-11
 */

import { Injectable, inject, signal, computed } from '@angular/core';
import { 
  AuditLogRepository, 
  AuditEventType, 
  AuditCategory, 
  AuditSeverity, 
  AuditStatus, 
  ActorType 
} from '@core/blueprint/modules/implementations/audit-logs';
import { BlueprintModuleRepository } from '@core/blueprint/repositories/blueprint-module.repository';
import { BlueprintModuleDocument, CreateModuleData, BatchModuleOperationResult } from '@core/domain/models/blueprint-module.model';
import { ModuleStatus } from '@core/blueprint/modules/module-status.enum';
import { FirebaseService } from '@core/services/firebase.service';
import { firstValueFrom } from 'rxjs';

/**
 * Module statistics interface
 */
export interface ModuleStatistics {
  total: number;
  enabled: number;
  disabled: number;
  running: number;
  failed: number;
  uninitialized: number;
}

/**
 * Module filter options
 */
export interface ModuleFilterOptions {
  search?: string;
  status?: ModuleStatus;
  enabled?: boolean;
  moduleType?: string;
}

/**
 * Module Manager Service
 *
 * Manages module lifecycle, configuration, and state with Signal-based reactivity.
 *
 * @example
 * ```typescript
 * const service = inject(ModuleManagerService);
 *
 * // Load modules
 * await service.loadModules('blueprint-123');
 *
 * // Get statistics
 * const stats = service.moduleStats();
 *
 * // Enable a module
 * await service.enableModule('module-id');
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class ModuleManagerService {
  private moduleRepo = inject(BlueprintModuleRepository);
  private auditRepo = inject(AuditLogRepository);
  private firebaseService = inject(FirebaseService);

  // Private state
  private _modules = signal<BlueprintModuleDocument[]>([]);
  private _loading = signal(false);
  private _error = signal<string | null>(null);
  private _currentBlueprintId = signal<string | null>(null);
  private _selectedModules = signal<Set<string>>(new Set());

  // Public readonly state
  readonly modules = this._modules.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly currentBlueprintId = this._currentBlueprintId.asReadonly();
  readonly selectedModules = this._selectedModules.asReadonly();

  // Computed state
  readonly enabledModules = computed(() => this._modules().filter(m => m.enabled));

  readonly disabledModules = computed(() => this._modules().filter(m => !m.enabled));

  readonly runningModules = computed(() => this._modules().filter(m => m.status === ModuleStatus.RUNNING));

  readonly failedModules = computed(() => this._modules().filter(m => m.status === ModuleStatus.ERROR));

  readonly moduleStats = computed((): ModuleStatistics => {
    const modules = this._modules();
    return {
      total: modules.length,
      enabled: modules.filter(m => m.enabled).length,
      disabled: modules.filter(m => !m.enabled).length,
      running: modules.filter(m => m.status === ModuleStatus.RUNNING).length,
      failed: modules.filter(m => m.status === ModuleStatus.ERROR).length,
      uninitialized: modules.filter(m => m.status === ModuleStatus.UNINITIALIZED).length
    };
  });

  /**
   * Load modules for a blueprint
   *
   * @param blueprintId - Blueprint ID
   */
  async loadModules(blueprintId: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    this._currentBlueprintId.set(blueprintId);

    try {
      const modules = await firstValueFrom(this.moduleRepo.findByBlueprintId(blueprintId));
      this._modules.set(modules);
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to load modules';
      this._error.set(error);
      console.error('Error loading modules:', err);
      throw err;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Reload modules from Firestore
   */
  async reloadModules(): Promise<void> {
    const blueprintId = this._currentBlueprintId();
    if (!blueprintId) {
      throw new Error('No blueprint loaded');
    }
    await this.loadModules(blueprintId);
  }

  /**
   * Register a new module
   *
   * @param data - Module creation data
   * @returns Created module document
   */
  async registerModule(data: CreateModuleData): Promise<BlueprintModuleDocument> {
    const blueprintId = this._currentBlueprintId();
    if (!blueprintId) {
      throw new Error('No blueprint loaded');
    }

    this._loading.set(true);
    this._error.set(null);

    try {
      const module = await this.moduleRepo.create(blueprintId, data);
      this._modules.update(modules => [...modules, module]);

      // Log audit event
      await this.auditRepo.create({
        blueprintId,
        eventType: AuditEventType.MODULE_REGISTERED,
        category: AuditCategory.MODULE,
        severity: AuditSeverity.INFO,
        actorId: data.configuredBy || 'system',
        actorType: ActorType.USER,
        resourceType: 'module',
        resourceId: module.id,
        action: 'register',
        message: `Registered module: ${module.name}`,
        status: AuditStatus.SUCCESS,
        metadata: {
          moduleName: module.name,
          moduleType: module.moduleType
        }
      });

      return module;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to register module';
      this._error.set(error);
      console.error('Error registering module:', err);
      throw err;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Enable a module
   *
   * @param moduleId - Module ID
   */
  async enableModule(moduleId: string): Promise<void> {
    const blueprintId = this._currentBlueprintId();
    if (!blueprintId) {
      throw new Error('No blueprint loaded');
    }

    this._loading.set(true);
    this._error.set(null);

    try {
      await this.moduleRepo.update(blueprintId, moduleId, { enabled: true });
      this._modules.update(modules => modules.map(m => (m.id === moduleId ? { ...m, enabled: true } : m)));

      // Log audit event
      const module = this._modules().find(m => m.id === moduleId);
      if (module) {
        const currentUserId = this.firebaseService.getCurrentUserId() || 'system';
        await this.auditRepo.create({
          blueprintId,
          eventType: AuditEventType.MODULE_ENABLED,
          category: AuditCategory.MODULE,
          severity: AuditSeverity.INFO,
          actorId: currentUserId,
          actorType: ActorType.USER,
          resourceType: 'module',
          resourceId: moduleId,
          action: 'enable',
          message: `Enabled module: ${module.name}`,
          status: AuditStatus.SUCCESS
        });
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to enable module';
      this._error.set(error);
      console.error('Error enabling module:', err);
      throw err;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Disable a module
   *
   * @param moduleId - Module ID
   */
  async disableModule(moduleId: string): Promise<void> {
    const blueprintId = this._currentBlueprintId();
    if (!blueprintId) {
      throw new Error('No blueprint loaded');
    }

    this._loading.set(true);
    this._error.set(null);

    try {
      await this.moduleRepo.update(blueprintId, moduleId, { enabled: false });
      this._modules.update(modules => modules.map(m => (m.id === moduleId ? { ...m, enabled: false } : m)));

      // Log audit event
      const module = this._modules().find(m => m.id === moduleId);
      if (module) {
        const currentUserId = this.firebaseService.getCurrentUserId() || 'system';
        await this.auditRepo.create({
          blueprintId,
          eventType: AuditEventType.MODULE_DISABLED,
          category: AuditCategory.MODULE,
          severity: AuditSeverity.INFO,
          actorId: currentUserId,
          actorType: ActorType.USER,
          resourceType: 'module',
          resourceId: moduleId,
          action: 'disable',
          message: `Disabled module: ${module.name}`,
          status: AuditStatus.SUCCESS
        });
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to disable module';
      this._error.set(error);
      console.error('Error disabling module:', err);
      throw err;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Update module status
   *
   * @param moduleId - Module ID
   * @param status - New status
   */
  async updateModuleStatus(moduleId: string, status: ModuleStatus): Promise<void> {
    const blueprintId = this._currentBlueprintId();
    if (!blueprintId) {
      throw new Error('No blueprint loaded');
    }

    this._loading.set(true);
    this._error.set(null);

    try {
      await this.moduleRepo.updateStatus(blueprintId, moduleId, status);
      this._modules.update(modules => modules.map(m => (m.id === moduleId ? { ...m, status } : m)));
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to update module status';
      this._error.set(error);
      console.error('Error updating module status:', err);
      throw err;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Update module configuration
   *
   * @param moduleId - Module ID
   * @param config - New configuration
   */
  async updateModuleConfig(moduleId: string, config: any): Promise<void> {
    const blueprintId = this._currentBlueprintId();
    if (!blueprintId) {
      throw new Error('No blueprint loaded');
    }

    this._loading.set(true);
    this._error.set(null);

    try {
      await this.moduleRepo.update(blueprintId, moduleId, { config });
      this._modules.update(modules => modules.map(m => (m.id === moduleId ? { ...m, config, updatedAt: new Date() } : m)));

      // Log audit event
      const module = this._modules().find(m => m.id === moduleId);
      if (module) {
        const currentUserId = this.firebaseService.getCurrentUserId() || 'system';
        await this.auditRepo.create({
          blueprintId,
          eventType: AuditEventType.MODULE_CONFIGURED,
          category: AuditCategory.MODULE,
          severity: AuditSeverity.INFO,
          actorId: currentUserId,
          actorType: ActorType.USER,
          resourceType: 'module',
          resourceId: moduleId,
          action: 'configure',
          message: `Updated configuration for module: ${module.name}`,
          status: AuditStatus.SUCCESS,
          metadata: { config }
        });
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to update module config';
      this._error.set(error);
      console.error('Error updating module config:', err);
      throw err;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Delete a module
   *
   * @param moduleId - Module ID
   */
  async deleteModule(moduleId: string): Promise<void> {
    const blueprintId = this._currentBlueprintId();
    if (!blueprintId) {
      throw new Error('No blueprint loaded');
    }

    this._loading.set(true);
    this._error.set(null);

    try {
      await this.moduleRepo.delete(blueprintId, moduleId);
      this._modules.update(modules => modules.filter(m => m.id !== moduleId));

      // Log audit event
      const currentUserId = this.firebaseService.getCurrentUserId() || 'system';
      await this.auditRepo.create({
        blueprintId,
        eventType: AuditEventType.MODULE_UNREGISTERED,
        category: AuditCategory.MODULE,
        severity: AuditSeverity.INFO,
        actorId: currentUserId,
        actorType: ActorType.USER,
        resourceType: 'module',
        resourceId: moduleId,
        action: 'unregister',
        message: `Deleted module: ${moduleId}`,
        status: AuditStatus.SUCCESS
      });
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to delete module';
      this._error.set(error);
      console.error('Error deleting module:', err);
      throw err;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Batch enable/disable modules
   *
   * @param moduleIds - Array of module IDs
   * @param enabled - Enable (true) or disable (false)
   * @returns Batch result
   */
  async batchUpdateEnabled(moduleIds: string[], enabled: boolean): Promise<BatchModuleOperationResult> {
    const blueprintId = this._currentBlueprintId();
    if (!blueprintId) {
      throw new Error('No blueprint loaded');
    }

    this._loading.set(true);
    this._error.set(null);

    try {
      const result = await this.moduleRepo.batchUpdateEnabled(blueprintId, moduleIds, enabled);

      // Update local state
      this._modules.update(modules => modules.map(m => (result.success.includes(m.id!) ? { ...m, enabled } : m)));

      // Log audit event
      const currentUserId = this.firebaseService.getCurrentUserId() || 'system';
      await this.auditRepo.create({
        blueprintId,
        eventType: enabled ? AuditEventType.MODULE_ENABLED : AuditEventType.MODULE_DISABLED,
        category: AuditCategory.MODULE,
        severity: AuditSeverity.INFO,
        actorId: currentUserId,
        actorType: ActorType.USER,
        resourceType: 'module',
        action: enabled ? 'batch_enable' : 'batch_disable',
        message: `Batch ${enabled ? 'enabled' : 'disabled'} ${result.success.length} modules`,
        status: result.failed.length > 0 ? AuditStatus.PARTIAL : AuditStatus.SUCCESS,
        metadata: {
          moduleIds: result.success,
          failed: result.failed
        }
      });

      return result;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to batch update modules';
      this._error.set(error);
      console.error('Error batch updating modules:', err);
      throw err;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Filter modules
   *
   * @param options - Filter options
   * @returns Filtered modules
   */
  filterModules(options: ModuleFilterOptions): BlueprintModuleDocument[] {
    let filtered = this._modules();

    if (options.search) {
      const search = options.search.toLowerCase();
      filtered = filtered.filter(m => m.name.toLowerCase().includes(search) || m.moduleType.toLowerCase().includes(search));
    }

    if (options.status !== undefined) {
      filtered = filtered.filter(m => m.status === options.status);
    }

    if (options.enabled !== undefined) {
      filtered = filtered.filter(m => m.enabled === options.enabled);
    }

    if (options.moduleType) {
      filtered = filtered.filter(m => m.moduleType === options.moduleType);
    }

    return filtered;
  }

  /**
   * Toggle module selection
   *
   * @param moduleId - Module ID
   */
  toggleSelection(moduleId: string): void {
    this._selectedModules.update(selected => {
      const newSelected = new Set(selected);
      if (newSelected.has(moduleId)) {
        newSelected.delete(moduleId);
      } else {
        newSelected.add(moduleId);
      }
      return newSelected;
    });
  }

  /**
   * Select all modules
   */
  selectAll(): void {
    const allIds = new Set(this._modules().map(m => m.id).filter((id): id is string => id !== undefined));
    this._selectedModules.set(allIds);
  }

  /**
   * Clear selection
   */
  clearSelection(): void {
    this._selectedModules.set(new Set());
  }

  /**
   * Get selected module IDs as array
   */
  getSelectedIds(): string[] {
    return Array.from(this._selectedModules());
  }
}
