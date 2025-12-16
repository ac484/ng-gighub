import { Injectable, signal, computed, inject } from '@angular/core';
import { LoggerService } from '@core';
import { LogFirestoreRepository } from '@core/repositories';
import { Log, CreateLogRequest, UpdateLogRequest } from '@core/types/log';

/**
 * Log Store
 * 日誌 Store
 *
 * Following Occam's Razor: Simple signal-based state management
 * Using Angular 20 Signals for reactive state
 * Updated to use LogFirestoreRepository (standardized Firestore base)
 */
@Injectable({
  providedIn: 'root'
})
export class LogStore {
  private readonly repository = inject(LogFirestoreRepository);
  private readonly logger = inject(LoggerService);

  // Private state
  private _logs = signal<Log[]>([]);
  private _loading = signal(false);
  private _error = signal<string | null>(null);

  // Public readonly state
  readonly logs = this._logs.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  // Computed signals
  readonly logCount = computed(() => this._logs().length);

  /**
   * Load logs for a blueprint
   * 載入藍圖的日誌
   */
  async loadLogs(blueprintId: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const logs = await this.repository.findByBlueprint(blueprintId);
      this._logs.set(logs);
      this.logger.info('[LogStore]', `Loaded ${logs.length} logs for blueprint: ${blueprintId}`);
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      this._error.set(error);
      this.logger.error('[LogStore]', 'Failed to load logs', err as Error);
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Create a new log
   * 創建新日誌
   */
  async createLog(request: CreateLogRequest): Promise<void> {
    try {
      const newLog = await this.repository.create(request);
      this._logs.update(logs => [...logs, newLog]);
      this.logger.info('[LogStore]', `Log created: ${newLog.id}`);
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      this._error.set(error);
      this.logger.error('[LogStore]', 'Failed to create log', err as Error);
      throw err;
    }
  }

  /**
   * Update a log
   * 更新日誌
   */
  async updateLog(id: string, data: UpdateLogRequest): Promise<void> {
    try {
      await this.repository.update(id, data);

      // Update local state
      this._logs.update(logs => logs.map(log => (log.id === id ? { ...log, ...data, updatedAt: new Date() } : log)));

      this.logger.info('[LogStore]', `Log updated: ${id}`);
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      this._error.set(error);
      this.logger.error('[LogStore]', 'Failed to update log', err as Error);
      throw err;
    }
  }

  /**
   * Delete a log
   * 刪除日誌
   */
  async deleteLog(id: string): Promise<void> {
    try {
      await this.repository.delete(id);

      // Remove from local state
      this._logs.update(logs => logs.filter(log => log.id !== id));

      this.logger.info('[LogStore]', `Log deleted: ${id}`);
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      this._error.set(error);
      this.logger.error('[LogStore]', 'Failed to delete log', err as Error);
      throw err;
    }
  }

  /**
   * Clear error state
   * 清除錯誤狀態
   */
  clearError(): void {
    this._error.set(null);
  }

  /**
   * Reset store
   * 重置 Store
   */
  reset(): void {
    this._logs.set([]);
    this._loading.set(false);
    this._error.set(null);
  }
}
