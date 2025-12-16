/**
 * Blueprint Data Models
 *
 * Firestore persistence models for Blueprint entity.
 * These models represent the structure of documents in Firestore.
 *
 * @see /core/types/blueprint/blueprint.types.ts for domain models
 */

import { Timestamp } from '@angular/fire/firestore';
import { BlueprintStatus } from '@core/types/blueprint/blueprint-status.enum';
import { OwnerType } from '@core/types/blueprint/owner-type.enum';
import { ModuleType } from '@core/types/module/module.types';

/**
 * Blueprint Document Model (Firestore)
 *
 * Represents a Blueprint document stored in Firestore.
 * Includes module configuration and audit trail.
 */
export interface BlueprintDocument {
  /** Document ID (Firestore auto-generated) */
  readonly id?: string;

  /** Blueprint name */
  name: string;

  /** URL-friendly slug */
  slug: string;

  /** Description (optional) */
  description?: string;

  /** Cover image URL (optional) */
  coverUrl?: string;

  // Ownership
  /** Owner ID (user/organization/team) */
  ownerId: string;

  /** Owner type */
  ownerType: OwnerType;

  // Visibility and status
  /** Public visibility flag */
  isPublic: boolean;

  /** Blueprint status */
  status: BlueprintStatus;

  // Module configuration
  /** List of enabled module types */
  enabledModules: ModuleType[];

  /** Blueprint configuration (references config document) */
  config?: BlueprintConfigRef;

  // Metadata
  /** Additional metadata */
  metadata?: Record<string, unknown>;

  // Audit fields
  /** Creator user ID */
  createdBy: string;

  /** Creation timestamp */
  createdAt: Timestamp | Date;

  /** Last update timestamp */
  updatedAt: Timestamp | Date;

  /** Soft delete timestamp (null if not deleted) */
  deletedAt?: Timestamp | Date | null;
}

/**
 * Blueprint Configuration Reference
 *
 * Embedded reference to blueprint configuration.
 * Points to a separate config document for detailed settings.
 */
export interface BlueprintConfigRef {
  /** Config document ID */
  configId: string;

  /** Config version */
  version: string;

  /** Last config update */
  lastUpdated: Timestamp | Date;
}

/**
 * Blueprint Create Request
 *
 * Data required to create a new blueprint in Firestore.
 */
export interface CreateBlueprintData {
  name: string;
  slug: string;
  description?: string;
  coverUrl?: string;
  ownerId: string;
  ownerType: OwnerType;
  isPublic?: boolean;
  enabledModules?: ModuleType[];
  metadata?: Record<string, unknown>;
  createdBy: string;
}

/**
 * Blueprint Update Data
 *
 * Partial update data for blueprint documents.
 */
export type UpdateBlueprintData = Partial<Omit<BlueprintDocument, 'id' | 'createdAt' | 'createdBy' | 'ownerId' | 'ownerType'>>;

/**
 * Blueprint with Subcollections
 *
 * Extended blueprint model including references to subcollections.
 */
export interface BlueprintWithSubcollections extends BlueprintDocument {
  /** Number of modules configured */
  moduleCount?: number;

  /** Number of active members */
  memberCount?: number;

  /** Number of audit log entries */
  auditLogCount?: number;

  /** Has active container instance */
  hasActiveContainer?: boolean;
}

/**
 * Converter: Timestamp to Date
 *
 * Converts Firestore Timestamp fields to JavaScript Date objects.
 */
export function timestampToDate(timestamp: Timestamp | Date | undefined | null): Date | null {
  if (!timestamp) return null;
  if (timestamp instanceof Date) return timestamp;
  if (timestamp instanceof Timestamp) return timestamp.toDate();
  return null;
}

/**
 * Converter: Date to Timestamp
 *
 * Converts JavaScript Date to Firestore Timestamp.
 */
export function dateToTimestamp(date: Date | string | undefined | null): Timestamp | null {
  if (!date) return null;
  if (typeof date === 'string') {
    return Timestamp.fromDate(new Date(date));
  }
  if (date instanceof Date) {
    return Timestamp.fromDate(date);
  }
  return null;
}
