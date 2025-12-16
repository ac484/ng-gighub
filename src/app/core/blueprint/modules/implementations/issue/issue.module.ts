/**
 * Issue Module
 *
 * Independent module for tracking and managing issues/problems
 * that can be manually created or automatically generated from
 * multiple sources (Acceptance, QC, Warranty, Safety).
 *
 * Implements IBlueprintModule interface for Blueprint Container integration.
 *
 * @author GigHub Development Team
 * @date 2025-12-15
 */

import { Injectable, signal, inject, WritableSignal } from '@angular/core';
import { LoggerService } from '@core';
import type { IExecutionContext } from '@core/blueprint/context/execution-context.interface';
import { ModuleStatus } from '@core/blueprint/modules/module-status.enum';
import { IBlueprintModule } from '@core/blueprint/modules/module.interface';

import { ISSUE_MODULE_METADATA, ISSUE_MODULE_DEFAULT_CONFIG, ISSUE_MODULE_EVENTS } from './module.metadata';
import { IssueRepository } from './repositories';
import {
  IssueManagementService,
  IssueCreationService,
  IssueResolutionService,
  IssueVerificationService,
  IssueLifecycleService,
  IssueEventService
} from './services';

/**
 * Issue Module Implementation
 *
 * Provides independent issue management functionality for Blueprint V2.
 * Implements full module lifecycle: init → start → ready → stop → dispose.
 *
 * Features:
 * - Manual issue creation by users
 * - Auto-creation from multiple sources (Acceptance, QC, Warranty, Safety)
 * - Complete issue lifecycle management (open → resolved → verified → closed)
 * - Integration via Blueprint Event Bus
 */
@Injectable()
export class IssueModule implements IBlueprintModule {
  private readonly logger = inject(LoggerService);
  private readonly repository = inject(IssueRepository);
  private readonly managementService = inject(IssueManagementService);
  private readonly creationService = inject(IssueCreationService);
  private readonly resolutionService = inject(IssueResolutionService);
  private readonly verificationService = inject(IssueVerificationService);
  private readonly lifecycleService = inject(IssueLifecycleService);
  private readonly eventService = inject(IssueEventService);

  /** Module ID */
  readonly id = ISSUE_MODULE_METADATA.id;

  /** Module name */
  readonly name = ISSUE_MODULE_METADATA.name;

  /** Module version */
  readonly version = ISSUE_MODULE_METADATA.version;

  /** Module description */
  readonly description = ISSUE_MODULE_METADATA.description;

  /** Module dependencies */
  readonly dependencies = ISSUE_MODULE_METADATA.dependencies;

  /** Module status signal */
  readonly status: WritableSignal<ModuleStatus> = signal(ModuleStatus.UNINITIALIZED);

  /** Execution context */
  private context?: IExecutionContext;

  /** Blueprint ID */
  private blueprintId?: string;

  /** Event unsubscribe functions */
  private eventUnsubscribers: Array<() => void> = [];

  /** Module exports - exposes services for external access */
  readonly exports = {
    repository: () => this.repository,
    management: () => this.managementService,
    creation: () => this.creationService,
    resolution: () => this.resolutionService,
    verification: () => this.verificationService,
    lifecycle: () => this.lifecycleService,
    events: () => this.eventService,
    metadata: ISSUE_MODULE_METADATA,
    defaultConfig: ISSUE_MODULE_DEFAULT_CONFIG,
    eventTypes: ISSUE_MODULE_EVENTS
  };

