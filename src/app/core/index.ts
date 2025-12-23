// Errors (shared infrastructure)
export * from './errors/index';

export * from './i18n/i18n.service';
export * from './net/index';
export * from './services/firebase.service';
export * from './services/firebase-auth.service';
export * from './services/firebase-analytics.service';
export * from './services/logger/logger.service';
export * from './services/performance-monitoring.service';
export * from './services/error-tracking.service';
export * from './startup/startup.service';
export * from './start-page.guard';

// Domain layer (pure business logic - includes models and types)
export * from './domain/index';

// Data access layer (shared repositories)
export * from './data-access/index';

// Infrastructure (shared)
export * from './infrastructure/index';

// State management (shared stores)
export * from './state/index';

// Note: blueprint directory has been removed as part of module self-containment (模組自有化).
// Blueprint-specific functionality should now be imported from src/app/routes/blueprint/.
