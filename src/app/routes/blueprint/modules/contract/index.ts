/**
 * Contract Module - Public API
 *
 * Self-contained contract management module following domain-driven design.
 *
 * Structure:
 * - data/: Domain models, DTOs, and interfaces
 * - infrastructure/: Data access (repositories with direct Firestore injection)
 * - application/: Business logic (services, facades, state management)
 * - presentation/: UI components and features
 * - config/: Module configuration
 *
 * Principles:
 * - High Cohesion: All contract logic in one place
 * - Low Coupling: Clear interfaces, minimal external dependencies
 * - Extensibility: Domain-driven structure for easy expansion
 * - @angular/fire Best Practices: Direct injection, no wrappers
 *
 * @module routes/blueprint/modules/contract
 * @author GigHub Development Team
 * @date 2025-12-19
 */

// Public Data Layer
export * from './data';

// Public Infrastructure Layer
export * from './infrastructure';

// Public Application Layer
export * from './application';

// Public Presentation Layer (minimal)
export * from './presentation/features';

// Module Configuration
export * from './config';
