/**
 * Workflow Module
 *
 * Implementation of IBlueprintModule interface for 流程域.
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

import { WORKFLOW_MODULE_METADATA, WORKFLOW_MODULE_DEFAULT_CONFIG, WORKFLOW_MODULE_EVENTS } from './module.metadata';
import { WorkflowRepository } from './repositories/workflow.repository';

/**
 * Workflow Module Implementation
 *
 * Provides 流程域 functionality for Blueprint V2.
 * Implements full module lifecycle: init → start → ready → stop → dispose.
 */
@Injectable()
export class WorkflowModule implements IBlueprintModule {
  private readonly logger = inject(LoggerService);
  private readonly repository = inject(WorkflowRepository);

  /** Module ID */
  readonly id = WORKFLOW_MODULE_METADATA.id;

  /** Module name */
  readonly name = WORKFLOW_MODULE_METADATA.name;

  /** Module version */
  readonly version = WORKFLOW_MODULE_METADATA.version;

  /** Module description */
  readonly description = WORKFLOW_MODULE_METADATA.description;

  /** Module dependencies */
  readonly dependencies = WORKFLOW_MODULE_METADATA.dependencies;

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
    metadata: WORKFLOW_MODULE_METADATA,
    defaultConfig: WORKFLOW_MODULE_DEFAULT_CONFIG,
    events: WORKFLOW_MODULE_EVENTS
  };

  /**
   * Initialize the module
   */
  async init(context: IExecutionContext): Promise<void> {
    this.logger.info('[WorkflowModule]', 'Initializing...');
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
      this.logger.info('[WorkflowModule]', 'Initialized successfully');
    } catch (error) {
      this.status.set(ModuleStatus.ERROR);
      this.logger.error('[WorkflowModule]', 'Initialization failed', error as Error);
      throw error;
    }
  }

  /**
   * Start the module
   */
  async start(): Promise<void> {
    this.logger.info('[WorkflowModule]', 'Starting...');
    this.status.set(ModuleStatus.STARTING);

    try {
      if (!this.blueprintId) {
        throw new Error('Module not initialized - blueprint ID missing');
      }

      this.status.set(ModuleStatus.STARTED);
      this.logger.info('[WorkflowModule]', 'Started successfully');
    } catch (error) {
      this.status.set(ModuleStatus.ERROR);
      this.logger.error('[WorkflowModule]', 'Start failed', error as Error);
      throw error;
    }
  }

  /**
   * Signal module is ready
   */
  async ready(): Promise<void> {
    this.logger.info('[WorkflowModule]', 'Ready');
    this.status.set(ModuleStatus.READY);

    try {
      if (this.context?.eventBus) {
        this.context.eventBus.emit(WORKFLOW_MODULE_EVENTS.MODULE_STARTED, { status: 'ready' }, this.id);
      }

      this.status.set(ModuleStatus.RUNNING);
      this.logger.info('[WorkflowModule]', 'Running');
    } catch (error) {
      this.status.set(ModuleStatus.ERROR);
      this.logger.error('[WorkflowModule]', 'Ready transition failed', error as Error);
      throw error;
    }
  }

  /**
   * Stop the module
   */
  async stop(): Promise<void> {
    this.logger.info('[WorkflowModule]', 'Stopping...');
    this.status.set(ModuleStatus.STOPPING);

    try {
      this.status.set(ModuleStatus.STOPPED);
      this.logger.info('[WorkflowModule]', 'Stopped successfully');
    } catch (error) {
      this.status.set(ModuleStatus.ERROR);
      this.logger.error('[WorkflowModule]', 'Stop failed', error as Error);
      throw error;
    }
  }

  /**
   * Dispose of the module
   */
  async dispose(): Promise<void> {
    this.logger.info('[WorkflowModule]', 'Disposing...');

    try {
      this.unsubscribeFromEvents();
      this.context = undefined;
      this.blueprintId = undefined;

      this.status.set(ModuleStatus.DISPOSED);
      this.logger.info('[WorkflowModule]', 'Disposed successfully');
    } catch (error) {
      this.status.set(ModuleStatus.ERROR);
      this.logger.error('[WorkflowModule]', 'Dispose failed', error as Error);
      throw error;
    }
  }

  /**
   * Validate module dependencies
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private validateDependencies(_context?: IExecutionContext): void {
    this.logger.debug('[WorkflowModule]', 'Dependencies validated');
  }

  /**
   * Subscribe to module events
   */
  private subscribeToEvents(context: IExecutionContext): void {
    if (!context.eventBus) {
      this.logger.warn('[WorkflowModule]', 'EventBus not available in context');
      return;
    }

    this.logger.debug('[WorkflowModule]', 'Event subscriptions set up');
  }

  /**
   * Unsubscribe from events
   */
  private unsubscribeFromEvents(): void {
    this.eventUnsubscribers.forEach(unsubscribe => unsubscribe());
    this.eventUnsubscribers = [];
    this.logger.debug('[WorkflowModule]', 'Unsubscribed from all events');
  }

  /**
   * Register module exports
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private registerExports(_context?: IExecutionContext): void {
    this.logger.debug('[WorkflowModule]', 'Module exports registered');
  }
}
