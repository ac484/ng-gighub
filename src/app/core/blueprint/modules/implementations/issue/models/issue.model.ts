/**
 * Issue Module - Core Data Models
 *
 * Defines the domain models for the independent Issue tracking system.
 * Supports multiple sources: manual, acceptance, qc, warranty, safety
 *
 * @author GigHub Development Team
 * @date 2025-12-15
 */

/**
 * Source of the Issue
 * - manual: Created directly by users
 * - acceptance: Auto-created from acceptance failures
 * - qc: Auto-created from QC inspection failures
 * - warranty: Auto-created from warranty defects
 * - safety: Auto-created from safety incidents
 */
export type IssueSource = 'manual' | 'acceptance' | 'qc' | 'warranty' | 'safety';

/**
 * Severity level of the Issue
 */
export type IssueSeverity = 'critical' | 'major' | 'minor';

/**
 * Category of the Issue
 */
export type IssueCategory = 'quality' | 'safety' | 'warranty' | 'other';

/**
 * Status of the Issue through its lifecycle
 */
export type IssueStatus = 'open' | 'in_progress' | 'resolved' | 'verified' | 'closed';

/**
 * Verification result type
 */
export type VerificationResult = 'approved' | 'rejected';

/**
 * Resolution details for an Issue
 */
export interface IssueResolution {
  /** Resolution method used */
  resolutionMethod: string;
  /** Date of resolution */
  resolutionDate: Date;
  /** User who resolved the issue */
  resolvedBy: string;
  /** Cost of resolution (optional) */
  cost?: number;
  /** Additional notes */
  notes: string;
  /** Evidence photos */
  evidencePhotos: string[];
}

/**
 * Verification details for an Issue
 */
export interface IssueVerification {
  /** User who verified */
  verifiedBy: string;
  /** Verification timestamp */
  verifiedAt: Date;
  /** Verification result */
  result: VerificationResult;
  /** Verification notes */
  notes: string;
  /** Verification photos */
  verificationPhotos: string[];
}

/**
 * Main Issue interface
 * Represents a problem that needs tracking and resolution
 */
export interface Issue {
  /** Unique identifier */
  id: string;
  /** Blueprint this issue belongs to */
  blueprintId: string;
  /** Human-readable issue number (e.g., ISS-0001) */
  issueNumber: string;

  /** Source of the issue */
  source: IssueSource;
  /** Source record ID (null for manual creation) */
  sourceId: string | null;

  /** Issue title */
  title: string;
  /** Detailed description */
  description: string;
  /** Physical location */
  location: string;
  /** Severity level */
  severity: IssueSeverity;
  /** Category classification */
  category: IssueCategory;

  /** Party responsible for fixing */
  responsibleParty: string;
  /** Assigned user (optional) */
  assignedTo?: string;

  /** Resolution data (when resolved) */
  resolution?: IssueResolution;
  /** Verification data (when verified) */
  verification?: IssueVerification;

  /** Current status */
  status: IssueStatus;

  /** Photos taken before fix */
  beforePhotos: string[];
  /** Photos taken after fix */
  afterPhotos: string[];

  /** User who created the issue */
  createdBy: string;
  /** Creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
  /** Resolution timestamp */
  resolvedAt?: Date;
  /** Closure timestamp */
  closedAt?: Date;
}

/**
 * Parameters for creating an Issue manually
 */
export interface CreateIssueData {
  blueprintId: string;
  title: string;
  description: string;
  location: string;
  severity: IssueSeverity;
  category: IssueCategory;
  responsibleParty: string;
  assignedTo?: string;
  beforePhotos?: string[];
  createdBy: string;
}

/**
 * Parameters for updating an Issue
 */
export interface UpdateIssueData {
  title?: string;
  description?: string;
  location?: string;
  severity?: IssueSeverity;
  category?: IssueCategory;
  responsibleParty?: string;
  assignedTo?: string;
  status?: IssueStatus;
  beforePhotos?: string[];
  afterPhotos?: string[];
}

/**
 * Parameters for auto-creating Issues from Acceptance failures
 */
export interface IssueFromAcceptanceParams {
  acceptanceId: string;
  blueprintId: string;
  failedItems: Array<{
    itemName: string;
    location: string;
    notes?: string;
    photos?: string[];
  }>;
  contractorId: string;
  inspectorId: string;
}

/**
 * Parameters for auto-creating Issues from QC failures
 */
export interface IssueFromQCParams {
  inspectionId: string;
  blueprintId: string;
  failedItems: Array<{
    itemName: string;
    location: string;
    notes?: string;
    photos?: string[];
  }>;
  contractorId: string;
  inspectorId: string;
}

/**
 * Parameters for auto-creating Issues from Warranty defects
 */
export interface IssueFromWarrantyParams {
  warrantyDefectId: string;
  blueprintId: string;
  title: string;
  description: string;
  location: string;
  severity: IssueSeverity;
  photos?: string[];
  warrantor: string;
  reportedBy: string;
}

/**
 * Parameters for auto-creating Issues from Safety incidents
 */
export interface IssueFromSafetyParams {
  incidentId: string;
  blueprintId: string;
  title: string;
  description: string;
  location: string;
  severity: IssueSeverity;
  photos?: string[];
  responsibleParty: string;
  reportedBy: string;
}

/**
 * Issue statistics for reporting
 */
export interface IssueStatistics {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  verified: number;
  closed: number;
  bySeverity: {
    critical: number;
    major: number;
    minor: number;
  };
  bySource: {
    manual: number;
    acceptance: number;
    qc: number;
    warranty: number;
    safety: number;
  };
}

/**
 * Filters for querying Issues
 */
export interface IssueFilters {
  status?: IssueStatus[];
  severity?: IssueSeverity[];
  category?: IssueCategory[];
  source?: IssueSource[];
  responsibleParty?: string;
  assignedTo?: string;
  createdAfter?: Date;
  createdBefore?: Date;
  limit?: number;
}
