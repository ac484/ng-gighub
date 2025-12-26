# 🌲 File Tree Planning Guide
# GigHub Project Structure & Organization

> **Version**: 1.0.0  
> **Last Updated**: 2025-12-26  
> **Status**: Active  
> **Purpose**: Comprehensive guide for organizing files and preventing duplication

---

## 📚 Table of Contents

1. [Project Structure Overview](#project-structure-overview)
2. [Module Organization Principles](#module-organization-principles)
3. [File Naming Conventions](#file-naming-conventions)
4. [Integration Points](#integration-points)
5. [Duplication Prevention](#duplication-prevention)
6. [File Tree Templates](#file-tree-templates)

---

## 🏗️ Project Structure Overview

### Current GigHub Structure

```
ng-gighub/
├── .github/
│   ├── copilot/                     # Copilot configuration & memory
│   │   ├── memory.jsonl            # Project knowledge graph
│   │   ├── agents/                 # Custom AI agents
│   │   ├── workflows/              # Development workflows
│   │   └── shortcuts/              # Quick actions
│   ├── instructions/               # AI instruction files
│   │   ├── angular.instructions.md
│   │   ├── ng-gighub-architecture.instructions.md
│   │   ├── ng-gighub-firestore-repository.instructions.md
│   │   └── ... (framework-specific guides)
│   ├── rules/                      # AI behavior rules
│   └── copilot-instructions.md     # Core mandatory rules
│
├── docs/                           # Documentation
│   ├── ⭐️/                         # AI-specific documentation (NEW)
│   │   ├── README.md               # Navigation hub
│   │   ├── 🤖AI_Character_Profile_Impl.md
│   │   ├── 🧠AI_Behavior_Guidelines.md
│   │   ├── 📋Task_Planning_Template.md (NEW)
│   │   └── 🌲File_Tree_Planning.md (THIS FILE)
│   ├── architecture(架構)/         # Architecture documentation
│   ├── design(設計)/               # Design documents
│   ├── api(API)/                   # API documentation
│   └── ... (other doc categories)
│
├── src/
│   ├── app/
│   │   ├── app.component.ts        # Root component
│   │   ├── app.config.ts           # App configuration
│   │   │
│   │   ├── core/                   # Core functionality (singleton services)
│   │   │   ├── domain/             # Domain models & types
│   │   │   │   └── models/
│   │   │   │       ├── blueprint.model.ts
│   │   │   │       ├── task.model.ts
│   │   │   │       ├── user.model.ts
│   │   │   │       └── ... (domain entities)
│   │   │   │
│   │   │   ├── services/           # Global services
│   │   │   │   ├── firebase.service.ts
│   │   │   │   ├── firebase-auth.service.ts
│   │   │   │   ├── logger.service.ts
│   │   │   │   └── error-tracking.service.ts
│   │   │   │
│   │   │   ├── [module]/           # Module-specific core (e.g., blueprint)
│   │   │   │   ├── repositories/
│   │   │   │   │   ├── [entity].repository.ts
│   │   │   │   │   └── [entity].repository.spec.ts
│   │   │   │   ├── services/
│   │   │   │   │   ├── [entity].service.ts
│   │   │   │   │   └── [entity].service.spec.ts
│   │   │   │   └── events/
│   │   │   │       └── [module]-event-bus.service.ts
│   │   │   │
│   │   │   ├── account/            # Account module
│   │   │   ├── blueprint/          # Blueprint module
│   │   │   ├── i18n/               # Internationalization
│   │   │   ├── net/                # Network utilities
│   │   │   └── startup/            # App startup logic
│   │   │
│   │   ├── routes/                 # Feature routes (lazy-loaded)
│   │   │   ├── [module]/           # Module route directory
│   │   │   │   ├── [entity]-list.component.ts
│   │   │   │   ├── [entity]-detail.component.ts
│   │   │   │   ├── [entity]-form.component.ts (if needed)
│   │   │   │   ├── [entity]-modal.component.ts (if needed)
│   │   │   │   ├── components/     # Module-specific components
│   │   │   │   │   └── [component].component.ts
│   │   │   │   ├── shared/         # Module-shared utilities
│   │   │   │   │   ├── interfaces/
│   │   │   │   │   ├── utils/
│   │   │   │   │   └── constants/
│   │   │   │   └── routes.ts       # Module routes
│   │   │   │
│   │   │   ├── account/            # Account features
│   │   │   ├── admin/              # Admin features
│   │   │   ├── ai-assistant/       # AI assistant features
│   │   │   ├── blueprint/          # Blueprint features
│   │   │   ├── exception/          # Error handling
│   │   │   ├── explore/            # Search & discovery
│   │   │   ├── organization/       # Organization features
│   │   │   ├── partner/            # Partner features
│   │   │   ├── passport/           # Authentication
│   │   │   ├── settings/           # Settings
│   │   │   ├── social/             # Social features
│   │   │   ├── team/               # Team features
│   │   │   ├── user/               # User features
│   │   │   └── routes.ts           # Root routes
│   │   │
│   │   ├── shared/                 # Shared across app
│   │   │   ├── components/         # Reusable components
│   │   │   ├── directives/         # Custom directives
│   │   │   ├── pipes/              # Custom pipes
│   │   │   ├── utils/              # Utility functions
│   │   │   ├── constants/          # App constants
│   │   │   └── index.ts            # Barrel exports
│   │   │
│   │   └── layout/                 # Layout components
│   │       ├── basic/
│   │       ├── blank/
│   │       └── passport/
│   │
│   ├── assets/                     # Static assets
│   │   ├── i18n/                   # Translation files
│   │   ├── images/
│   │   └── icons/
│   │
│   └── environments/               # Environment configs
│       ├── environment.ts
│       └── environment.prod.ts
│
├── firestore.rules                 # Firestore Security Rules
├── firebase.json                   # Firebase configuration
├── package.json                    # Dependencies
├── tsconfig.json                   # TypeScript configuration
└── angular.json                    # Angular CLI configuration
```

---

## 🎯 Module Organization Principles

### 1. Business Module Structure

Each business module follows this consistent structure:

```
src/app/core/[module]/
├── repositories/
│   ├── [entity].repository.ts          # Data access layer
│   └── [entity].repository.spec.ts     # Repository tests
├── services/
│   ├── [entity].service.ts             # Business logic layer
│   └── [entity].service.spec.ts        # Service tests
└── events/
    └── [module]-event-bus.service.ts   # Event publishing/subscribing

src/app/routes/[module]/
├── [entity]-list.component.ts          # List view
├── [entity]-detail.component.ts        # Detail view
├── [entity]-form.component.ts          # Form view (optional)
├── [entity]-modal.component.ts         # Modal view (optional)
├── components/                         # Module-specific components
│   └── [component].component.ts
├── shared/                             # Module-shared code
│   ├── interfaces/
│   ├── utils/
│   └── constants/
└── routes.ts                           # Module routes
```

### 2. When to Create a New Module

**Create a new module when**:
- ✅ It represents a distinct business domain (e.g., Task, Organization, Team)
- ✅ It has its own data model (Firestore collection)
- ✅ It has independent business logic
- ✅ It can be developed and tested in isolation
- ✅ It will have multiple related features

**Don't create a module for**:
- ❌ Single-use components (put in shared/components)
- ❌ Utility functions (put in shared/utils)
- ❌ Simple UI helpers (put in parent module's components/)
- ❌ Variations of existing entities (extend existing module)

### 3. Shared vs Module-Specific

#### Shared Components (`src/app/shared/components/`)
Use for components that are:
- Reused across multiple modules
- Generic and configuration-driven
- Independent of business logic
- Examples: Data tables, form fields, buttons, cards

#### Module Components (`src/app/routes/[module]/components/`)
Use for components that are:
- Specific to one module
- Contain module-specific business logic
- Not reusable elsewhere
- Examples: Task tree view, blueprint canvas, organization chart

---

## 📝 File Naming Conventions

### TypeScript Files

```
# Components
[entity]-[type].component.ts
Examples:
- task-list.component.ts
- blueprint-detail.component.ts
- organization-form.component.ts
- team-member-modal.component.ts

# Services
[entity].service.ts
Examples:
- task.service.ts
- blueprint.service.ts
- organization.service.ts

# Repositories
[entity].repository.ts
Examples:
- task.repository.ts
- blueprint.repository.ts
- organization.repository.ts

# Models
[entity].model.ts
Examples:
- task.model.ts
- blueprint.model.ts
- user.model.ts

# Interfaces
[name].interface.ts
Examples:
- execution-context.interface.ts
- module-config.interface.ts

# Utilities
[purpose].util.ts
Examples:
- date.util.ts
- validation.util.ts

# Constants
[category].constant.ts
Examples:
- api.constant.ts
- routes.constant.ts
```

### Test Files

```
# Unit Tests
[filename].spec.ts
Examples:
- task.service.spec.ts
- task.repository.spec.ts
- task-list.component.spec.ts

# Integration Tests
[filename].integration.spec.ts
Examples:
- task-management.integration.spec.ts
- blueprint-workflow.integration.spec.ts

# E2E Tests
[filename].e2e-spec.ts
Examples:
- task-crud.e2e-spec.ts
- blueprint-creation.e2e-spec.ts
```

---

## 🔗 Integration Points

### 1. Existing Core Services

Before creating new services, check if these already exist:

```typescript
// Authentication & Authorization
src/app/core/services/firebase-auth.service.ts
src/app/core/services/firebase.service.ts

// Logging & Monitoring
src/app/core/services/logger.service.ts
src/app/core/services/error-tracking.service.ts
src/app/core/services/performance-monitoring.service.ts

// Messaging
src/app/core/services/push-messaging.service.ts

// Events
src/app/core/blueprint/events/enhanced-event-bus.service.ts
```

**Integration Pattern**:
```typescript
// ✅ Inject existing service
@Injectable({ providedIn: 'root' })
export class TaskService {
  private logger = inject(LoggerService);
  private eventBus = inject(BlueprintEventBus);
  
  async createTask(task: CreateTaskRequest): Promise<Task> {
    this.logger.debug('Creating task', task);
    
    const created = await this.repository.create(task);
    
    this.eventBus.publish({
      type: 'task.created',
      data: created
    });
    
    return created;
  }
}
```

### 2. Existing Repositories

Check existing repositories before creating duplicates:

```typescript
// Blueprint Module
src/app/core/blueprint/repositories/blueprint.repository.ts
src/app/core/blueprint/repositories/blueprint-member.repository.ts
src/app/core/blueprint/repositories/blueprint-module.repository.ts

// Account Module
src/app/core/account/repositories/log-firestore.repository.ts
```

### 3. Existing Models

Reuse existing domain models:

```typescript
// Core Domain Models
src/app/core/domain/models/
├── blueprint.model.ts
├── task.model.ts
├── user.model.ts
└── ... (check existing models first)
```

### 4. Shared Components

Use existing shared components:

```typescript
// Check src/app/shared/components/ before creating
// Common components:
- Page header
- Card layouts
- Form fields
- Data tables
- Modals
- Alerts
```

---

## 🚫 Duplication Prevention Checklist

### Before Creating New Files

**1. Search for Similar Functionality**
```bash
# Search for similar files
find src/app -name "*[keyword]*"

# Search for similar code
grep -r "function-name" src/app

# Check existing services
ls src/app/core/*/services/

# Check existing repositories
ls src/app/core/*/repositories/
```

**2. Check Memory.jsonl**
```bash
# Check project knowledge graph
cat .github/copilot/memory.jsonl | grep -i "[keyword]"
```

**3. Review Documentation**
```bash
# Check documentation for existing patterns
ls docs/architecture/
ls docs/design/
```

### Common Duplication Scenarios

#### Scenario 1: Similar Entity Operations

**Problem**: Creating new repository when similar one exists

**Solution**: Extend or reuse existing repository

```typescript
// ❌ DON'T: Create duplicate
export class TaskRepository { 
  // Similar to existing WorkItemRepository
}

// ✅ DO: Reuse or extend
export class TaskRepository extends BaseRepository<Task> {
  // Leverage common functionality
}
```

#### Scenario 2: Repeated Business Logic

**Problem**: Duplicating validation logic

**Solution**: Create shared utility or extend base service

```typescript
// ❌ DON'T: Duplicate validation
export class TaskService {
  validateTitle(title: string) { /* same as other services */ }
}

// ✅ DO: Shared utility
// src/app/shared/utils/validation.util.ts
export function validateTitle(title: string): boolean {
  return title.length > 0 && title.length <= 200;
}
```

#### Scenario 3: Similar UI Components

**Problem**: Creating similar components in different modules

**Solution**: Extract to shared components with configuration

```typescript
// ❌ DON'T: Duplicate component
// routes/task/task-status-badge.component.ts
// routes/issue/issue-status-badge.component.ts

// ✅ DO: Generic shared component
// shared/components/status-badge.component.ts
@Component({
  selector: 'app-status-badge',
  standalone: true,
  template: `
    <nz-badge [nzStatus]="statusConfig().color" [nzText]="statusConfig().text" />
  `
})
export class StatusBadgeComponent {
  status = input.required<string>();
  type = input<'task' | 'issue'>('task');
  
  statusConfig = computed(() => {
    // Generic status configuration
  });
}
```

---

## 📋 File Tree Templates

### Template 1: New Entity (Full CRUD)

```
src/app/
├── core/
│   ├── domain/models/
│   │   └── [entity].model.ts                    # Domain model
│   └── [module]/
│       ├── repositories/
│       │   ├── [entity].repository.ts           # Data access
│       │   └── [entity].repository.spec.ts      # Repository tests
│       └── services/
│           ├── [entity].service.ts              # Business logic
│           └── [entity].service.spec.ts         # Service tests
│
├── routes/
│   └── [module]/
│       ├── [entity]-list.component.ts           # List view
│       ├── [entity]-list.component.spec.ts      # Component tests
│       ├── [entity]-detail.component.ts         # Detail view
│       ├── [entity]-detail.component.spec.ts    # Component tests
│       ├── [entity]-form.component.ts           # Form view (optional)
│       ├── [entity]-form.component.spec.ts      # Component tests
│       └── routes.ts                            # Update routes
│
└── firestore.rules                              # Update security rules
```

### Template 2: New Module (Complete)

```
src/app/
├── core/
│   └── [new-module]/
│       ├── repositories/
│       │   ├── [entity1].repository.ts
│       │   ├── [entity1].repository.spec.ts
│       │   ├── [entity2].repository.ts
│       │   └── [entity2].repository.spec.ts
│       ├── services/
│       │   ├── [entity1].service.ts
│       │   ├── [entity1].service.spec.ts
│       │   ├── [entity2].service.ts
│       │   └── [entity2].service.spec.ts
│       └── events/
│           └── [module]-event-bus.service.ts
│
├── routes/
│   └── [new-module]/
│       ├── [entity1]-list.component.ts
│       ├── [entity1]-detail.component.ts
│       ├── [entity2]-list.component.ts
│       ├── [entity2]-detail.component.ts
│       ├── components/
│       │   ├── [component1].component.ts
│       │   └── [component2].component.ts
│       ├── shared/
│       │   ├── interfaces/
│       │   │   └── [interface].interface.ts
│       │   ├── utils/
│       │   │   └── [util].util.ts
│       │   └── constants/
│       │       └── [constant].constant.ts
│       └── routes.ts
│
└── firestore.rules                              # Add module rules
```

### Template 3: Feature Enhancement (No New Entity)

```
src/app/
├── core/
│   └── [existing-module]/
│       ├── repositories/
│       │   └── [entity].repository.ts           # Add new methods
│       └── services/
│           └── [entity].service.ts              # Add new business logic
│
├── routes/
│   └── [existing-module]/
│       ├── [entity]-list.component.ts           # Enhance UI
│       └── components/
│           └── [new-feature].component.ts       # New component
│
└── firestore.rules                              # Update if needed
```

### Template 4: Shared Utility

```
src/app/shared/
├── components/                                  # If UI component
│   ├── [component].component.ts
│   └── [component].component.spec.ts
├── directives/                                  # If directive
│   ├── [directive].directive.ts
│   └── [directive].directive.spec.ts
├── pipes/                                       # If pipe
│   ├── [pipe].pipe.ts
│   └── [pipe].pipe.spec.ts
├── utils/                                       # If utility function
│   ├── [util].util.ts
│   └── [util].util.spec.ts
└── index.ts                                     # Update exports
```

---

## 🔍 Decision Tree: Where Should My File Go?

```
Is it a domain model?
├─ Yes → src/app/core/domain/models/
└─ No → Continue

Is it a data access operation (Firestore)?
├─ Yes → src/app/core/[module]/repositories/
└─ No → Continue

Is it business logic?
├─ Yes → src/app/core/[module]/services/
└─ No → Continue

Is it a UI component?
├─ Used by multiple modules?
│   ├─ Yes → src/app/shared/components/
│   └─ No → src/app/routes/[module]/components/
└─ No → Continue

Is it a utility function?
├─ Used across app?
│   ├─ Yes → src/app/shared/utils/
│   └─ No → src/app/routes/[module]/shared/utils/
└─ No → Continue

Is it a constant/configuration?
├─ Used across app?
│   ├─ Yes → src/app/shared/constants/
│   └─ No → src/app/routes/[module]/shared/constants/
└─ No → Continue

Is it a directive/pipe?
└─ src/app/shared/directives/ or pipes/
```

---

## 📊 Integration with Existing Features

### Blueprint Module Integration

```typescript
// When creating features related to blueprints:
// 1. Use existing BlueprintEventBus
import { BlueprintEventBus } from '@core/blueprint/events';

// 2. Check blueprint membership via existing service
import { BlueprintService } from '@core/blueprint/services';

// 3. Emit events for blueprint activities
this.eventBus.publish({
  type: 'task.created',
  blueprintId: task.blueprintId,
  timestamp: new Date(),
  actor: currentUserId,
  data: task
});
```

### Task Module Integration

```typescript
// Task-related features should integrate with:
// 1. Existing task types and statuses
import { Task, TaskStatus } from '@core/domain/models/task.model';

// 2. Task-specific repositories
import { TaskRepository } from '@core/task/repositories';

// 3. Task-specific services
import { TaskService } from '@core/task/services';
```

### Organization/Team Integration

```typescript
// When dealing with multi-tenancy:
// 1. Check organization/team context
import { WorkspaceContextService } from '@shared/services';

// 2. Validate permissions
import { PermissionService } from '@core/services';

// 3. Use appropriate member repositories
import { BlueprintMemberRepository } from '@core/blueprint/repositories';
```

---

## ✅ Final Checklist

Before finalizing file tree:
- [ ] Checked for existing similar files
- [ ] Reviewed memory.jsonl for project patterns
- [ ] Followed naming conventions
- [ ] Placed files in correct directory structure
- [ ] Updated index.ts exports if needed
- [ ] Planned test file locations
- [ ] Identified integration points
- [ ] Documented new patterns if introducing

---

**Version**: 1.0.0  
**Last Updated**: 2025-12-26  
**Maintained By**: GigHub Development Team

This guide ensures consistent file organization and prevents duplication across the GigHub project.