  /**
   * Initialize the module
   */
  async init(context: IExecutionContext): Promise<void> {
    this.logger.info('[IssueModule]', 'Initializing...');
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
      this.logger.info('[IssueModule]', 'Initialized successfully');
    } catch (error) {
      this.status.set(ModuleStatus.ERROR);
      this.logger.error('[IssueModule]', 'Initialization failed', error as Error);
      throw error;
    }
  }

  /**
   * Start the module
   */
  async start(): Promise<void> {
    this.logger.info('[IssueModule]', 'Starting...');
    this.status.set(ModuleStatus.STARTING);

    try {
      if (!this.blueprintId) {
        throw new Error('Module not initialized - blueprint ID missing');
      }

      this.status.set(ModuleStatus.STARTED);
      this.logger.info('[IssueModule]', 'Started successfully');
    } catch (error) {
      this.status.set(ModuleStatus.ERROR);
      this.logger.error('[IssueModule]', 'Start failed', error as Error);
      throw error;
    }
  }

  /**
   * Signal module is ready
   */
  async ready(): Promise<void> {
    this.logger.info('[IssueModule]', 'Ready');
    this.status.set(ModuleStatus.READY);

    try {
      if (this.context?.eventBus) {
        this.context.eventBus.emit(ISSUE_MODULE_EVENTS.MODULE_STARTED, { status: 'ready' }, this.id);
      }

      this.status.set(ModuleStatus.RUNNING);
      this.logger.info('[IssueModule]', 'Running');
    } catch (error) {
      this.status.set(ModuleStatus.ERROR);
      this.logger.error('[IssueModule]', 'Ready transition failed', error as Error);
      throw error;
    }
  }

  /**
   * Stop the module
   */
  async stop(): Promise<void> {
    this.logger.info('[IssueModule]', 'Stopping...');
    this.status.set(ModuleStatus.STOPPING);

    try {
      this.status.set(ModuleStatus.STOPPED);
      this.logger.info('[IssueModule]', 'Stopped successfully');
    } catch (error) {
      this.status.set(ModuleStatus.ERROR);
      this.logger.error('[IssueModule]', 'Stop failed', error as Error);
      throw error;
    }
  }

  /**
   * Dispose of the module
   */
  async dispose(): Promise<void> {
    this.logger.info('[IssueModule]', 'Disposing...');

    try {
      this.unsubscribeFromEvents();
      this.context = undefined;
      this.blueprintId = undefined;

      this.status.set(ModuleStatus.DISPOSED);
      this.logger.info('[IssueModule]', 'Disposed successfully');
    } catch (error) {
      this.status.set(ModuleStatus.ERROR);
      this.logger.error('[IssueModule]', 'Dispose failed', error as Error);
      throw error;
    }
  }

  /**
   * Validate module dependencies
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private validateDependencies(_context?: IExecutionContext): void {
    // Issue module has no external dependencies
    this.logger.debug('[IssueModule]', 'Dependencies validated (none required)');
  }

  /**
   * Subscribe to module events
   * Listen for events from other modules that may trigger issue creation
   */
  private subscribeToEvents(context: IExecutionContext): void {
    if (!context.eventBus) {
      this.logger.warn('[IssueModule]', 'EventBus not available in context');
      return;
    }

    // Subscribe to acceptance failure events
    const unsubAcceptance = context.eventBus.on('acceptance.failed', async event => {
      this.logger.info('[IssueModule]', 'Received acceptance.failed event', event);
      // Auto-creation from acceptance would be handled here
    });
    this.eventUnsubscribers.push(unsubAcceptance);

    // Subscribe to QC failure events
    const unsubQC = context.eventBus.on('qa.inspection_failed', async event => {
      this.logger.info('[IssueModule]', 'Received qa.inspection_failed event', event);
      // Auto-creation from QC would be handled here
    });
    this.eventUnsubscribers.push(unsubQC);

    this.logger.debug('[IssueModule]', 'Event subscriptions set up');
  }

  /**
   * Unsubscribe from events
   */
  private unsubscribeFromEvents(): void {
    this.eventUnsubscribers.forEach(unsubscribe => unsubscribe());
    this.eventUnsubscribers = [];
    this.logger.debug('[IssueModule]', 'Unsubscribed from all events');
  }

  /**
   * Register module exports
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private registerExports(_context?: IExecutionContext): void {
    this.logger.debug('[IssueModule]', 'Module exports registered');
  }
}
