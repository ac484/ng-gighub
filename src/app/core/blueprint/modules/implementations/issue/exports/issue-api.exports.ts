/**
 * Issue Module - Public API Interface
 *
 * Defines the public API contract that other modules will use
 * to interact with the Issue Module via Event Bus.
 *
 * @author GigHub Development Team
 * @date 2025-12-15
 */

import type {
  Issue,
  CreateIssueData,
  UpdateIssueData,
  IssueFromAcceptanceParams,
  IssueFromQCParams,
  IssueFromWarrantyParams,
  IssueFromSafetyParams,
  IssueResolution,
  IssueVerification,
  IssueStatistics,
  IssueFilters,
  IssueStatus
} from '../models';

/**
 * Main Issue Module API
 * Provides access to all Issue Module capabilities
 */
export interface IIssueModuleApi {
  /** Issue management (CRUD) */
  management: IIssueManagementApi;
  /** Issue creation (auto-creation from sources) */
  creation: IIssueCreationApi;
  /** Issue resolution (problem fixing) */
  resolution: IIssueResolutionApi;
  /** Issue verification (quality check) */
  verification: IIssueVerificationApi;
  /** Issue lifecycle management */
  lifecycle: IIssueLifecycleApi;
  /** Issue events */
  events: IIssueEventApi;
}

/**
 * Issue Management API (CRUD operations)
 */
export interface IIssueManagementApi {
  /**
   * Create a new issue manually
   *
   * @param data Issue creation data
   * @returns Created issue
   */
  createIssue(data: CreateIssueData): Promise<Issue>;

  /**
   * Get an issue by ID
   *
   * @param issueId Issue ID
   * @returns Issue or null if not found
   */
  getIssue(issueId: string): Promise<Issue | null>;

  /**
   * List issues for a blueprint
   *
   * @param blueprintId Blueprint ID
   * @param filters Optional filters
   * @returns List of issues
   */
  listIssues(blueprintId: string, filters?: IssueFilters): Promise<Issue[]>;

  /**
   * Get issue statistics for a blueprint
   *
   * @param blueprintId Blueprint ID
   * @returns Issue statistics
   */
  getIssueStatistics(blueprintId: string): Promise<IssueStatistics>;

  /**
   * Update an issue
   *
   * @param issueId Issue ID
   * @param data Update data
   * @returns Updated issue
   */
  updateIssue(issueId: string, data: UpdateIssueData): Promise<Issue>;

  /**
   * Assign an issue to a user
   *
   * @param issueId Issue ID
   * @param assignedTo User ID to assign
   * @returns Updated issue
   */
  assignIssue(issueId: string, assignedTo: string): Promise<Issue>;

  /**
   * Delete an issue
   *
   * @param issueId Issue ID
   */
  deleteIssue(issueId: string): Promise<void>;
}

/**
 * Issue Creation API (Auto-creation from multiple sources)
 */
export interface IIssueCreationApi {
  /**
   * Auto-create issues from acceptance failure
   *
   * @param params Acceptance failure parameters
   * @returns Created issues
   */
  autoCreateFromAcceptance(params: IssueFromAcceptanceParams): Promise<Issue[]>;

  /**
   * Auto-create issues from QC failure
   *
   * @param params QC failure parameters
   * @returns Created issues
   */
  autoCreateFromQC(params: IssueFromQCParams): Promise<Issue[]>;

  /**
   * Auto-create issue from warranty defect
   *
   * @param params Warranty defect parameters
   * @returns Created issue
   */
  autoCreateFromWarranty(params: IssueFromWarrantyParams): Promise<Issue>;

  /**
   * Auto-create issue from safety incident
   *
   * @param params Safety incident parameters
   * @returns Created issue
   */
  autoCreateFromSafety(params: IssueFromSafetyParams): Promise<Issue>;
}

/**
 * Issue Resolution API (Problem fixing workflows)
 */
export interface IIssueResolutionApi {
  /**
   * Resolve an issue
   *
   * @param issueId Issue ID
   * @param resolution Resolution details
   * @returns Updated issue
   */
  resolveIssue(issueId: string, resolution: IssueResolution): Promise<Issue>;

