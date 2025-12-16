# Audit Logs Module Migration Guide

## Overview

The Audit Logs functionality has been refactored from a scattered implementation into a fully modular Blueprint V2 module. This guide explains the changes and provides migration strategies.

## What Changed?

### Old Structure (Scattered)

```
src/app/
├── routes/blueprint/audit/
│   └── audit-logs.component.ts          # UI component
├── core/
│   ├── models/
│   │   └── audit-log.model.ts           # Data models
│   ├── types/audit/
│   │   └── audit-log.types.ts           # Type definitions
│   ├── repositories/
│   │   └── audit-log.repository.ts      # Core repository
│   └── blueprint/repositories/
│       └── audit-log.repository.ts      # Blueprint repository
```

### New Structure (Modular)

```
src/app/core/blueprint/modules/implementations/audit-logs/
├── audit-logs.module.ts                 # IBlueprintModule implementation
├── module.metadata.ts                   # Metadata & configuration
├── index.ts                             # Public exports
├── README.md                            # Full documentation
├── config/
│   └── audit-logs.config.ts             # Runtime configuration
├── models/
│   ├── audit-log.model.ts               # Complete data models
│   └── audit-log.types.ts               # Simple types
├── repositories/
│   └── audit-log.repository.ts          # Firestore data access
├── services/
│   └── audit-logs.service.ts            # Business logic
├── components/
│   └── audit-logs.component.ts          # UI component
└── exports/
    └── audit-logs-api.exports.ts        # Public API
```

## Migration Strategies

### Strategy 1: Gradual Migration (Recommended)

**Phase 1: Update Imports (Current Phase)**

For new code, use the new modular imports:

```typescript
// ✅ New way (recommended for new code)
import { 
  AuditLogsService, 
  AuditLogRepository,
  AuditLogDocument,
  AuditEventType,
  AuditCategory 
} from '@core/blueprint/modules/implementations/audit-logs';

// ✅ Or use lazy loading for components
loadComponent: () => import('@core/blueprint/modules/implementations/audit-logs')
  .then(m => m.AuditLogsComponent)
```

**Phase 2: Update Existing Files**

Gradually update existing files to use new imports:

```typescript
// ❌ Old way (still works but deprecated)
import { AuditLogRepository } from '@core/blueprint/repositories/audit-log.repository';
import { AuditEventType } from '@core/models/audit-log.model';

// ✅ New way
import { 
  AuditLogRepository,
  AuditEventType 
} from '@core/blueprint/modules/implementations/audit-logs';
```

**Phase 3: Deprecate Old Files**

Mark old files as deprecated and remove them in a future release.

### Strategy 2: Immediate Migration (Advanced)

Update all references at once:

1. **Find and Replace Imports**
   ```bash
   # Update all imports to use new module
   find src/app -name "*.ts" -exec sed -i 's|@core/models/audit-log.model|@core/blueprint/modules/implementations/audit-logs|g' {} +
   find src/app -name "*.ts" -exec sed -i 's|@core/blueprint/repositories/audit-log.repository|@core/blueprint/modules/implementations/audit-logs|g' {} +
   ```

2. **Test Everything**
   ```bash
   npm run lint
   npm run build
   npm run test
   ```

3. **Remove Old Files**
   - Delete `src/app/core/models/audit-log.model.ts`
   - Delete `src/app/core/types/audit/audit-log.types.ts`
   - Delete `src/app/core/repositories/audit-log.repository.ts`
   - Delete `src/app/core/blueprint/repositories/audit-log.repository.ts`
   - Delete `src/app/routes/blueprint/audit/audit-logs.component.ts`

## Current Status

### Files Still Using Old Imports

The following files still reference old audit log locations:

1. **`src/app/routes/blueprint/audit/audit-logs.component.ts`**
   - Old standalone component
   - Used by `blueprint-detail.component.ts`
   - **Action**: Update blueprint-detail to use new component

