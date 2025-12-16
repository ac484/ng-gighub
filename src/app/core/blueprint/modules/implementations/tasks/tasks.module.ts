/**
 * Tasks Module
 *
 * Implementation of IBlueprintModule interface for task management.
 * Handles module lifecycle and integration with Blueprint Container.
 *
 * @author GigHub Development Team
 * @date 2025-12-10
 */

import { Injectable, signal, inject, WritableSignal } from '@angular/core';
import { LoggerService } from '@core';
import type { IExecutionContext } from '@core/blueprint/context/execution-context.interface';
import { ModuleStatus } from '@core/blueprint/modules/module-status.enum';
import { IBlueprintModule } from '@core/blueprint/modules/module.interface';

import { TASKS_MODULE_METADATA, TASKS_MODULE_DEFAULT_CONFIG, TASKS_MODULE_EVENTS } from './module.metadata';
import { TasksRepository } from './tasks.repository';
import { TasksService } from './tasks.service';

/**
 * Tasks Module Implementation
 *
 * Provides task management functionality for Blueprint V2.
 * Implements full module lifecycle: init → start → ready → stop → dispose.
 */
@Injectable()
export class TasksModule implements IBlueprintModule {
  private readonly logger = inject(LoggerService);
  private readonly tasksService = inject(TasksService);
  private readonly tasksRepository = inject(TasksRepository);

  /** Module ID */
  readonly id = TASKS_MODULE_METADATA.id;

  /** Module name */
  readonly name = TASKS_MODULE_METADATA.name;

  /** Module version */
  readonly version = TASKS_MODULE_METADATA.version;

  /** Module description */
  readonly description = TASKS_MODULE_METADATA.description;

