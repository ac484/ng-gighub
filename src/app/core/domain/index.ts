/**
 * Core Domain Layer
 * Pure business logic and domain models (ADR-0002)
 *
 * This layer contains:
 * - Domain models (entities, value objects)
 * - Business types and interfaces
 * - Domain-specific validation logic
 *
 * Note: Domain layer should NOT depend on infrastructure
 */

export * from './models/index';
export * from './types/index';
