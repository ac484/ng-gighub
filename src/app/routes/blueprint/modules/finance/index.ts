/**
 * Finance Module - Public API
 * 財務模組 - 公開 API
 *
 * Feature-Based Architecture (功能導向架構)
 * - High Cohesion (高內聚性)
 * - Low Coupling (低耦合性)
 * - Extensibility (可擴展性)
 */

// Main Orchestrator
export { FinanceModuleViewComponent } from './finance-module-view.component';

// Routes
export { financeRoutes } from './routes';

// Feature Exports
export * from './features/dashboard';
export * from './features/invoice-list';
export * from './features/approval-dialog';

// Shared Utilities (empty for now)
// export * from './shared';