2. **`src/app/core/stores/task.store.ts`**
   - Imports from `@core/models/audit-log.model`
   - Imports from `@core/blueprint/repositories/audit-log.repository`
   - **Action**: Update imports to use new module

3. **`src/app/core/blueprint/repositories/audit-log.repository.ts`**
   - Old repository implementation
   - Used by task.store.ts
   - **Action**: Can be kept for backward compatibility or deprecated

4. **`src/app/core/blueprint/modules/implementations/tasks/tasks.service.ts`**
   - Imports from `@core/models/audit-log.model`
   - **Action**: Update to use new module exports

5. **`src/app/features/module-manager/module-manager.service.ts`**
   - Imports audit log types
   - **Action**: Update to use new module exports

### Updated Files

1. **`src/app/routes/blueprint/routes.ts`**
   - ✅ Now loads AuditLogsComponent from new module
   - Uses lazy loading for better performance

## Benefits of New Structure

### 1. Full Blueprint Module Integration

The audit logs module now implements `IBlueprintModule`:
- Proper lifecycle management (init → start → ready → stop → dispose)
- Event bus integration
- Module metadata and configuration
- Dependency management

### 2. Signal-Based State Management

The service layer uses Angular Signals:
```typescript
const auditService = inject(AuditLogsService);

// Reactive signals
auditService.logs();      // Signal<AuditLogDocument[]>
auditService.loading();   // Signal<boolean>
auditService.error();     // Signal<Error | null>
auditService.hasLogs();   // Computed Signal<boolean>
```

### 3. Clear Separation of Concerns

- **Repository**: Firestore data access only
- **Service**: Business logic and state management
- **Component**: UI rendering only
- **Module**: Lifecycle and integration

### 4. Better Testability

Each layer can be tested independently:
```typescript
// Test repository
const mockFirestore = jasmine.createSpyObj('Firestore', ['collection']);
const repository = new AuditLogRepository(mockFirestore, mockLogger);

// Test service
const mockRepository = jasmine.createSpyObj('AuditLogRepository', ['queryLogs']);
const service = new AuditLogsService(mockLogger, mockRepository);

// Test component
TestBed.configureTestingModule({
  providers: [
    { provide: AuditLogsService, useValue: mockService }
  ]
});
```

### 5. Comprehensive Documentation

The new module includes:
- README with full API documentation
- JSDoc comments on all public methods
- Usage examples
- Configuration guide
- Best practices

## Migration Checklist

- [x] Create new modular structure
- [x] Implement IBlueprintModule interface
- [x] Create service layer with Signals
- [x] Create repository with proper types
- [x] Create standalone component
- [x] Add comprehensive documentation
- [x] Update blueprint routes
- [x] Fix all linting and compilation errors
- [ ] Update task.store.ts imports
- [ ] Update tasks.service.ts imports
- [ ] Update module-manager.service.ts imports
- [ ] Update blueprint-detail.component.ts imports
- [ ] Add deprecation warnings to old files
- [ ] Create migration script (optional)
- [ ] Remove old files (future phase)

## Recommendations

### For New Development

Always use the new modular implementation:

```typescript
import { 
  AuditLogsModule,
  AuditLogsService,
  AuditLogRepository,
  AuditLogsComponent
} from '@core/blueprint/modules/implementations/audit-logs';
```

### For Existing Code

1. **Low Priority**: Keep old imports working (no immediate action needed)
2. **Medium Priority**: Add deprecation warnings to old files
3. **High Priority**: Update any new features to use new module

### For Production

1. Test thoroughly before removing old files
2. Consider keeping old files for one release cycle
3. Document the migration in release notes
4. Provide clear upgrade path for consumers

## Support

For questions or issues related to the migration:
1. Check the new module README: `src/app/core/blueprint/modules/implementations/audit-logs/README.md`
2. Review the module implementation for examples
3. Contact the GigHub Development Team

---

**Created**: 2025-12-13  
**Status**: Phase 1 Complete - New module implemented, old files still present  
**Next Phase**: Update existing imports to use new module
