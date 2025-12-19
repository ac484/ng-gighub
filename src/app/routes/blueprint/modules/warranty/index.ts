/**
 * Warranty Module - Public API (Refactored)
 *
 * Feature-based exports with high cohesion and low coupling.
 * Each feature is self-contained and can be used independently.
 *
 * 🎯 Architecture Benefits:
 * - High Cohesion: Related functionality grouped by business feature
 * - Low Coupling: Features communicate via clear interfaces
 * - Extensibility: Easy to add new features or extend existing ones
 * - Maintainability: Clear structure, smaller focused components
 *
 * @module WarrantyModule
 * @see README.md for detailed component documentation
 */

// ========================================
// Main Orchestrator
// ========================================
export { WarrantyModuleViewComponent } from './warranty-module-view.component';

// ========================================
// Feature Exports
// ========================================

// List Feature - Warranty listing with statistics and filters
export * from './features/list';

// Defects Feature - Defect listing and management
export * from './features/defects';

// Detail Feature - Warranty detail view with tabs
export * from './features/detail';

// Shared Components - Reusable across features
export * from './shared';