  /**
   * Reopen an issue
   *
   * @param issueId Issue ID
   * @param reason Reason for reopening
   * @returns Updated issue
   */
  reopenIssue(issueId: string, reason: string): Promise<Issue>;
}

/**
 * Issue Verification API (Quality verification workflows)
 */
export interface IIssueVerificationApi {
  /**
   * Verify an issue resolution
   *
   * @param issueId Issue ID
   * @param verification Verification details
   * @returns Updated issue
   */
  verifyIssue(issueId: string, verification: Omit<IssueVerification, 'verifiedAt'>): Promise<Issue>;

  /**
   * Close an issue manually (without verification)
   *
   * @param issueId Issue ID
   * @param userId User ID who closes the issue
   * @param notes Optional closing notes
   * @returns Updated issue
   */
  closeIssue(issueId: string, userId: string, notes?: string): Promise<Issue>;

  /**
   * Reopen a closed issue
   *
   * @param issueId Issue ID
   * @param userId User ID who reopens the issue
   * @param reason Reason for reopening
   * @returns Updated issue
   */
  reopenIssue(issueId: string, userId: string, reason: string): Promise<Issue>;
}

/**
 * Issue Lifecycle API (State management)
 */
export interface IIssueLifecycleApi {
  /**
   * Start progress on an issue
   *
   * @param issueId Issue ID
   * @returns Updated issue
   */
  startProgress(issueId: string): Promise<Issue>;

  /**
   * Mark issue as resolved
   *
   * @param issueId Issue ID
   * @returns Updated issue
   */
  markResolved(issueId: string): Promise<Issue>;

  /**
   * Mark issue as verified
   *
   * @param issueId Issue ID
   * @returns Updated issue
   */
  markVerified(issueId: string): Promise<Issue>;

  /**
   * Close an issue
   *
   * @param issueId Issue ID
   * @returns Updated issue
   */
  closeIssue(issueId: string): Promise<Issue>;

  /**
   * Get lifecycle history for an issue
   *
   * @param issueId Issue ID
   * @returns Lifecycle history entries
   */
  getLifecycleHistory(issueId: string): Promise<
    Array<{
      status: string;
      timestamp: Date;
      userId: string;
      notes?: string;
    }>
  >;

  /**
   * Check if status transition is valid
   *
   * @param currentStatus Current issue status
   * @param targetStatus Target status
   * @returns True if transition is valid
   */
  canTransitionTo(currentStatus: IssueStatus, targetStatus: IssueStatus): boolean;

  /**
   * Get next possible statuses for an issue
   *
   * @param currentStatus Current issue status
   * @returns Array of valid next statuses
   */
  getNextPossibleStatuses(currentStatus: IssueStatus): IssueStatus[];

  /**
   * Get progress percentage for a status
   *
   * @param status Issue status
   * @returns Progress percentage (0-100)
   */
  getProgressPercentage(status: IssueStatus): number;

  /**
   * Check if issue can be edited
   *
   * @param issue Issue to check
   * @returns True if issue can be edited
   */
  canEdit(issue: Issue): boolean;

  /**
   * Check if issue can be deleted
   *
   * @param issue Issue to check
   * @returns True if issue can be deleted
   */
  canDelete(issue: Issue): boolean;
}

/**
 * Issue Event API (Event subscription and emission)
 */
export interface IIssueEventApi {
  /**
   * Subscribe to an issue event
   *
   * @param eventType Type of event to listen for
   * @param handler Event handler function
   * @returns Unsubscribe function
   */
  on<T>(eventType: string, handler: (data: T) => void): () => void;

  /**
   * Subscribe to an issue event once
   *
   * @param eventType Type of event to listen for
   * @param handler Event handler function
   * @returns Unsubscribe function
   */
  once<T>(eventType: string, handler: (data: T) => void): () => void;

  /**
   * Emit an issue event
   *
   * @param eventType Type of event to emit
   * @param data Event payload
   */
  emit(eventType: string, data: unknown): void;
}
