/**
 * Cloud Storage Module
 * 雲端儲存模組
 *
 * Implementation of IBlueprintModule interface for cloud storage domain.
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

import { CLOUD_MODULE_METADATA, CLOUD_MODULE_DEFAULT_CONFIG, CLOUD_MODULE_EVENTS } from './module.metadata';
import { CloudRepository } from './repositories';
import { CloudStorageService } from './services';

/**
 * Cloud Storage Module Implementation
 *
 * Provides cloud storage functionality for Blueprint V2.
 * Implements full module lifecycle: init → start → ready → stop → dispose.
 *
 * Features:
 * - File upload/download/delete
 * - Cloud sync management
 * - Backup creation and restoration
 * - Event-driven integration via EventBus
 */
@Injectable()
export class CloudModule implements IBlueprintModule {
  private readonly logger = inject(LoggerService);
  private readonly cloudService = inject(CloudStorageService);
  private readonly cloudRepository = inject(CloudRepository);

  /** Module ID */
  readonly id = CLOUD_MODULE_METADATA.id;

  /** Module name */
  readonly name = CLOUD_MODULE_METADATA.name;

  /** Module version */
  readonly version = CLOUD_MODULE_METADATA.version;

  /** Module description */
  readonly description = CLOUD_MODULE_METADATA.description;

