/**
 * Safety Inspection Models
 *
 * Data models for safety inspection sub-module.
 *
 * @module SafetyInspectionModel
 * @author GigHub Development Team
 * @date 2025-12-13
 */

/**
 * Inspection Status Enum
 */
export enum InspectionStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

/**
 * Inspection Result Enum
 */
export enum InspectionResult {
  PASS = 'pass',
  FAIL = 'fail',
  CONDITIONAL_PASS = 'conditional_pass'
}

/**
 * Inspection Type Enum
 */
export enum InspectionType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  SPECIAL = 'special',
  ACCIDENT_FOLLOW_UP = 'accident_follow_up'
}

/**
 * Safety Inspection Interface
 *
 * Records safety inspections and checks within the system.
 */
export interface SafetyInspection {
  /** Unique identifier */
  id: string;

  /** Blueprint ID */
  blueprintId: string;

  /** Inspection number */
  inspectionNumber: string;

  /** Inspection type */
  type: InspectionType;

  /** Inspection status */
  status: InspectionStatus;

  /** Inspection result */
  result?: InspectionResult;

  /** Inspector user ID */
  inspectorId: string;

  /** Inspector name */
  inspectorName: string;

  /** Scheduled date */
  scheduledDate: Date;

  /** Start time */
  startTime?: Date;

  /** End time */
  endTime?: Date;

  /** Location */
  location: string;

  /** Description */
  description?: string;

  /** Findings - issues discovered */
  findings: InspectionFinding[];

  /** Corrective actions */
  correctiveActions?: string[];

  /** Attachments */
  attachments?: string[];

  /** Metadata */
  metadata?: Record<string, unknown>;

  /** Created by */
  createdBy: string;

  /** Created at */
  createdAt: Date;

  /** Updated at */
  updatedAt: Date;
}

/**
 * Inspection Finding Interface
 */
export interface InspectionFinding {
  /** Finding ID */
  id: string;

  /** Category */
  category: string;

  /** Severity */
  severity: 'low' | 'medium' | 'high' | 'critical';

  /** Description */
  description: string;

  /** Photo URLs */
  photos?: string[];

  /** Recommended action */
  recommendedAction?: string;

  /** Status */
  status: 'open' | 'resolved' | 'deferred';
}

/**
 * Create Safety Inspection Data
 */
export interface CreateSafetyInspectionData {
  blueprintId: string;
  inspectionNumber: string;
  type: InspectionType;
  inspectorId: string;
  inspectorName: string;
  scheduledDate: Date;
  location: string;
  description?: string;
  createdBy: string;
}

/**
 * Update Safety Inspection Data
 */
export interface UpdateSafetyInspectionData {
  status?: InspectionStatus;
  result?: InspectionResult;
  startTime?: Date;
  endTime?: Date;
  location?: string;
  description?: string;
  findings?: InspectionFinding[];
  correctiveActions?: string[];
  attachments?: string[];
  metadata?: Record<string, unknown>;
}

/**
 * Safety Inspection Query Options
 */
export interface SafetyInspectionQueryOptions {
  type?: InspectionType;
  status?: InspectionStatus;
  result?: InspectionResult;
  inspectorId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}
