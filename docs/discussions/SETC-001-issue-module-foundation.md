# SETC-001: Issue Module Foundation Setup

> **Task ID**: SETC-001  
> **Task Name**: Issue Module Foundation Setup  
> **Priority**: P1 (Critical)  
> **Estimated Effort**: 2 days  
> **Dependencies**: None  
> **Status**: 📋 Ready to Start

---

## 📋 Task Overview

Create the foundational structure for the independent Issue Module, including directory layout, module configuration, metadata, and core TypeScript interfaces.

## 🎯 Objectives

1. Create Issue Module directory structure
2. Define module metadata and configuration
3. Create TypeScript interfaces for Issue domain models
4. Set up module exports and barrel files
5. Register module with Blueprint Container

## 📁 Directory Structure to Create

```
src/app/core/blueprint/modules/implementations/issue/
├── issue.module.ts                 # Angular module definition
├── module.metadata.ts              # Module metadata
├── index.ts                        # Barrel export
├── README.md                       # Module documentation
│
├── models/
│   ├── index.ts
│   ├── issue.model.ts              # Core Issue interface
│   ├── issue-resolution.model.ts   # Resolution data model
│   └── issue-verification.model.ts # Verification data model
│
├── repositories/
│   ├── index.ts
│   └── issue.repository.ts         # Placeholder
│
├── services/
│   ├── index.ts
│   ├── issue-management.service.ts # Placeholder
│   ├── issue-creation.service.ts   # Placeholder
│   ├── issue-resolution.service.ts # Placeholder
│   ├── issue-verification.service.ts # Placeholder
│   └── issue-lifecycle.service.ts  # Placeholder
│
├── config/
│   ├── index.ts
│   └── issue.config.ts             # Module configuration
│
└── exports/
    ├── index.ts
    └── issue-api.exports.ts        # Public API definitions
```

## 📝 Implementation Steps

### Step 1: Create Directory Structure

```bash
# Create main directory
mkdir -p src/app/core/blueprint/modules/implementations/issue/{models,repositories,services,config,exports}

# Create index files
touch src/app/core/blueprint/modules/implementations/issue/index.ts
touch src/app/core/blueprint/modules/implementations/issue/models/index.ts
touch src/app/core/blueprint/modules/implementations/issue/repositories/index.ts
touch src/app/core/blueprint/modules/implementations/issue/services/index.ts
touch src/app/core/blueprint/modules/implementations/issue/config/index.ts
touch src/app/core/blueprint/modules/implementations/issue/exports/index.ts
```

### Step 2: Define Core Data Models

**File**: `models/issue.model.ts`

