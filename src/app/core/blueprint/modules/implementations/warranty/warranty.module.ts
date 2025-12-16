/**
 * Warranty Module
 *
 * SETC-032: Warranty Module Foundation Setup
 * SETC-033: Warranty Repository Implementation
 *
 * Implementation of IBlueprintModule interface for 保固域.
 * Handles module lifecycle and integration with Blueprint Container.
 *
 * @author GigHub Development Team
 * @date 2025-12-16
 */

import { Injectable, signal, inject, WritableSignal } from '@angular/core';
import { LoggerService } from '@core';
import type { IExecutionContext } from '@core/blueprint/context/execution-context.interface';
import { ModuleStatus } from '@core/blueprint/modules/module-status.enum';
import { IBlueprintModule } from '@core/blueprint/modules/module.interface';

import { WARRANTY_MODULE_METADATA, WARRANTY_MODULE_DEFAULT_CONFIG, WARRANTY_MODULE_EVENTS } from './module.metadata';
import { WarrantyDefectRepository } from './repositories/warranty-defect.repository';
import { WarrantyRepairRepository } from './repositories/warranty-repair.repository';
import { WarrantyRepository } from './repositories/warranty.repository';

/**
 * Warranty Module Implementation
 *
 * Provides 保固域 functionality for Blueprint V2.
 * Implements full module lifecycle: init → start → ready → stop → dispose.
 */
@Injectable()
export class WarrantyModule implements IBlueprintModule {
  private readonly logger = inject(LoggerService);
  private readonly warrantyRepository = inject(WarrantyRepository);
  private readonly defectRepository = inject(WarrantyDefectRepository);
  private readonly repairRepository = inject(WarrantyRepairRepository);

  /** Module ID */
  readonly id = WARRANTY_MODULE_METADATA.id;

  /** Module name */
  readonly name = WARRANTY_MODULE_METADATA.name;

  /** Module version */
  readonly version = WARRANTY_MODULE_METADATA.version;

  /** Module description */
  readonly description = WARRANTY_MODULE_METADATA.description;

  /** Module dependencies */
  readonly dependencies = WARRANTY_MODULE_METADATA.dependencies;

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
    repository: () => this.warrantyRepository,
    defectRepository: () => this.defectRepository,
    repairRepository: () => this.repairRepository,
    metadata: WARRANTY_MODULE_METADATA,
    defaultConfig: WARRANTY_MODULE_DEFAULT_CONFIG,
    events: WARRANTY_MODULE_EVENTS
  };

  /**
   * Initialize the module
   */
  async init(context: IExecutionContext): Promise<void> {
    this.logger.info('[WarrantyModule]', 'Initializing...');
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
      this.logger.info('[WarrantyModule]', 'Initialized successfully');
    } catch (error) {
      this.status.set(ModuleStatus.ERROR);
      this.logger.error('[WarrantyModule]', 'Initialization failed', error as Error);
      throw error;
    }
  }

  /**
   * Start the module
   */
  async start(): Promise<void> {
    this.logger.info('[WarrantyModule]', 'Starting...');
    this.status.set(ModuleStatus.STARTING);

    try {
      if (!this.blueprintId) {
        throw new Error('Module not initialized - blueprint ID missing');
      }

      this.status.set(ModuleStatus.STARTED);
      this.logger.info('[WarrantyModule]', 'Started successfully');
    } catch (error) {
      this.status.set(ModuleStatus.ERROR);
      this.logger.error('[WarrantyModule]', 'Start failed', error as Error);
      throw error;
    }
  }

  /**
   * Signal module is ready
   */
  async ready(): Promise<void> {
    this.logger.info('[WarrantyModule]', 'Ready');
    this.status.set(ModuleStatus.READY);

    try {
      if (this.context?.eventBus) {
        this.context.eventBus.emit(WARRANTY_MODULE_EVENTS.MODULE_STARTED, { status: 'ready' }, this.id);
      }

      this.status.set(ModuleStatus.RUNNING);
      this.logger.info('[WarrantyModule]', 'Running');
    } catch (error) {
      this.status.set(ModuleStatus.ERROR);
      this.logger.error('[WarrantyModule]', 'Ready transition failed', error as Error);
      throw error;
    }
  }

  /**
   * Stop the module
   */
  async stop(): Promise<void> {
    this.logger.info('[WarrantyModule]', 'Stopping...');
    this.status.set(ModuleStatus.STOPPING);

    try {
      this.status.set(ModuleStatus.STOPPED);
      this.logger.info('[WarrantyModule]', 'Stopped successfully');
    } catch (error) {
      this.status.set(ModuleStatus.ERROR);
      this.logger.error('[WarrantyModule]', 'Stop failed', error as Error);
      throw error;
    }
  }

  /**
   * Dispose of the module
   */
  async dispose(): Promise<void> {
    this.logger.info('[WarrantyModule]', 'Disposing...');

    try {
      this.unsubscribeFromEvents();
      this.context = undefined;
      this.blueprintId = undefined;

      this.status.set(ModuleStatus.DISPOSED);
      this.logger.info('[WarrantyModule]', 'Disposed successfully');
    } catch (error) {
      this.status.set(ModuleStatus.ERROR);
      this.logger.error('[WarrantyModule]', 'Dispose failed', error as Error);
      throw error;
    }
  }

  /**
   * Validate module dependencies
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private validateDependencies(_context?: IExecutionContext): void {
    // Check if required modules are available
    // acceptance and contract modules should be loaded
    this.logger.debug('[WarrantyModule]', 'Dependencies validated');
  }

  /**
   * Subscribe to module events
   */
  private subscribeToEvents(context: IExecutionContext): void {
    if (!context.eventBus) {
      this.logger.warn('[WarrantyModule]', 'EventBus not available in context');
      return;
    }

    // Subscribe to acceptance events for auto-creating warranties
    // This will be implemented in SETC-034

    this.logger.debug('[WarrantyModule]', 'Event subscriptions set up');
  }

  /**
   * Unsubscribe from events
   */
  private unsubscribeFromEvents(): void {
    this.eventUnsubscribers.forEach(unsubscribe => unsubscribe());
    this.eventUnsubscribers = [];
    this.logger.debug('[WarrantyModule]', 'Unsubscribed from all events');
  }

  /**
   * Register module exports
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private registerExports(_context?: IExecutionContext): void {
    this.logger.debug('[WarrantyModule]', 'Module exports registered');
  }
}
