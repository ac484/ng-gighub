/**
 * Contract Module - Public API
 * 合約模組 - 公開 API
 *
 * Feature-Based Architecture (功能導向架構)
 * - High Cohesion (高內聚性)
 * - Low Coupling (低耦合性)
 * - Extensibility (可擴展性)
 */

// Main Orchestrator
export { ContractModuleViewComponent } from './contract-module-view-refactored.component';

// Feature Exports
export * from './features/list';
export * from './features/create';
export * from './features/detail';
export * from './features/edit';

// Shared Components
export * from './shared';
