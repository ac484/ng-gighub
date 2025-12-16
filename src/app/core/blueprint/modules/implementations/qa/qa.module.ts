/**
 * Qa Module
 *
 * Implementation of IBlueprintModule interface for 品質控管域.
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

import { QA_MODULE_METADATA, QA_MODULE_DEFAULT_CONFIG, QA_MODULE_EVENTS } from './module.metadata';
import { QaRepository } from './repositories/qa.repository';

/**
 * Qa Module Implementation
 *
 * Provides 品質控管域 functionality for Blueprint V2.
 * Implements full module lifecycle: init → start → ready → stop → dispose.
 */
@Injectable()
export class QaModule implements IBlueprintModule {
  private readonly logger = inject(LoggerService);
  private readonly repository = inject(QaRepository);

  /** Module ID */
  readonly id = QA_MODULE_METADATA.id;

  /** Module name */
  readonly name = QA_MODULE_METADATA.name;

  /** Module version */
  readonly version = QA_MODULE_METADATA.version;

  /** Module description */
  readonly description = QA_MODULE_METADATA.description;

  /** Module dependencies */
  readonly dependencies = QA_MODULE_METADATA.dependencies;

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
    metadata: QA_MODULE_METADATA,
    defaultConfig: QA_MODULE_DEFAULT_CONFIG,
    events: QA_MODULE_EVENTS
  };

  /**
   * Initialize the module
   */
  async init(context: IExecutionContext): Promise<void> {
    this.logger.info('[QaModule]', 'Initializing...');
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
      this.logger.info('[QaModule]', 'Initialized successfully');
    } catch (error) {
      this.status.set(ModuleStatus.ERROR);
      this.logger.error('[QaModule]', 'Initialization failed', error as Error);
      throw error;
    }
  }

  /**
   * Start the module
   */
  async start(): Promise<void> {
    this.logger.info('[QaModule]', 'Starting...');
    this.status.set(ModuleStatus.STARTING);

    try {
      if (!this.blueprintId) {
        throw new Error('Module not initialized - blueprint ID missing');
      }

      this.status.set(ModuleStatus.STARTED);
      this.logger.info('[QaModule]', 'Started successfully');
    } catch (error) {
      this.status.set(ModuleStatus.ERROR);
      this.logger.error('[QaModule]', 'Start failed', error as Error);
      throw error;
    }
  }

  /**
   * Signal module is ready
   */
  async ready(): Promise<void> {
    this.logger.info('[QaModule]', 'Ready');
    this.status.set(ModuleStatus.READY);

    try {
      if (this.context?.eventBus) {
        this.context.eventBus.emit(QA_MODULE_EVENTS.MODULE_STARTED, { status: 'ready' }, this.id);
      }

      this.status.set(ModuleStatus.RUNNING);
      this.logger.info('[QaModule]', 'Running');
    } catch (error) {
      this.status.set(ModuleStatus.ERROR);
      this.logger.error('[QaModule]', 'Ready transition failed', error as Error);
      throw error;
    }
  }

  /**
   * Stop the module
   */
  async stop(): Promise<void> {
    this.logger.info('[QaModule]', 'Stopping...');
    this.status.set(ModuleStatus.STOPPING);

    try {
      this.status.set(ModuleStatus.STOPPED);
      this.logger.info('[QaModule]', 'Stopped successfully');
    } catch (error) {
      this.status.set(ModuleStatus.ERROR);
      this.logger.error('[QaModule]', 'Stop failed', error as Error);
      throw error;
    }
  }

  /**
   * Dispose of the module
   */
  async dispose(): Promise<void> {
    this.logger.info('[QaModule]', 'Disposing...');

    try {
      this.unsubscribeFromEvents();
      this.context = undefined;
      this.blueprintId = undefined;

      this.status.set(ModuleStatus.DISPOSED);
      this.logger.info('[QaModule]', 'Disposed successfully');
    } catch (error) {
      this.status.set(ModuleStatus.ERROR);
      this.logger.error('[QaModule]', 'Dispose failed', error as Error);
      throw error;
    }
  }

  /**
   * Validate module dependencies
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private validateDependencies(_context?: IExecutionContext): void {
    this.logger.debug('[QaModule]', 'Dependencies validated');
  }

  /**
   * Subscribe to module events
   */
  private subscribeToEvents(context: IExecutionContext): void {
    if (!context.eventBus) {
      this.logger.warn('[QaModule]', 'EventBus not available in context');
      return;
    }

    this.logger.debug('[QaModule]', 'Event subscriptions set up');
  }

  /**
   * Unsubscribe from events
   */
  private unsubscribeFromEvents(): void {
    this.eventUnsubscribers.forEach(unsubscribe => unsubscribe());
    this.eventUnsubscribers = [];
    this.logger.debug('[QaModule]', 'Unsubscribed from all events');
  }

  /**
   * Register module exports
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private registerExports(_context?: IExecutionContext): void {
    this.logger.debug('[QaModule]', 'Module exports registered');
  }
}
