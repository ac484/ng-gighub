/**
 * Construction Log Store
 * 工地施工日誌狀態管理
 *
 * Simplified architecture using LogFirestoreRepository directly
 * Follows Occam's Razor principle - minimal complexity
 *
 * @author GigHub Development Team
 * @date 2025-12-12
 */

import { Injectable, signal, computed, inject } from '@angular/core';
import {
  AuditLogsService,
  AuditEventType,
  AuditCategory,
  AuditSeverity,
  ActorType,
  AuditStatus
} from '@core/blueprint/modules/implementations/audit-logs';
import { LogFirestoreRepository } from '@core/data-access/repositories/log-firestore.repository';
import { Log, CreateLogRequest, UpdateLogRequest } from '@core/types/log/log.types';

@Injectable({ providedIn: 'root' })
export class ConstructionLogStore {
  private repository = inject(LogFirestoreRepository);
  private auditService = inject(AuditLogsService);

  // Private state signals
  private _logs = signal<Log[]>([]);
  private _loading = signal(false);
  private _error = signal<string | null>(null);

  // Public readonly signals
  readonly logs = this._logs.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  // Computed signals - simplified calculations
  readonly totalCount = computed(() => this._logs().length);
  readonly totalPhotos = computed(() => this._logs().reduce((sum, log) => sum + (log.photos?.length || 0), 0));

  readonly thisMonthCount = computed(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    return this._logs().filter(log => {
      const logDate = new Date(log.date);
      return logDate.getMonth() === currentMonth && logDate.getFullYear() === currentYear;
    }).length;
  });

  readonly todayCount = computed(() => {
    const today = new Date().toDateString();
    return this._logs().filter(log => new Date(log.date).toDateString() === today).length;
  });

  /**
   * Load logs for a blueprint
   */
  async loadLogs(blueprintId: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      console.log('[ConstructionLogStore] Loading logs for blueprint:', blueprintId);
      const logs = await this.repository.findByBlueprint(blueprintId);
      console.log('[ConstructionLogStore] Loaded logs:', logs.length, 'logs');
      console.log('[ConstructionLogStore] Logs data:', logs);
      this._logs.set(logs);
    } catch (error) {
      this._error.set(error instanceof Error ? error.message : 'Failed to load logs');
      console.error('[ConstructionLogStore] Load logs error:', error);
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Create a new log
   */
  async createLog(request: CreateLogRequest): Promise<Log> {
    try {
      console.log('[ConstructionLogStore] Creating log with request:', request);
      const newLog = await this.repository.create(request);
      console.log('[ConstructionLogStore] Log created successfully:', newLog);
      this._logs.update(logs => [newLog, ...logs]);

      // Record audit log
      try {
        await this.auditService.recordLog({
          blueprintId: request.blueprintId,
          eventType: AuditEventType.LOG_CREATED,
          category: AuditCategory.DATA,
          severity: AuditSeverity.INFO,
          actorId: request.creatorId,
          actorType: ActorType.USER,
          resourceType: 'log',
          resourceId: newLog.id,
          action: '建立日誌',
          message: `日誌已建立: ${newLog.title}`,
          status: AuditStatus.SUCCESS
        });
      } catch (auditError) {
        console.error('[ConstructionLogStore] Failed to record audit log:', auditError);
        // Audit log failure is non-blocking: Log creation succeeds even if audit fails.
        // This ensures user operations aren't blocked by audit system issues.
        // Audit failures should be monitored separately via error tracking system.
      }

      return newLog;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create log';
      this._error.set(errorMessage);
      console.error('[ConstructionLogStore] Create log error:', error);
      // Re-throw error to let caller handle it
      throw new Error(errorMessage);
    }
  }

  /**
   * Update an existing log
   */
  async updateLog(_blueprintId: string, logId: string, request: UpdateLogRequest): Promise<Log> {
    try {
      await this.repository.update(logId, request);

      // Reload the updated log
      const updatedLog = await this.repository.findById(logId);
      if (!updatedLog) {
        throw new Error(`日誌更新後無法找到 (ID: ${logId})。該日誌可能已被其他使用者刪除，請重新整理頁面。`);
      }

      this._logs.update(logs => logs.map(log => (log.id === logId ? updatedLog : log)));
      return updatedLog;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update log';
      this._error.set(errorMessage);
      console.error('Update log error:', error);
      // Re-throw error to let caller handle it
      throw new Error(errorMessage);
    }
  }

  /**
   * Delete a log (soft delete)
   */
  async deleteLog(_blueprintId: string, logId: string): Promise<void> {
    try {
      await this.repository.delete(logId);
      this._logs.update(logs => logs.filter(log => log.id !== logId));
    } catch (error) {
      this._error.set(error instanceof Error ? error.message : 'Failed to delete log');
      console.error('Delete log error:', error);
      throw error;
    }
  }

  /**
   * Upload a photo to a log
   */
  async uploadPhoto(_blueprintId: string, logId: string, file: File, caption?: string): Promise<string> {
    try {
      const photo = await this.repository.uploadPhoto(logId, file, caption);

      // Update the log in the local state
      this._logs.update(logs =>
        logs.map(log => {
          if (log.id === logId) {
            return { ...log, photos: [...log.photos, photo] };
          }
          return log;
        })
      );

      return photo.id;
    } catch (error) {
      this._error.set(error instanceof Error ? error.message : 'Failed to upload photo');
      console.error('Upload photo error:', error);
      throw error;
    }
  }

  /**
   * Delete a photo from a log
   */
  async deletePhoto(_blueprintId: string, logId: string, photoId: string): Promise<void> {
    try {
      await this.repository.deletePhoto(logId, photoId);

      // Update the log in the local state
      this._logs.update(logs =>
        logs.map(log => {
          if (log.id === logId) {
            return { ...log, photos: log.photos.filter(p => p.id !== photoId) };
          }
          return log;
        })
      );
    } catch (error) {
      this._error.set(error instanceof Error ? error.message : 'Failed to delete photo');
      console.error('Delete photo error:', error);
      throw error;
    }
  }

  /**
   * Clear error state
   */
  clearError(): void {
    this._error.set(null);
  }
}
