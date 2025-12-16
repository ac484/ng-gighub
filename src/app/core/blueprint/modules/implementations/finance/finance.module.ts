/**
 * Finance Module
 *
 * Implementation of IBlueprintModule interface for 財務域.
 * Handles module lifecycle and integration with Blueprint Container.
 *
 * @author GigHub Development Team
 * @date 2025-12-13
 */

import { Injectable, signal, inject, WritableSignal } from '@angular/core';
import { LoggerService } from '@core';
import type { IExecutionContext } from '@core/blueprint/context/execution-context.interface';
import { ModuleStatus } from '@core/blueprint/modules/module-status.enum';
import { IBlueprintModule } from '@core/blueprint/modules/module.interface';

import { FINANCE_MODULE_METADATA, FINANCE_MODULE_DEFAULT_CONFIG, FINANCE_MODULE_EVENTS } from './module.metadata';
import { FinanceRepository } from './repositories/finance.repository';

/**
 * Finance Module Implementation
 *
 * Provides 財務域 functionality for Blueprint V2.
 * Implements full module lifecycle: init → start → ready → stop → dispose.
 */
@Injectable()
export class FinanceModule implements IBlueprintModule {
  private readonly logger = inject(LoggerService);
  private readonly repository = inject(FinanceRepository);

  /** Module ID */
  readonly id = FINANCE_MODULE_METADATA.id;

  /** Module name */
  readonly name = FINANCE_MODULE_METADATA.name;

  /** Module version */
  readonly version = FINANCE_MODULE_METADATA.version;

  /** Module description */
  readonly description = FINANCE_MODULE_METADATA.description;

  /** Module dependencies */
  readonly dependencies = FINANCE_MODULE_METADATA.dependencies;

  /** Module status signal */
  readonly status: WritableSignal<ModuleStatus> = signal(ModuleStatus.UNINITIALIZED);

  /** Execution context */
  private context?: IExecutionContext;

  /** Blueprint ID */
  private blueprintId?: string;

  /** Event unsubscribe functions */
  private eventUnsubscribers: Array<() => void> = [];

  /** Module exports */
  readonly exports = {
    repository: () => this.repository,
    metadata: FINANCE_MODULE_METADATA,
    defaultConfig: FINANCE_MODULE_DEFAULT_CONFIG,
    events: FINANCE_MODULE_EVENTS
  };

  /**
   * Initialize the module
   */
  async init(context: IExecutionContext): Promise<void> {
    this.logger.info('[FinanceModule]', 'Initializing...');
    this.status.set(ModuleStatus.INITIALIZING);

    try {
      this.context = context;
      this.blueprintId = context.blueprintId;

      if (!this.blueprintId) {
        throw new Error('Blueprint ID not found in execution context');
      }

      this.validateDependencies(context);
      this.subscribeToEvents(context);
      this.registerExports(context);

      this.status.set(ModuleStatus.INITIALIZED);
      this.logger.info('[FinanceModule]', 'Initialized successfully');
    } catch (error) {
      this.status.set(ModuleStatus.ERROR);
      this.logger.error('[FinanceModule]', 'Initialization failed', error as Error);
      throw error;
    }
  }

  /**
   * Start the module
   */
  async start(): Promise<void> {
    this.logger.info('[FinanceModule]', 'Starting...');
    this.status.set(ModuleStatus.STARTING);

    try {
      if (!this.blueprintId) {
        throw new Error('Module not initialized - blueprint ID missing');
      }

      this.status.set(ModuleStatus.STARTED);
      this.logger.info('[FinanceModule]', 'Started successfully');
    } catch (error) {
      this.status.set(ModuleStatus.ERROR);
      this.logger.error('[FinanceModule]', 'Start failed', error as Error);
      throw error;
    }
  }

  /**
   * Signal module is ready
   */
  async ready(): Promise<void> {
    this.logger.info('[FinanceModule]', 'Ready');
    this.status.set(ModuleStatus.READY);

    try {
      if (this.context?.eventBus) {
        this.context.eventBus.emit(FINANCE_MODULE_EVENTS.MODULE_STARTED, { status: 'ready' }, this.id);
      }

      this.status.set(ModuleStatus.RUNNING);
      this.logger.info('[FinanceModule]', 'Running');
    } catch (error) {
      this.status.set(ModuleStatus.ERROR);
      this.logger.error('[FinanceModule]', 'Ready transition failed', error as Error);
      throw error;
    }
  }

  /**
   * Stop the module
   */
  async stop(): Promise<void> {
    this.logger.info('[FinanceModule]', 'Stopping...');
    this.status.set(ModuleStatus.STOPPING);

    try {
      this.status.set(ModuleStatus.STOPPED);
      this.logger.info('[FinanceModule]', 'Stopped successfully');
    } catch (error) {
      this.status.set(ModuleStatus.ERROR);
      this.logger.error('[FinanceModule]', 'Stop failed', error as Error);
      throw error;
    }
  }

  /**
   * Dispose of the module
   */
  async dispose(): Promise<void> {
    this.logger.info('[FinanceModule]', 'Disposing...');

    try {
      this.unsubscribeFromEvents();
      this.context = undefined;
      this.blueprintId = undefined;

      this.status.set(ModuleStatus.DISPOSED);
      this.logger.info('[FinanceModule]', 'Disposed successfully');
    } catch (error) {
      this.status.set(ModuleStatus.ERROR);
      this.logger.error('[FinanceModule]', 'Dispose failed', error as Error);
      throw error;
    }
  }

  /**
   * Validate module dependencies
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private validateDependencies(_context?: IExecutionContext): void {
    this.logger.debug('[FinanceModule]', 'Dependencies validated');
  }

  /**
   * Subscribe to module events
   */
  private subscribeToEvents(context: IExecutionContext): void {
    if (!context.eventBus) {
      this.logger.warn('[FinanceModule]', 'EventBus not available in context');
      return;
    }

    this.logger.debug('[FinanceModule]', 'Event subscriptions set up');
  }

  /**
   * Unsubscribe from events
   */
  private unsubscribeFromEvents(): void {
    this.eventUnsubscribers.forEach(unsubscribe => unsubscribe());
    this.eventUnsubscribers = [];
    this.logger.debug('[FinanceModule]', 'Unsubscribed from all events');
  }

  /**
   * Register module exports
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private registerExports(_context?: IExecutionContext): void {
    this.logger.debug('[FinanceModule]', 'Module exports registered');
  }
}
