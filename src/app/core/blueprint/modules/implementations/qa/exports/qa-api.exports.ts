/**
 * QA Module - Public API Interface
 *
 * Defines the public API contract that other modules will use
 * to interact with the QA Module via Event Bus.
 *
 * Following the same pattern as Issue Module (SETC-001 ~ SETC-008).
 *
 * @author GigHub Development Team
 * @date 2025-12-19
 */

import type {
  QADefect,
  DefectSeverity,
  DefectStatus,
  DefectCategory,
  DefectStatistics,
  QAQueryOptions,
  CreateQADefectData,
  UpdateQADefectData,
  EventActor
} from '../models';
import type { ScheduleReinspectionDto, PerformReinspectionDto } from '../services/defect-reinspection.service';
import type { StartResolutionDto, UpdateProgressDto, CompleteResolutionDto } from '../services/defect-resolution.service';

/**
 * Main QA Module API
 * Provides access to all QA Module capabilities
 */
export interface IQAModuleApi {
  /** Checklist management */
  checklist: IChecklistApi;
  /** Defect management */
  defect: IDefectApi;
  /** Defect lifecycle management */
  defectLifecycle: IDefectLifecycleApi;
  /** Defect resolution (fixing) */
  defectResolution: IDefectResolutionApi;
  /** Defect reinspection (verification) */
  defectReinspection: IDefectReinspectionApi;
  /** Defect-Issue integration */
  defectIssueIntegration: IDefectIssueIntegrationApi;
  /** Inspection management */
  inspection: IInspectionApi;
  /** QA Report generation */
  report: IReportApi;
}

/**
 * Checklist API
 * Manages QC checklist templates and executions
 */
export interface IChecklistApi {
  /**
   * Load checklist data for a blueprint
   *
   * @param blueprintId Blueprint ID
   */
  load(blueprintId: string): Promise<void>;

  /**
   * Clear checklist state
   */
  clearState(): void;

  /**
   * Get checklist data signal
   */
  getData(): any[];

  /**
   * Get loading state signal
   */
  isLoading(): boolean;

  /**
   * Get error state signal
   */
  getError(): Error | null;
}

/**
 * Defect API
 * Basic defect CRUD operations
 */
export interface IDefectApi {
  /**
   * Load defect data for a blueprint
   *
   * @param blueprintId Blueprint ID
   */
  load(blueprintId: string): Promise<void>;

  /**
   * Clear defect state
   */
  clearState(): void;

  /**
   * Get defect data signal
   */
  getData(): any[];

  /**
   * Get loading state signal
   */
  isLoading(): boolean;

  /**
   * Get error state signal
   */
  getError(): Error | null;
}

/**
 * Defect Lifecycle API (SETC-041)
 * Manages defect lifecycle state machine
 */
export interface IDefectLifecycleApi {
  /**
   * Auto-create defects from QC inspection failures
   *
   * @param inspection QC inspection data
   * @param failedItems Failed inspection items
   * @param actor User performing the action
   * @returns Created defects
   */
  autoCreateFromQCInspection(inspection: any, failedItems: any[], actor: EventActor): Promise<QADefect[]>;

  /**
   * Create a defect manually
   *
   * @param blueprintId Blueprint ID
   * @param data Defect creation data
   * @param actor User creating the defect
   * @returns Created defect
   */
  createDefect(blueprintId: string, data: CreateQADefectData, actor: EventActor): Promise<QADefect>;

  /**
   * Assign a defect to a responsible user
   *
   * @param blueprintId Blueprint ID
   * @param defectId Defect ID
   * @param responsibleUserId User ID to assign
   * @param actor User performing the action
   * @returns Updated defect
   */
  assignResponsible(blueprintId: string, defectId: string, responsibleUserId: string, actor: EventActor): Promise<QADefect>;

  /**
   * Update defect status
   *
   * @param blueprintId Blueprint ID
   * @param defectId Defect ID
   * @param newStatus New status
   * @param actor User performing the action
   * @returns Updated defect
   */
  updateStatus(blueprintId: string, defectId: string, newStatus: DefectStatus, actor: EventActor): Promise<QADefect>;

  /**
   * Close a defect
   *
   * @param blueprintId Blueprint ID
   * @param defectId Defect ID
   * @param actor User performing the action
   * @returns Updated defect
   */
  closeDefect(blueprintId: string, defectId: string, actor: EventActor): Promise<QADefect>;

  /**
   * Get defect statistics for a blueprint
   *
   * @param blueprintId Blueprint ID
   * @returns Defect statistics
   */
  getStatistics(blueprintId: string): Promise<DefectStatistics>;

