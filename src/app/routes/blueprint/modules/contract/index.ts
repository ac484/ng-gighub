/**
 * Contract Module - Public API
 *
 * Export all contract module components following single responsibility principle.
 * These components work together to provide comprehensive contract management functionality
 * within the Blueprint detail page.
 *
 * @module ContractModule
 * @see README.md for detailed component documentation and usage guidelines
 */

// Main view component (displayed in Blueprint Tab)
export { ContractModuleViewComponent } from './contract-module-view.component';

// Creation wizard (guided contract creation flow)
export { ContractCreationWizardComponent } from './contract-creation-wizard.component';

// Detail drawer (right-side contract detail panel)
export { ContractDetailDrawerComponent } from './contract-detail-drawer.component';

// Quick edit modal (fast contract editing)
export { ContractModalComponent } from './contract-modal.component';
