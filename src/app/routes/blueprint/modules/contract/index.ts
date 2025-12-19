/**
 * Contract Module - Public API (Refactored)
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
 * @module ContractModule
 * @see README.md for detailed component documentation
 */

// ========================================
// Main Orchestrator
// ========================================
// Use the refactored version for new development
export { ContractModuleViewComponent } from './contract-module-view-refactored.component';

// ========================================
// Feature Exports
// ========================================

// List Feature - Contract listing with statistics and filters
export * from './features/list';

// Create Feature - Contract creation wizard with steps
export * from './features/create';

// Detail Feature - Contract detail view with tabs
export * from './features/detail';

// Edit Feature - Contract editing with forms
export * from './features/edit';

// Shared Components - Reusable across features
export * from './shared';

// ========================================
// Legacy Components (Backward Compatibility)
// ========================================
// These are kept for backward compatibility but will be deprecated
// Use feature-based components instead

// Old wizard component (use features/create instead)
export { ContractCreationWizardComponent as ContractCreationWizardComponentLegacy } from './contract-creation-wizard.component';

// Old drawer component (use features/detail instead)
export { ContractDetailDrawerComponent as ContractDetailDrawerComponentLegacy } from './contract-detail-drawer.component';

// Old modal component (use features/edit instead)
export { ContractModalComponent as ContractModalComponentLegacy } from './contract-modal.component';