```typescript
/**
 * Issue Module - Core Data Models
 * 
 * Defines the domain models for the independent Issue tracking system.
 * Supports multiple sources: manual, acceptance, qc, warranty, safety
 */

/**
 * Source of the Issue
 * - manual: Created directly by users
 * - acceptance: Auto-created from acceptance failures
 * - qc: Auto-created from QC inspection failures
 * - warranty: Auto-created from warranty defects
 * - safety: Auto-created from safety incidents
 */
export type IssueSource = 'manual' | 'acceptance' | 'qc' | 'warranty' | 'safety';

/**
 * Severity level of the Issue
 */
export type IssueSeverity = 'critical' | 'major' | 'minor';

/**
 * Category of the Issue
 */
export type IssueCategory = 'quality' | 'safety' | 'warranty' | 'other';

/**
 * Status of the Issue through its lifecycle
 */
export type IssueStatus = 'open' | 'in_progress' | 'resolved' | 'verified' | 'closed';

/**
 * Main Issue interface
 * Represents a problem that needs tracking and resolution
 */
export interface Issue {
  // Identity
  id: string;
  blueprintId: string;
  issueNumber: string;
  
  // Source tracking
  source: IssueSource;
  sourceId: string | null;  // null for manual creation
  
  // Issue details
  title: string;
  description: string;
  location: string;
  severity: IssueSeverity;
  category: IssueCategory;
  
  // Responsibility
  responsibleParty: string;
  assignedTo?: string;
  
  // Process
  resolution?: IssueResolution;
  verification?: IssueVerification;
  
  // Lifecycle
  status: IssueStatus;
  
  // Evidence
  beforePhotos: string[];
  afterPhotos: string[];
  
  // Audit trail
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  closedAt?: Date;
}

/**
 * Resolution details for an Issue
 */
export interface IssueResolution {
  resolutionMethod: string;
  resolutionDate: Date;
  resolvedBy: string;
  cost?: number;
  notes: string;
  evidencePhotos: string[];
  resolvedAt: Date;
}

/**
 * Verification details for an Issue
 */
export interface IssueVerification {
  verifiedBy: string;
  verifiedAt: Date;
  result: 'approved' | 'rejected';
  notes: string;
  verificationPhotos: string[];
}

/**
 * Parameters for creating an Issue manually
 */
export interface CreateIssueData {
  blueprintId: string;
  title: string;
  description: string;
  location: string;
  severity: IssueSeverity;
  category: IssueCategory;
  responsibleParty: string;
  assignedTo?: string;
  beforePhotos?: string[];
  createdBy: string;
}

/**
 * Parameters for auto-creating Issues from Acceptance failures
 */
export interface IssueFromAcceptanceParams {
  acceptanceId: string;
  blueprintId: string;
  failedItems: Array<{
    itemName: string;
    location: string;
    notes?: string;
    photos?: string[];
  }>;
  contractorId: string;
  inspectorId: string;
}

/**
 * Parameters for auto-creating Issues from QC failures
 */
export interface IssueFromQCParams {
  inspectionId: string;
  blueprintId: string;
  failedItems: Array<{
    itemName: string;
    location: string;
    notes?: string;
    photos?: string[];
  }>;
  contractorId: string;
  inspectorId: string;
}

/**
 * Parameters for auto-creating Issues from Warranty defects
 */
export interface IssueFromWarrantyParams {
  warrantyDefectId: string;
  blueprintId: string;
  title: string;
  description: string;
  location: string;
  severity: IssueSeverity;
  photos?: string[];
  warrantor: string;
  reportedBy: string;
}

/**
 * Parameters for auto-creating Issues from Safety incidents
 */
export interface IssueFromSafetyParams {
  incidentId: string;
  blueprintId: string;
  title: string;
  description: string;
  location: string;
  severity: IssueSeverity;
  photos?: string[];
  responsibleParty: string;
  reportedBy: string;
}

/**
 * Issue statistics for reporting
 */
export interface IssueStatistics {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  verified: number;
  closed: number;
  bySeverity: {
    critical: number;
    major: number;
    minor: number;
  };
  bySource: {
    manual: number;
    acceptance: number;
    qc: number;
    warranty: number;
    safety: number;
  };
}

/**
 * Filters for querying Issues
 */
export interface IssueFilters {
  status?: IssueStatus[];
  severity?: IssueSeverity[];
  category?: IssueCategory[];
  source?: IssueSource[];
  responsibleParty?: string;
  assignedTo?: string;
  createdAfter?: Date;
  createdBefore?: Date;
}
```

**File**: `models/index.ts`

```typescript
/**
 * Issue Module - Models Barrel Export
 */

export * from './issue.model';
export * from './issue-resolution.model';
export * from './issue-verification.model';
```

### Step 3: Define Module Metadata

**File**: `module.metadata.ts`

```typescript
/**
 * Issue Module Metadata
 * 
 * Defines module identification and configuration metadata
 * for registration with the Blueprint Container.
 */

import { ModuleMetadata } from '@core/blueprint/types';

export const ISSUE_MODULE_METADATA: Readonly<ModuleMetadata> = {
  id: 'issue',
  moduleType: 'issue',
  name: '問題管理',
  nameEn: 'Issue Management',
  version: '1.0.0',
  description: '獨立的問題單管理模組，支援手動建立與多來源自動生成',
  descriptionEn: 'Independent issue management module with manual creation and multi-source auto-generation',
  dependencies: [],
  defaultOrder: 8,
  icon: 'exclamation-circle',
  color: '#fa8c16',
  category: 'quality',
  tags: ['issue', 'problem', 'tracking', 'resolution', 'quality'],
  author: 'GigHub Development Team',
  license: 'Proprietary',
  capabilities: [
    'manual_issue_creation',
    'auto_issue_creation',
    'multi_source_support',
    'issue_lifecycle_management',
    'issue_resolution_workflow',
    'issue_verification_workflow',
    'issue_statistics'
  ]
} as const;
```

