/**
 * Core Repositories
 * Unified data access layer for all repositories
 *
 * Structure (ADR-0002: Hybrid Repository Strategy):
 * - shared/ - Cross-module repositories (Account, Organization, Team, etc.)
 * - base/ - Base repository classes and interfaces
 * - Module-specific repositories remain here (Task, Log)
 * - Infrastructure repositories moved to core/infrastructure/storage/
 */

// Shared repositories (cross-module)
export * from './shared/account.repository';
export * from './shared/organization.repository';
export * from './shared/organization-member.repository';
export * from './shared/organization-invitation.repository';
export * from './shared/team.repository';
export * from './shared/team-member.repository';
export * from './shared/partner.repository';
export * from './shared/partner-member.repository';
export * from './shared/notification.repository';

// Base repository classes
export * from './base/firestore-base.repository';

// Module-specific repositories (Task, Log)
export * from './task-firestore.repository';
export * from './log-firestore.repository';

// Legacy aliases for backward compatibility (will be removed in future)
export { LogFirestoreRepository as LogRepository } from './log-firestore.repository';
export { TaskFirestoreRepository as TaskRepository } from './task-firestore.repository';