  /** Module dependencies */
  readonly dependencies = TASKS_MODULE_METADATA.dependencies;

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
    service: () => this.tasksService,
    repository: () => this.tasksRepository,
    metadata: TASKS_MODULE_METADATA,
    defaultConfig: TASKS_MODULE_DEFAULT_CONFIG,
    events: TASKS_MODULE_EVENTS
  };

  /**
   * Initialize the module
   */
  async init(context: IExecutionContext): Promise<void> {
    this.logger.info('[TasksModule]', 'Initializing...');
    this.status.set(ModuleStatus.INITIALIZING);

    try {
      // Store context
      this.context = context;

      // Extract blueprint ID from context
      this.blueprintId = context.blueprintId;

      if (!this.blueprintId) {
        throw new Error('Blueprint ID not found in execution context');
      }

      // Validate dependencies
      this.validateDependencies(context);

      // Subscribe to module events
      this.subscribeToEvents(context);

      // Register module exports
      this.registerExports(context);

      this.status.set(ModuleStatus.INITIALIZED);
      this.logger.info('[TasksModule]', 'Initialized successfully');
    } catch (error) {
      this.status.set(ModuleStatus.ERROR);
      this.logger.error('[TasksModule]', 'Initialization failed', error as Error);
      throw error;
    }
  }

  /**
   * Start the module
   */
  async start(): Promise<void> {
    this.logger.info('[TasksModule]', 'Starting...');
    this.status.set(ModuleStatus.STARTING);

    try {
      if (!this.blueprintId) {
        throw new Error('Module not initialized - blueprint ID missing');
      }

      // Load initial data
      this.tasksService.loadTasks(this.blueprintId);

      this.status.set(ModuleStatus.STARTED);
      this.logger.info('[TasksModule]', 'Started successfully');
    } catch (error) {
      this.status.set(ModuleStatus.ERROR);
      this.logger.error('[TasksModule]', 'Start failed', error as Error);
      throw error;
    }
  }

  /**
   * Signal module is ready
   */
  async ready(): Promise<void> {
    this.logger.info('[TasksModule]', 'Ready');
    this.status.set(ModuleStatus.READY);

    try {
      // Emit module ready event
      if (this.context?.eventBus) {
        this.context.eventBus.emit(TASKS_MODULE_EVENTS.TASK_CREATED, { status: 'ready' }, this.id);
      }

      this.status.set(ModuleStatus.RUNNING);
      this.logger.info('[TasksModule]', 'Running');
    } catch (error) {
      this.status.set(ModuleStatus.ERROR);
      this.logger.error('[TasksModule]', 'Ready transition failed', error as Error);
      throw error;
    }
  }

  /**
   * Stop the module
   */
  async stop(): Promise<void> {
    this.logger.info('[TasksModule]', 'Stopping...');
    this.status.set(ModuleStatus.STOPPING);

    try {
      // Clear service state
      this.tasksService.clearState();

      this.status.set(ModuleStatus.STOPPED);
      this.logger.info('[TasksModule]', 'Stopped successfully');
    } catch (error) {
      this.status.set(ModuleStatus.ERROR);
      this.logger.error('[TasksModule]', 'Stop failed', error as Error);
      throw error;
    }
  }

  /**
   * Dispose of the module
   */
  async dispose(): Promise<void> {
    this.logger.info('[TasksModule]', 'Disposing...');

    try {
      // Unsubscribe from events
      this.unsubscribeFromEvents();

      // Clear all state
      this.tasksService.clearState();
      this.context = undefined;
      this.blueprintId = undefined;

      this.status.set(ModuleStatus.DISPOSED);
      this.logger.info('[TasksModule]', 'Disposed successfully');
    } catch (error) {
      this.status.set(ModuleStatus.ERROR);
      this.logger.error('[TasksModule]', 'Dispose failed', error as Error);
      throw error;
    }
  }

  /**
   * Validate module dependencies
   */
  private validateDependencies(context: IExecutionContext): void {
    // Currently no dependencies to validate
    // Future: Check if required modules are loaded
    this.logger.debug('[TasksModule]', 'Dependencies validated');
  }

  /**
   * Subscribe to module events
   */
  private subscribeToEvents(context: IExecutionContext): void {
    if (!context.eventBus) {
      this.logger.warn('[TasksModule]', 'EventBus not available in context');
      return;
    }

    const eventBus = context.eventBus;

    // Subscribe to task events
    this.eventUnsubscribers.push(
      eventBus.on<Record<string, unknown>>(TASKS_MODULE_EVENTS.TASK_CREATED, event => {
        this.logger.info('[TasksModule]', 'Task created event received', event.payload);
      })
    );

    this.eventUnsubscribers.push(
      eventBus.on<Record<string, unknown>>(TASKS_MODULE_EVENTS.TASK_UPDATED, event => {
        this.logger.info('[TasksModule]', 'Task updated event received', event.payload);
      })
    );

    this.eventUnsubscribers.push(
      eventBus.on<Record<string, unknown>>(TASKS_MODULE_EVENTS.TASK_DELETED, event => {
        this.logger.info('[TasksModule]', 'Task deleted event received', event.payload);
      })
    );

    this.eventUnsubscribers.push(
      eventBus.on<Record<string, unknown>>(TASKS_MODULE_EVENTS.TASK_STATUS_CHANGED, event => {
        this.logger.info('[TasksModule]', 'Task status changed event received', event.payload);
      })
    );

    this.eventUnsubscribers.push(
      eventBus.on<Record<string, unknown>>(TASKS_MODULE_EVENTS.TASK_COMPLETED, event => {
        this.logger.info('[TasksModule]', 'Task completed event received', event.payload);
      })
    );

    this.eventUnsubscribers.push(
      eventBus.on<Record<string, unknown>>(TASKS_MODULE_EVENTS.TASK_ASSIGNED, event => {
        this.logger.info('[TasksModule]', 'Task assigned event received', event.payload);
      })
    );

    this.logger.debug('[TasksModule]', `Subscribed to ${this.eventUnsubscribers.length} events`);
  }

  /**
   * Unsubscribe from events
   */
  private unsubscribeFromEvents(): void {
    // Clean up event subscriptions
    this.eventUnsubscribers.forEach(unsubscribe => unsubscribe());
    this.eventUnsubscribers = [];
    this.logger.debug('[TasksModule]', 'Unsubscribed from all events');
  }

  /**
   * Register module exports
   */
  private registerExports(context: IExecutionContext): void {
    // Exports are available via the exports property
    this.logger.debug('[TasksModule]', 'Module exports registered');
  }
}
