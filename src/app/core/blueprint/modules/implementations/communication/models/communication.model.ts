/**
 * Communication Models
 *
 * Data models for communication domain (meetings, memos, notices).
 *
 * @module CommunicationModels
 * @author GigHub Development Team
 * @date 2025-12-13
 */

/**
 * Communication Type Enum
 */
export enum CommunicationType {
  MEETING = 'meeting',
  MEMO = 'memo',
  NOTICE = 'notice',
  ANNOUNCEMENT = 'announcement'
}

/**
 * Communication Status Enum
 */
export enum CommunicationStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived'
}

/**
 * Communication Item Interface
 *
 * Unified interface for all communication types.
 */
export interface CommunicationItem {
  /** Unique identifier */
  id: string;

  /** Blueprint ID */
  blueprintId: string;

  /** Communication type */
  type: CommunicationType;

  /** Status */
  status: CommunicationStatus;

  /** Title */
  title: string;

  /** Content */
  content: string;

  /** Participants/Recipients */
  participants: string[];

  /** Attachments */
  attachments?: string[];

  /** Scheduled/Meeting date */
  date?: Date;

  /** Location (for meetings) */
  location?: string;

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
 * Create Communication Data
 */
export interface CreateCommunicationData {
  blueprintId: string;
  type: CommunicationType;
  title: string;
  content: string;
  participants: string[];
  date?: Date;
  location?: string;
  attachments?: string[];
  createdBy: string;
}

/**
 * Update Communication Data
 */
export interface UpdateCommunicationData {
  status?: CommunicationStatus;
  title?: string;
  content?: string;
  participants?: string[];
  date?: Date;
  location?: string;
  attachments?: string[];
  metadata?: Record<string, unknown>;
}

/**
 * Communication Query Options
 */
export interface CommunicationQueryOptions {
  type?: CommunicationType;
  status?: CommunicationStatus;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}
