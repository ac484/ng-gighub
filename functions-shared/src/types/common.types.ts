/**
 * Common types and interfaces for Firebase Functions
 * Enterprise-standard type definitions
 */

import { Timestamp } from 'firebase-admin/firestore';

/**
 * Base document interface with common fields
 */
export interface BaseDocument {
  id?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy?: string;
  updatedBy?: string;
  deleted?: boolean;
  deletedAt?: Timestamp;
}

/**
 * Response wrapper for API calls
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  timestamp: string;
}

/**
 * Error structure
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  limit?: number;
  offset?: number;
  cursor?: string;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  hasMore: boolean;
  nextCursor?: string;
}

/**
 * Audit log entry
 */
export interface AuditLog extends BaseDocument {
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  oldValue?: any;
  newValue?: any;
  metadata?: Record<string, any>;
}

/**
 * Event metadata for triggers
 */
export interface EventMetadata {
  eventId: string;
  eventType: string;
  timestamp: string;
  resource: string;
}
