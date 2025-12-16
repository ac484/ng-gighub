# Blueprint V2.0 - Logs & Quality Modules Implementation Guide

**Date**: 2025-12-11
**Version**: 1.0.0
**Status**: Implementation Ready

---

## 📋 Overview

This document provides complete specifications for implementing Logs and Quality modules following the proven Tasks Module pattern. Both modules implement `IBlueprintModule` interface and integrate with Blueprint V2.0 architecture.

### Objectives
1. Complete business layer (3/3 modules)
2. Validate architecture reusability
3. Maintain Occam's Razor simplicity
4. Follow existing patterns

---

## 🏗️ Module Architecture

### Common Pattern (From Tasks Module)

```
module/
├── module.metadata.ts      # Configuration, features, permissions
├── {module}.repository.ts  # Firestore CRUD operations
├── {module}.service.ts     # Business logic with Signals
├── {module}.module.ts      # IBlueprintModule implementation
├── {module}.component.ts   # Angular 20 UI
├── {module}.module.spec.ts # Unit tests (25+)
├── {module}.routes.ts      # Routing configuration
└── index.ts                # Barrel exports
```

### Integration Points
- **Container**: Module registration and lifecycle
- **Repositories**: Data access via Phase 2 repositories
- **EventBus**: Inter-module communication
- **UI**: ng-alain components, Signals, new control flow

---

## 📦 Logs Module Specifications

### Purpose
System log recording, querying, and analysis for debugging and monitoring.

### Data Model

```typescript
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  FATAL = 'FATAL'
}

export enum LogCategory {
  SYSTEM = 'system',
  USER = 'user',
  API = 'api',
  DATABASE = 'database',
  MODULE = 'module'
}

export interface LogDocument {
  id: string;
  blueprintId: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  source?: string;
  stackTrace?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
  createdAt: Date;
  createdBy: string;
}
```

### File Specifications

#### 1. module.metadata.ts ✅ (Created)
- Features: log-recording, log-query, log-analysis, log-export
- Permissions: view, create, delete, export
- Default config: 90-day retention, auto cleanup

#### 2. logs.repository.ts (348 lines)
```typescript
export class LogsRepository {
  // CRUD operations
  findByBlueprintId(blueprintId: string): Observable<LogDocument[]>
  findByLevel(blueprintId: string, level: LogLevel): Observable<LogDocument[]>
  findByCategory(blueprintId: string, category: LogCategory): Observable<LogDocument[]>
  findByDateRange(blueprintId: string, start: Date, end: Date): Observable<LogDocument[]>
  create(blueprintId: string, data: CreateLogData): Promise<LogDocument>
  delete(blueprintId: string, logId: string): Promise<void>
  
  // Statistics
  getLogStats(blueprintId: string): Promise<LogStatistics>
  getRecentErrors(blueprintId: string, limit?: number): Promise<LogDocument[]>
}
```

#### 3. logs.service.ts (282 lines)
```typescript
export class LogsService {
  // State signals
  private _logs = signal<LogDocument[]>([]);
  private _loading = signal(false);
  private _error = signal<string | null>(null);
  
  // Public readonly
  readonly logs = this._logs.asReadonly();
  readonly loading = this._loading.asReadonly();
  
  // Computed signals
  readonly errorLogs = computed(() => this._logs().filter(l => l.level === 'ERROR'));
  readonly warnLogs = computed(() => this._logs().filter(l => l.level === 'WARN'));
  readonly logStats = computed(() => ({
    total: this._logs().length,
    errors: this.errorLogs().length,
    warnings: this.warnLogs().length
  }));
  
  // Operations
  loadLogs(blueprintId: string, options?: LogQueryOptions): void
  createLog(blueprintId: string, data: CreateLogData): Promise<void>
  deleteLog(blueprintId: string, logId: string): Promise<void>
  filterByLevel(level: LogLevel): void
  filterByCategory(category: LogCategory): void
  search(query: string): void
}
```

#### 4. logs.module.ts (228 lines)
```typescript
@Injectable()
export class LogsModule implements IBlueprintModule {
  readonly id = 'logs';
  readonly name = '日誌管理';
  readonly version = '1.0.0';
  readonly dependencies = ['context', 'logger', 'audit'];
  readonly status = signal(ModuleStatus.UNINITIALIZED);
  
  async init(context: IExecutionContext): Promise<void>
  async start(): Promise<void>
  async ready(): Promise<void>
  async stop(): Promise<void>
  async dispose(): Promise<void>
  
  readonly exports = {
    service: () => this.logsService,
    repository: () => this.logsRepository,
    metadata: LOGS_MODULE_METADATA
  };
}
```

#### 5. logs.component.ts (205 lines)
```typescript
@Component({
  selector: 'app-logs',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    @if (loading()) {
      <nz-spin nzSimple />
    } @else {
      <div class="logs-container">
        <!-- Statistics -->
        <nz-row [nzGutter]="16">
          <nz-col [nzSpan]="6">
            <nz-statistic [nzValue]="stats().total" nzTitle="Total Logs" />
          </nz-col>
          <nz-col [nzSpan]="6">
            <nz-statistic [nzValue]="stats().errors" nzTitle="Errors" />
          </nz-col>
        </nz-row>
        
        <!-- Filters -->
        <nz-space>
          <nz-select [(ngModel)]="selectedLevel" (ngModelChange)="filterLevel($event)">
            <nz-option nzValue="ALL" nzLabel="All Levels" />
            <nz-option nzValue="DEBUG" nzLabel="Debug" />
            <nz-option nzValue="INFO" nzLabel="Info" />
            <nz-option nzValue="WARN" nzLabel="Warning" />
            <nz-option nzValue="ERROR" nzLabel="Error" />
            <nz-option nzValue="FATAL" nzLabel="Fatal" />
          </nz-select>
        </nz-space>
        
        <!-- Logs Table -->
        <st [data]="filteredLogs()" [columns]="columns" />
      </div>
    }
  `
})
export class LogsComponent {
  private service = inject(LogsService);
  loading = this.service.loading;
  logs = this.service.logs;
  stats = this.service.logStats;
  