### Step 4: Define Module Configuration

**File**: `config/issue.config.ts`

```typescript
/**
 * Issue Module Configuration
 * 
 * Module-specific configuration settings
 */

export interface IssueModuleConfig {
  // Feature flags
  enableManualCreation: boolean;
  enableAutoCreationFromAcceptance: boolean;
  enableAutoCreationFromQC: boolean;
  enableAutoCreationFromWarranty: boolean;
  enableAutoCreationFromSafety: boolean;
  
  // Issue numbering
  issueNumberPrefix: string;
  issueNumberLength: number;
  
  // Defaults
  defaultCategory: string;
  defaultSeverity: string;
  
  // Workflow
  requireResolutionBeforeVerification: boolean;
  requireVerificationBeforeClose: boolean;
  
  // Notifications
  notifyOnIssueCreated: boolean;
  notifyOnIssueResolved: boolean;
  notifyOnIssueClosed: boolean;
}

export const DEFAULT_ISSUE_MODULE_CONFIG: Readonly<IssueModuleConfig> = {
  // All sources enabled by default
  enableManualCreation: true,
  enableAutoCreationFromAcceptance: true,
  enableAutoCreationFromQC: true,
  enableAutoCreationFromWarranty: true,
  enableAutoCreationFromSafety: true,
  
  // Issue numbering format: ISS-0001
  issueNumberPrefix: 'ISS',
  issueNumberLength: 4,
  
  // Defaults
  defaultCategory: 'quality',
  defaultSeverity: 'minor',
  
  // Workflow enforcement
  requireResolutionBeforeVerification: true,
  requireVerificationBeforeClose: true,
  
  // Notifications enabled
  notifyOnIssueCreated: true,
  notifyOnIssueResolved: true,
  notifyOnIssueClosed: true
} as const;
```

**File**: `config/index.ts`

```typescript
export * from './issue.config';
```

### Step 5: Define Public API Exports

**File**: `exports/issue-api.exports.ts`

```typescript
/**
 * Issue Module - Public API Interface
 * 
 * Defines the public API contract that other modules will use
 * to interact with the Issue Module.
 */

import {
  Issue,
  CreateIssueData,
  IssueFromAcceptanceParams,
  IssueFromQCParams,
  IssueFromWarrantyParams,
  IssueFromSafetyParams,
  IssueResolution,
  IssueVerification,
  IssueStatistics,
  IssueFilters
} from '../models';

/**
 * Main Issue Module API
 */
export interface IIssueModuleApi {
  management: IIssueManagementApi;
  creation: IIssueCreationApi;
  resolution: IIssueResolutionApi;
  lifecycle: IIssueLifecycleApi;
}

/**
 * Issue Management API (CRUD operations)
 */
export interface IIssueManagementApi {
  // Create
  createIssue(data: CreateIssueData): Promise<Issue>;
  
  // Read
  getIssue(issueId: string): Promise<Issue | null>;
  listIssues(blueprintId: string, filters?: IssueFilters): Promise<Issue[]>;
  getIssueStatistics(blueprintId: string): Promise<IssueStatistics>;
  
  // Update
  updateIssue(issueId: string, data: Partial<Issue>): Promise<Issue>;
  assignIssue(issueId: string, assignedTo: string): Promise<Issue>;
  
  // Delete
  deleteIssue(issueId: string): Promise<void>;
}

/**
 * Issue Creation API (Auto-creation from multiple sources)
 */
export interface IIssueCreationApi {
  autoCreateFromAcceptance(params: IssueFromAcceptanceParams): Promise<Issue[]>;
  autoCreateFromQC(params: IssueFromQCParams): Promise<Issue[]>;
  autoCreateFromWarranty(params: IssueFromWarrantyParams): Promise<Issue>;
  autoCreateFromSafety(params: IssueFromSafetyParams): Promise<Issue>;
}

/**
 * Issue Resolution API (Resolution and verification workflows)
 */
export interface IIssueResolutionApi {
  resolveIssue(issueId: string, resolution: IssueResolution): Promise<Issue>;
  verifyIssue(issueId: string, verification: IssueVerification): Promise<Issue>;
  reopenIssue(issueId: string, reason: string): Promise<Issue>;
}

/**
 * Issue Lifecycle API (State management)
 */
export interface IIssueLifecycleApi {
  startProgress(issueId: string): Promise<Issue>;
  markResolved(issueId: string): Promise<Issue>;
  markVerified(issueId: string): Promise<Issue>;
  closeIssue(issueId: string): Promise<Issue>;
  getLifecycleHistory(issueId: string): Promise<Array<{
    status: string;
    timestamp: Date;
    userId: string;
    notes?: string;
  }>>;
}
```

