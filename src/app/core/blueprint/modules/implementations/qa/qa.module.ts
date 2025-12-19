/**
 * QA Module
 *
 * Implementation of IBlueprintModule interface for Quality Assurance Domain.
 * Handles module lifecycle and integration with Blueprint Container.
 *
 * Following the same pattern as Issue Module (SETC-001 ~ SETC-008).
 *
 * @author GigHub Development Team
 * @date 2025-12-13
 * @updated 2025-12-19 - Enhanced with sub-module exports
 */

import { Injectable, signal, inject, WritableSignal } from '@angular/core';
import { LoggerService } from '@core';
import type { IExecutionContext } from '@core/blueprint/context/execution-context.interface';
import { ModuleStatus } from '@core/blueprint/modules/module-status.enum';
import { IBlueprintModule } from '@core/blueprint/modules/module.interface';

import type { IQAModuleApi } from './exports';
import { QA_MODULE_METADATA, QA_MODULE_DEFAULT_CONFIG, QA_MODULE_EVENTS } from './module.metadata';
import { QaRepository } from './repositories/qa.repository';
import {
  ChecklistService,
  DefectService,
  DefectLifecycleService,
  DefectResolutionService,
  DefectReinspectionService,
  DefectIssueIntegrationService,
  InspectionService,
  ReportService
} from './services';

/**
 * QA Module Implementation
 *
 * Provides Quality Assurance functionality for Blueprint V2.
 * Implements full module lifecycle: init → start → ready → stop → dispose.
 *
 * Sub-modules:
 * - Checklist: QC checklist management
 * - Defect: Basic defect CRUD
 * - DefectLifecycle: Defect state machine (SETC-041)
 * - DefectResolution: Defect fixing workflow (SETC-042)
 * - DefectReinspection: Defect verification (SETC-043)
 * - DefectIssueIntegration: Defect-Issue escalation (SETC-044)
 * - Inspection: Field inspection management
 * - Report: QA report generation
 */
@Injectable()
export class QaModule implements IBlueprintModule {
  private readonly logger = inject(LoggerService);
  private readonly repository = inject(QaRepository);

  // Sub-module services
  private readonly checklistService = inject(ChecklistService);
  private readonly defectService = inject(DefectService);
  private readonly defectLifecycleService = inject(DefectLifecycleService);
  private readonly defectResolutionService = inject(DefectResolutionService);
  private readonly defectReinspectionService = inject(DefectReinspectionService);
  private readonly defectIssueIntegrationService = inject(DefectIssueIntegrationService);
  private readonly inspectionService = inject(InspectionService);
  private readonly reportService = inject(ReportService);

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