  /** Module dependencies */
  readonly dependencies = CLOUD_MODULE_METADATA.dependencies;

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
    service: () => this.cloudService,
    repository: () => this.cloudRepository,
    metadata: CLOUD_MODULE_METADATA,
    defaultConfig: CLOUD_MODULE_DEFAULT_CONFIG,
    events: CLOUD_MODULE_EVENTS
  };

  /**
   * Initialize the module
   */
  async init(context: IExecutionContext): Promise<void> {
    this.logger.info('[CloudModule]', 'Initializing...');
    this.status.set(ModuleStatus.INITIALIZING);

    try {
      // Store context
      this.context = context;
      this.blueprintId = context.blueprintId;

      if (!this.blueprintId) {
        throw new Error('Blueprint ID not found in execution context');
      }

      // Validate dependencies
      this.validateDependencies(context);

      // Initialize service with EventBus
      if (context.eventBus) {
        this.cloudService.initializeWithEventBus(context.eventBus, this.id);
      }

      // Subscribe to module events
      this.subscribeToEvents(context);

      // Register module exports
      this.registerExports(context);

      this.status.set(ModuleStatus.INITIALIZED);
      this.logger.info('[CloudModule]', 'Initialized successfully');
    } catch (error) {
      this.status.set(ModuleStatus.ERROR);
      this.logger.error('[CloudModule]', 'Initialization failed', error as Error);
      throw error;
    }
  }

  /**
   * Start the module
   */
  async start(): Promise<void> {
    this.logger.info('[CloudModule]', 'Starting...');
    this.status.set(ModuleStatus.STARTING);

    try {
      if (!this.blueprintId) {
        throw new Error('Module not initialized - blueprint ID missing');
      }

      // Load initial data
      await this.cloudService.loadFiles(this.blueprintId);
      await this.cloudService.loadBackups(this.blueprintId);

      this.status.set(ModuleStatus.STARTED);
      this.logger.info('[CloudModule]', 'Started successfully');
    } catch (error) {
      this.status.set(ModuleStatus.ERROR);
      this.logger.error('[CloudModule]', 'Start failed', error as Error);
      throw error;
    }
  }

  /**
   * Signal module is ready
   */
  async ready(): Promise<void> {
    this.logger.info('[CloudModule]', 'Ready');
    this.status.set(ModuleStatus.READY);

    try {
      // Emit module ready event
      if (this.context?.eventBus) {
        this.context.eventBus.emit(CLOUD_MODULE_EVENTS.MODULE_STARTED, { status: 'ready', blueprintId: this.blueprintId }, this.id);
      }

      this.status.set(ModuleStatus.RUNNING);
      this.logger.info('[CloudModule]', 'Running');
    } catch (error) {
      this.status.set(ModuleStatus.ERROR);
      this.logger.error('[CloudModule]', 'Ready transition failed', error as Error);
      throw error;
    }
  }

  /**
   * Stop the module
   */
  async stop(): Promise<void> {
    this.logger.info('[CloudModule]', 'Stopping...');
    this.status.set(ModuleStatus.STOPPING);

    try {
      // Clear service state
      this.cloudService.clearState();

      // Emit module stopped event
      if (this.context?.eventBus) {
        this.context.eventBus.emit(CLOUD_MODULE_EVENTS.MODULE_STOPPED, { blueprintId: this.blueprintId }, this.id);
      }

      this.status.set(ModuleStatus.STOPPED);
      this.logger.info('[CloudModule]', 'Stopped successfully');
    } catch (error) {
      this.status.set(ModuleStatus.ERROR);
      this.logger.error('[CloudModule]', 'Stop failed', error as Error);
      throw error;
    }
  }

  /**
   * Dispose of the module
   */
  async dispose(): Promise<void> {
    this.logger.info('[CloudModule]', 'Disposing...');

    try {
      // Unsubscribe from events
      this.unsubscribeFromEvents();

      // Clear all state
      this.cloudService.clearState();
      this.context = undefined;
      this.blueprintId = undefined;

      this.status.set(ModuleStatus.DISPOSED);
      this.logger.info('[CloudModule]', 'Disposed successfully');
    } catch (error) {
      this.status.set(ModuleStatus.ERROR);
      this.logger.error('[CloudModule]', 'Dispose failed', error as Error);
      throw error;
    }
  }

  /**
   * Validate module dependencies
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private validateDependencies(_context: IExecutionContext): void {
    // Cloud module has no dependencies
    this.logger.debug('[CloudModule]', 'Dependencies validated');
  }

  /**
   * Subscribe to module events
   */
  private subscribeToEvents(context: IExecutionContext): void {
    if (!context.eventBus) {
      this.logger.warn('[CloudModule]', 'EventBus not available in context');
      return;
    }

    const eventBus = context.eventBus;

    // Subscribe to file upload events
    this.eventUnsubscribers.push(
      eventBus.on<Record<string, unknown>>(CLOUD_MODULE_EVENTS.FILE_UPLOADED, event => {
        this.logger.info('[CloudModule]', 'File uploaded event received', event.payload);
      })
    );

    // Subscribe to file download events
    this.eventUnsubscribers.push(
      eventBus.on<Record<string, unknown>>(CLOUD_MODULE_EVENTS.FILE_DOWNLOADED, event => {
        this.logger.info('[CloudModule]', 'File downloaded event received', event.payload);
      })
    );

    // Subscribe to file delete events
    this.eventUnsubscribers.push(
      eventBus.on<Record<string, unknown>>(CLOUD_MODULE_EVENTS.FILE_DELETED, event => {
        this.logger.info('[CloudModule]', 'File deleted event received', event.payload);
      })
    );

    // Subscribe to backup events
    this.eventUnsubscribers.push(
      eventBus.on<Record<string, unknown>>(CLOUD_MODULE_EVENTS.BACKUP_CREATED, event => {
        this.logger.info('[CloudModule]', 'Backup created event received', event.payload);
      })
    );

    this.eventUnsubscribers.push(
      eventBus.on<Record<string, unknown>>(CLOUD_MODULE_EVENTS.BACKUP_RESTORED, event => {
        this.logger.info('[CloudModule]', 'Backup restored event received', event.payload);
      })
    );

    // Subscribe to error events
    this.eventUnsubscribers.push(
      eventBus.on<Record<string, unknown>>(CLOUD_MODULE_EVENTS.ERROR_OCCURRED, event => {
        this.logger.error('[CloudModule]', 'Error event received', new Error(JSON.stringify(event.payload)));
      })
    );

    this.logger.debug('[CloudModule]', `Subscribed to ${this.eventUnsubscribers.length} events`);
  }

  /**
   * Unsubscribe from events
   */
  private unsubscribeFromEvents(): void {
    // Clean up event subscriptions
    this.eventUnsubscribers.forEach(unsubscribe => unsubscribe());
    this.eventUnsubscribers = [];
    this.logger.debug('[CloudModule]', 'Unsubscribed from all events');
  }

  /**
   * Register module exports
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private registerExports(_context: IExecutionContext): void {
    // Exports are available via the exports property
    this.logger.debug('[CloudModule]', 'Module exports registered');
  }
}
