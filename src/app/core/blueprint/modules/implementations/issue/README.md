# Issue Module

獨立的問題管理模組，支援手動建立與多來源自動生成。

## Overview

The Issue Module provides a unified system for tracking and managing problems that arise during construction projects. It supports both manual creation by users and automatic generation from multiple sources.

## Features

- **Manual Creation**: Users can directly create issue records via UI
- **Multi-Source Auto-Creation**:
  - Acceptance failures
  - QC inspection failures
  - Warranty defects
  - Safety incidents
- **Complete Lifecycle**: open → in_progress → resolved → verified → closed
- **Resolution Workflow**: Structured problem resolution process
- **Verification Workflow**: Quality verification before closure

## Module Structure

```
issue/
├── models/              # Domain models and TypeScript interfaces
├── services/            # Business logic services (6 core services)
│   ├── issue-management.service.ts     # CRUD operations
│   ├── issue-creation.service.ts       # Auto-creation from sources
│   ├── issue-resolution.service.ts     # Resolution workflows
│   ├── issue-verification.service.ts   # Verification workflows
│   ├── issue-lifecycle.service.ts      # State management
│   └── issue-event.service.ts          # Event Bus integration
├── repositories/        # Data access layer (Firestore)
├── config/              # Module configuration
├── exports/             # Public API definitions
└── views/               # UI components (future)
```

## Public API

The module exposes six main API surfaces:

1. **IssueManagementApi**: CRUD operations for manual issue management
2. **IssueCreationApi**: Auto-creation from multiple sources
3. **IssueResolutionApi**: Resolution workflows (problem fixing)
4. **IssueVerificationApi**: Verification workflows (quality checks)
5. **IssueLifecycleApi**: State transition management
6. **IssueEventApi**: Event subscription and emission

## Integration Points

- **Acceptance Module**: Auto-creates issues on acceptance failure
- **QA Module**: Optionally creates issues from QC failures
- **Warranty Module**: Creates issues from warranty defects
- **Safety Module**: Creates issues from safety incidents

## Event Types

All events are prefixed with `issue.` for namespacing:

- `issue.created` - Issue created manually
- `issue.created_from_acceptance` - Issues created from acceptance failure
- `issue.created_from_qc` - Issues created from QC failure
- `issue.created_from_warranty` - Issue created from warranty defect
- `issue.created_from_safety` - Issue created from safety incident
- `issue.updated` - Issue updated
- `issue.assigned` - Issue assigned to user
- `issue.resolved` - Issue resolved
- `issue.verified` - Issue verified
- `issue.verification_failed` - Issue verification failed
- `issue.closed` - Issue closed

## Development Status

- [x] Foundation (SETC-001) - Directory structure, models, metadata
- [x] Repository Layer (SETC-002) - Firestore CRUD operations
- [x] Core Services (SETC-003/004) - Management & Creation services
- [x] Resolution & Verification (SETC-005) - Workflow services
- [x] Event Integration (SETC-006) - Event Bus integration
- [x] UI Components (SETC-007) - Statistics, table, action buttons
- [x] Testing (SETC-008) - Unit tests for core services

## Testing

The module includes comprehensive unit tests for core services:

- `issue-lifecycle.service.spec.ts` - State transition validation tests
- `issue-management.service.spec.ts` - CRUD operation tests
- `issue-creation.service.spec.ts` - Auto-creation tests (4 sources)

Run tests with:
```bash
yarn test
```

## Usage

### Manual Issue Creation

```typescript
import { IssueManagementService } from '@core/blueprint/modules/implementations/issue';

const managementService = inject(IssueManagementService);

const issue = await managementService.createIssue({
  blueprintId: 'bp-001',
  title: '牆面裂縫',
  description: '客廳西側牆面發現裂縫',
  location: '客廳西側',
  severity: 'major',
  category: 'quality',
  responsibleParty: 'contractor-001',
  createdBy: 'user-001'
});
```

### Auto-Creation from Acceptance Failure

```typescript
import { IssueCreationService } from '@core/blueprint/modules/implementations/issue';

const creationService = inject(IssueCreationService);

const issues = await creationService.autoCreateFromAcceptance({
  acceptanceId: 'acc-001',
  blueprintId: 'bp-001',
  failedItems: [
    { itemName: '油漆品質', location: '客廳', notes: '色差明顯' },
    { itemName: '地板平整度', location: '臥室', notes: '局部起伏' }
  ],
  contractorId: 'contractor-001',
  inspectorId: 'inspector-001'
});
```

## Version

1.0.0 - Initial Release

## Author

GigHub Development Team

## License

Proprietary