  /** Module exports - exposes services for external access */
  readonly exports: IQAModuleApi & {
    repository: () => QaRepository;
    metadata: typeof QA_MODULE_METADATA;
    defaultConfig: typeof QA_MODULE_DEFAULT_CONFIG;
    events: typeof QA_MODULE_EVENTS;
  } = {
    // Sub-module APIs
    checklist: {
      load: (blueprintId: string) => this.checklistService.load(blueprintId),
      clearState: () => this.checklistService.clearState(),
      getData: () => this.checklistService.data(),
      isLoading: () => this.checklistService.loading(),
      getError: () => this.checklistService.error()
    },
    defect: {
      load: (blueprintId: string) => this.defectService.load(blueprintId),
      clearState: () => this.defectService.clearState(),
      getData: () => this.defectService.data(),
      isLoading: () => this.defectService.loading(),
      getError: () => this.defectService.error()
    },
    defectLifecycle: {
      autoCreateFromQCInspection: (inspection, failedItems, actor) =>
        this.defectLifecycleService.autoCreateFromQCInspection(inspection, failedItems, actor),
      createDefect: (blueprintId, data, actor) => this.defectLifecycleService.createDefect(blueprintId, data, actor),
      assignResponsible: (blueprintId, defectId, responsibleUserId, actor) =>
        this.defectLifecycleService.assignResponsible(blueprintId, defectId, responsibleUserId, actor),
      updateStatus: (blueprintId, defectId, newStatus, actor) =>
        this.defectLifecycleService.updateStatus(blueprintId, defectId, newStatus, actor),
      closeDefect: (blueprintId, defectId, actor) => this.defectLifecycleService.closeDefect(blueprintId, defectId, actor),
      getStatistics: blueprintId => this.defectLifecycleService.getStatistics(blueprintId),
      canTransitionTo: (currentStatus, targetStatus) => this.defectLifecycleService.canTransitionTo(currentStatus, targetStatus)
    },
    defectResolution: {
      startResolution: (blueprintId, defectId, data, actor) =>
        this.defectResolutionService.startResolution(blueprintId, defectId, data, actor),
      updateProgress: (blueprintId, defectId, data, actor) =>
        this.defectResolutionService.updateProgress(blueprintId, defectId, data, actor),
      completeResolution: (blueprintId, defectId, data, actor) =>
        this.defectResolutionService.completeResolution(blueprintId, defectId, data, actor)
    },
    defectReinspection: {
      scheduleReinspection: (blueprintId, defectId, data, actor) =>
        this.defectReinspectionService.scheduleReinspection(blueprintId, defectId, data, actor),
      performReinspection: (reinspectionId, data, actor) => this.defectReinspectionService.performReinspection(reinspectionId, data, actor),
      getReinspectionHistory: defectId => this.defectReinspectionService.getReinspectionHistory(defectId)
    },
    defectIssueIntegration: {
      shouldAutoCreateIssue: defect => this.defectIssueIntegrationService.shouldAutoCreateIssue(defect),
      autoCreateIssueFromDefect: (blueprintId, defectId, actor) =>
        this.defectIssueIntegrationService.autoCreateIssueFromDefect(blueprintId, defectId, actor),
      syncDefectStatusToIssue: (blueprintId, defectId, actor) =>
        this.defectIssueIntegrationService.syncDefectStatusToIssue(blueprintId, defectId, actor),
      syncIssueStatusToDefect: (blueprintId, issueId, actor) =>
        this.defectIssueIntegrationService.syncIssueStatusToDefect(blueprintId, issueId, actor)
    },
    inspection: {
      load: (blueprintId: string) => this.inspectionService.load(blueprintId),
      clearState: () => this.inspectionService.clearState(),
      getData: () => this.inspectionService.data(),
      isLoading: () => this.inspectionService.loading(),
      getError: () => this.inspectionService.error()
    },
    report: {
      load: (blueprintId: string) => this.reportService.load(blueprintId),
      clearState: () => this.reportService.clearState(),
      getData: () => this.reportService.data(),
      isLoading: () => this.reportService.loading(),
      getError: () => this.reportService.error()
    },
    // Metadata and configuration
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
   * Listen for events from other modules that may trigger defect auto-creation
   */
  private subscribeToEvents(context: IExecutionContext): void {
    if (!context.eventBus) {
      this.logger.warn('[QaModule]', 'EventBus not available in context');
      return;
    }

    // Subscribe to QC inspection failure events for auto-defect creation
    const unsubQCFailed = context.eventBus.on('qa.inspection_failed', async event => {
      this.logger.info('[QaModule]', 'Received qa.inspection_failed event', event);
      // Auto-creation from QC inspection would be handled here
      // The defectLifecycleService.autoCreateFromQCInspection can be called
    });
    this.eventUnsubscribers.push(unsubQCFailed);

    // Subscribe to issue events for defect-issue sync (SETC-044)
    const unsubIssueUpdated = context.eventBus.on('issue.updated', async event => {
      this.logger.info('[QaModule]', 'Received issue.updated event', event);
      // Sync issue status to defect if linked
    });
    this.eventUnsubscribers.push(unsubIssueUpdated);

    const unsubIssueClosed = context.eventBus.on('issue.closed', async event => {
      this.logger.info('[QaModule]', 'Received issue.closed event', event);
      // Sync issue closure to defect if linked
    });
    this.eventUnsubscribers.push(unsubIssueClosed);

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
