# Contract Module

Feature-based contract management surfaced inside the Blueprint detail tab. The module is organized around small, focused features with a thin orchestrator.

## Structure

```
contract/
├── contract-module-view-refactored.component.ts  # Orchestrator shown in Blueprint tab
├── application/                                  # Services + state (signals)
├── data/                                         # Models & DTOs
├── infrastructure/                               # Firestore repositories
└── presentation/
    ├── features/
    │   ├── list/      # statistics, filters, table
    │   ├── create/    # wizard
    │   ├── detail/    # drawer
    │   ├── edit/      # modal
    │   └── preview/   # parse/preview modals
    └── shared/        # reusable status badge
```

## Core Components

- **ContractModuleViewComponent**: Minimal coordinator; loads data and shows stats + table.
- **Features**:
  - `list`: displays contracts with statistics and actions.

## Services & State

- **ContractService**: Business rules, validation, lifecycle transitions, Cloud Function integration, and event emission.
- **WorkItemService**: CRUD, validation, and task-linking for contract work items.
- **ContractStore**: Signal-based state (contracts, selection, filters) with derived selectors for counts and filtered views.

### Status Flow

`draft → pending_activation → active → completed`  
`active → terminated`

Invalid transitions are blocked in the service to keep lifecycle consistent.

## Usage

```typescript
import { ContractModuleViewComponent } from './contract';

// In the Blueprint detail tab template
<app-contract-module-view [blueprintId]="blueprintId" />
```

## Development Notes

- Keep orchestration thin; delegate UI concerns to feature components and business rules to services.
- Validate inputs early (title length, parties present, positive amounts, start < end).
- Prefer signal-based state from `ContractStore` over local copies to avoid drift.
- File uploads/parsing flows have been removed from the minimalist view.

## Testing

Focus on:
- Status transition validation
- Creation/update validation paths
- Work item duplicate code detection and progress validation