  /**
   * Check if status transition is valid
   *
   * @param currentStatus Current defect status
   * @param targetStatus Target status
   * @returns True if transition is valid
   */
  canTransitionTo(currentStatus: DefectStatus, targetStatus: DefectStatus): boolean;
}

/**
 * Defect Resolution API (SETC-042)
 * Manages defect fixing workflow
 */
export interface IDefectResolutionApi {
  /**
   * Start defect resolution
   *
   * @param blueprintId Blueprint ID
   * @param defectId Defect ID
   * @param data Resolution start data
   * @param actor User starting resolution
   * @returns Updated defect
   */
  startResolution(blueprintId: string, defectId: string, data: StartResolutionDto, actor: EventActor): Promise<QADefect>;

  /**
   * Update resolution progress
   *
   * @param blueprintId Blueprint ID
   * @param defectId Defect ID
   * @param data Progress update data
   * @param actor User updating progress
   * @returns Updated defect
   */
  updateProgress(blueprintId: string, defectId: string, data: UpdateProgressDto, actor: EventActor): Promise<QADefect>;

  /**
   * Complete defect resolution
   *
   * @param blueprintId Blueprint ID
   * @param defectId Defect ID
   * @param data Resolution completion data
   * @param actor User completing resolution
   * @returns Updated defect
   */
  completeResolution(blueprintId: string, defectId: string, data: CompleteResolutionDto, actor: EventActor): Promise<QADefect>;
}

/**
 * Defect Reinspection API (SETC-043)
 * Manages defect verification after fixing
 */
export interface IDefectReinspectionApi {
  /**
   * Schedule a reinspection for a resolved defect
   *
   * @param blueprintId Blueprint ID
   * @param defectId Defect ID
   * @param data Reinspection schedule data
   * @param actor User scheduling reinspection
   * @returns Reinspection record
   */
  scheduleReinspection(blueprintId: string, defectId: string, data: ScheduleReinspectionDto, actor: EventActor): Promise<any>;

  /**
   * Perform reinspection
   *
   * @param reinspectionId Reinspection ID
   * @param data Reinspection result data
   * @param actor Inspector performing reinspection
   * @returns Updated reinspection record
   */
  performReinspection(reinspectionId: string, data: PerformReinspectionDto, actor: EventActor): Promise<any>;

  /**
   * Get reinspection history for a defect
   *
   * @param defectId Defect ID
   * @returns Reinspection records
   */
  getReinspectionHistory(defectId: string): Promise<any[]>;
}

/**
 * Defect-Issue Integration API (SETC-044)
 * Manages defect-to-issue escalation
 */
export interface IDefectIssueIntegrationApi {
  /**
   * Check if a defect should auto-create an issue
   *
   * @param defect Defect to check
   * @returns True if should auto-create issue
   */
  shouldAutoCreateIssue(defect: QADefect): boolean;

  /**
   * Auto-create an issue from a defect
   *
   * @param blueprintId Blueprint ID
   * @param defectId Defect ID
   * @param actor User creating the issue
   * @returns Created issue ID
   */
  autoCreateIssueFromDefect(blueprintId: string, defectId: string, actor: EventActor): Promise<string>;

  /**
   * Sync defect status to linked issue
   *
   * @param blueprintId Blueprint ID
   * @param defectId Defect ID
   * @param actor User performing sync
   */
  syncDefectStatusToIssue(blueprintId: string, defectId: string, actor: EventActor): Promise<void>;

  /**
   * Sync issue status to linked defect
   *
   * @param blueprintId Blueprint ID
   * @param issueId Issue ID
   * @param actor User performing sync
   */
  syncIssueStatusToDefect(blueprintId: string, issueId: string, actor: EventActor): Promise<void>;
}

/**
 * Inspection API
 * Manages field inspections
 */
export interface IInspectionApi {
  /**
   * Load inspection data for a blueprint
   *
   * @param blueprintId Blueprint ID
   */
  load(blueprintId: string): Promise<void>;

  /**
   * Clear inspection state
   */
  clearState(): void;

  /**
   * Get inspection data signal
   */
  getData(): any[];

  /**
   * Get loading state signal
   */
  isLoading(): boolean;

  /**
   * Get error state signal
   */
  getError(): Error | null;
}

/**
 * Report API
 * Generates and manages QA reports
 */
export interface IReportApi {
  /**
   * Load report data for a blueprint
   *
   * @param blueprintId Blueprint ID
   */
  load(blueprintId: string): Promise<void>;

  /**
   * Clear report state
   */
  clearState(): void;

  /**
   * Get report data signal
   */
  getData(): any[];

  /**
   * Get loading state signal
   */
  isLoading(): boolean;

  /**
   * Get error state signal
   */
  getError(): Error | null;
}
