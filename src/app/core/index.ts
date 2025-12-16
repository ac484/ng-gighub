// Errors
export * from './errors/index';

// Services
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

// Data access layer
export * from './data-access/index';

// Infrastructure layer
export * from './infrastructure/index';

// State management
export * from './state/index';

// Blueprint system
// 注意：blueprint 系統有自己的 types、errors、repositories，這些會與 core 層的導出衝突
// 因此不從這裡導出 blueprint，使用者應該直接從 '@core/blueprint' 導入
// export * from './blueprint/index';