  filteredLogs = computed(() => /* filtering logic */);
  
  columns: STColumn[] = [
    { title: 'Time', index: 'timestamp', type: 'date' },
    { title: 'Level', index: 'level', type: 'badge', badge: /* ... */ },
    { title: 'Category', index: 'category' },
    { title: 'Message', index: 'message' },
    { title: 'Source', index: 'source' }
  ];
}
```

#### 6. logs.module.spec.ts (238 lines)
25+ tests covering:
- Module metadata validation
- Lifecycle: init, start, ready, stop, dispose
- State transitions
- Error handling
- Module exports
- Integration scenarios

#### 7. logs.routes.ts + index.ts
Route configuration and barrel exports.

---

## 📦 Quality Module Specifications

### Purpose
Quality inspection management, defect tracking, and resolution monitoring for construction projects.

### Data Model

```typescript
export enum QualityStatus {
  PENDING = 'PENDING',
  IN_REVIEW = 'IN_REVIEW',
  PASS = 'PASS',
  FAIL = 'FAIL',
  REVIEW_REQUIRED = 'REVIEW_REQUIRED'
}

export enum DefectSeverity {
  CRITICAL = 'CRITICAL',
  MAJOR = 'MAJOR',
  MINOR = 'MINOR',
  COSMETIC = 'COSMETIC'
}

export interface QualityInspection {
  id: string;
  blueprintId: string;
  title: string;
  description: string;
  status: QualityStatus;
  inspector: string;
  inspectionDate: Date;
  defects: Defect[];
  photos: string[];
  resolution?: string;
  resolvedBy?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Defect {
  id: string;
  description: string;
  severity: DefectSeverity;
  location: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  assignedTo?: string;
  resolvedAt?: Date;
}
```

### File Structure
Same 8-file structure as Logs Module, with quality-specific logic:
- metadata, repository, service, module, component, tests, routes, index

### Key Differences from Logs
- **Statuses**: PASS/FAIL/PENDING/REVIEW instead of log levels
- **Defects**: Sub-collection for defect tracking
- **Photos**: Image attachment support
- **Resolution**: Resolution workflow tracking

---

## 🧪 Testing Strategy

### Unit Tests (50+ total)

**Per Module (25 each)**:
- Module Metadata (5 tests)
  - ✓ has correct id, name, version
  - ✓ has valid features array
  - ✓ has valid permissions array
  - ✓ has valid events array
  - ✓ default config is valid

- Lifecycle Tests (12 tests)
  - ✓ init: sets INITIALIZING status
  - ✓ init: stores execution context
  - ✓ init: validates dependencies
  - ✓ init: sets INITIALIZED on success
  - ✓ init: sets ERROR on failure
  - ✓ start: loads initial data
  - ✓ start: sets STARTED status
  - ✓ ready: signals readiness
  - ✓ stop: cleans up subscriptions
  - ✓ stop: sets STOPPED status
  - ✓ dispose: releases resources
  - ✓ full lifecycle: completes successfully

- Module Exports (5 tests)
  - ✓ exports service
  - ✓ exports repository
  - ✓ exports metadata
  - ✓ exports default config
  - ✓ exports events

- Error Handling (3 tests)
  - ✓ handles init errors gracefully
  - ✓ handles operation errors
  - ✓ sets ERROR status appropriately

---

## 🎯 Implementation Checklist

### Logs Module
- [x] module.metadata.ts (created)
- [ ] logs.repository.ts
- [ ] logs.service.ts
- [ ] logs.module.ts
- [ ] logs.component.ts
- [ ] logs.module.spec.ts
- [ ] logs.routes.ts
- [ ] index.ts

### Quality Module
- [ ] module.metadata.ts
- [ ] quality.repository.ts
- [ ] quality.service.ts
- [ ] quality.module.ts
- [ ] quality.component.ts
- [ ] quality.module.spec.ts
- [ ] quality.routes.ts
- [ ] index.ts

### Validation
- [ ] TypeScript compiles without errors
- [ ] ESLint passes
- [ ] All tests pass (50+)
- [ ] Modules register with Container
- [ ] UI renders correctly
- [ ] CRUD operations work
- [ ] Audit logging functional

---

## 🚀 Next Steps

1. **Implement Logs Module** (3-4 hours)
   - Create remaining 7 files
   - Follow Tasks Module pattern exactly
   - Run tests to validate

2. **Implement Quality Module** (3-4 hours)
   - Create all 8 files
   - Adapt pattern for quality domain
   - Run tests to validate

3. **Integration Testing** (1 hour)
   - Register modules with Container
   - Test lifecycle transitions
   - Verify UI rendering
   - Check audit logging

4. **Documentation** (1 hour)
   - Update progress summary
   - Document any deviations
   - Create usage examples

**Total Estimated**: 8-10 hours to complete both modules

---

## 📝 Notes

- Both modules follow identical pattern to Tasks Module
- ~90% code structure is reusable
- Only business logic differs
- Maintains Occam's Razor simplicity
- Full TypeScript strict mode
- Complete JSDoc documentation
- Modern Angular 20 features throughout

---

**Implementation Guide Complete** ✅
**Ready to begin file creation** ✅
