/**
 * Firestore document types
 * Enterprise-standard document interfaces
 */

import { BaseDocument } from '../../../functions-shared/src/types/common.types';

/**
 * Task document interface
 * Example business entity
 */
export interface Task extends BaseDocument {
  title: string;
  description?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'archived';
  priority: 'low' | 'medium' | 'high';
  assignedTo?: string;
  dueDate?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

/**
 * User profile document
 */
export interface UserProfile extends BaseDocument {
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'admin' | 'manager' | 'user';
  preferences?: Record<string, any>;
  lastLogin?: string;
}

/**
 * Organization document
 */
export interface Organization extends BaseDocument {
  name: string;
  description?: string;
  website?: string;
  logo?: string;
  ownerId: string;
  members: string[];
  settings?: Record<string, any>;
}