**File**: `exports/index.ts`

```typescript
export * from './issue-api.exports';
```

### Step 6: Create Module Definition (Placeholder)

**File**: `issue.module.ts`

```typescript
/**
 * Issue Module
 * 
 * Independent module for tracking and managing issues/problems
 * that can be manually created or automatically generated from
 * multiple sources (Acceptance, QC, Warranty, Safety).
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ISSUE_MODULE_METADATA } from './module.metadata';

@NgModule({
  imports: [CommonModule],
  providers: [
    // Services will be added in SETC-002
  ]
})
export class IssueModule {
  static readonly metadata = ISSUE_MODULE_METADATA;
  
  constructor() {
    console.log('Issue Module initialized:', ISSUE_MODULE_METADATA.name);
  }
}
```

### Step 7: Create Main Barrel Export

**File**: `index.ts`

```typescript
/**
 * Issue Module - Main Export
 */

export * from './issue.module';
export * from './module.metadata';
export * from './models';
export * from './config';
export * from './exports';
```

### Step 8: Create README

**File**: `README.md`

```markdown
# Issue Module

Independent module for managing issues/problems with flexible creation modes.

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
├── services/            # Business logic services (5 core services)
├── repositories/        # Data access layer (Firestore)
├── config/              # Module configuration
└── exports/             # Public API definitions
```

## Public API

The module exposes four main API surfaces:

1. **IssueManagementApi**: CRUD operations for manual issue management
2. **IssueCreationApi**: Auto-creation from multiple sources
3. **IssueResolutionApi**: Resolution and verification workflows
4. **IssueLifecycleApi**: State transition management

## Integration Points

- **Acceptance Module**: Auto-creates issues on acceptance failure
- **QA Module**: Optionally creates issues from QC failures
- **Warranty Module**: Creates issues from warranty defects
- **Safety Module**: Creates issues from safety incidents

## Development Status

- [x] Foundation (SETC-001)
- [ ] Repository Layer (SETC-002)
- [ ] Service Layer (SETC-003)
- [ ] Event Integration (SETC-004)
- [ ] UI Components (SETC-005)

## Version

1.0.0 - Initial Release
```

## ✅ Acceptance Criteria

- [ ] All directory structure created as specified
- [ ] All TypeScript interfaces defined with proper types
- [ ] Module metadata configured correctly
- [ ] Module configuration with sensible defaults
- [ ] Public API interfaces fully defined
- [ ] Module can be imported without errors
- [ ] README documentation is complete
- [ ] All files pass TypeScript compilation
- [ ] All files pass ESLint validation

## 🧪 Testing Steps

```bash
# 1. Check TypeScript compilation
cd /home/runner/work/GigHub/GigHub
npx tsc --noEmit

# 2. Run linter
yarn lint

# 3. Verify module can be imported
# Create test file: test-issue-module-import.ts
import { IssueModule, ISSUE_MODULE_METADATA } from './src/app/core/blueprint/modules/implementations/issue';

console.log('Module metadata:', ISSUE_MODULE_METADATA);
```

## 📦 Deliverables

1. Complete directory structure
2. All TypeScript interface definitions
3. Module metadata and configuration
4. Public API interface definitions
5. Angular module skeleton
6. README documentation

## 🔗 Next Task

**SETC-002**: Issue Repository Layer Implementation
- Implement Firestore data access
- Create CRUD operations
- Add query methods
- Implement transaction handling

---

**Status**: 📋 Ready to implement  
**Estimated completion**: 2 days  
**Dependencies**: None
