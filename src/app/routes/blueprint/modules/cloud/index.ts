/**
 * Cloud Module - Public API
 *
 * Feature-based exports with high cohesion and low coupling
 */

// Main Orchestrator (TODO: Implement refactored version)
// export { CloudModuleViewComponent } from './cloud-module-view-refactored.component';

// Feature Exports
export * from './features/statistics';
export * from './features/folder-management';
// TODO: Complete remaining features
// export * from './features/file-list';
// export * from './features/file-details';
// export * from './features/upload';

// Shared
export * from './shared';

// Legacy (backward compatibility)
export { CloudModuleViewComponent } from './cloud-module-view.component';
export { FolderNameInputComponent as FolderNameInputComponentLegacy } from './cloud-module-view.component';
