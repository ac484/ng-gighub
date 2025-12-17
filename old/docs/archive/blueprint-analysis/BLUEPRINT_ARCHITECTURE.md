# GigHub Blueprint - Architecture Plan

## Executive Summary

The Blueprint module is the core logical container in the GigHub construction site progress tracking system. It serves as a workspace that organizes and manages various business modules including Tasks, Logs, Quality Assurance, Diary, Dashboard, Files, Todos, Checklists, Issues, and Bot Workflows. This architecture document outlines the comprehensive design for implementing the Blueprint system using Angular 20, Firestore, and modern cloud-native patterns.

### Key Architectural Decisions
- **Multi-tenancy**: Support for User and Organization-level blueprints
- **Modular Design**: Pluggable business modules within a shared context
- **Cloud-Native**: Firestore-based data layer with real-time capabilities
- **Security-First**: Role-based access control (RBAC) with fine-grained permissions
- **Scalability**: Designed for enterprise-level usage with thousands of blueprints

### Technology Stack
- **Frontend**: Angular 20 (Standalone Components, Signals)
- **UI Framework**: ng-zorro-antd 20 (Ant Design for Angular)
- **Backend**: Firebase/Firestore (NoSQL database)
- **State Management**: Angular Signals + RxJS
- **Authentication**: Firebase Authentication
- **Real-time**: Firestore Real-time Listeners

---

## System Context

### System Context Diagram

The Blueprint module sits at the heart of the GigHub system, providing a unified workspace for construction project management.

**External Actors**:
1. **Construction User**: Individual professionals managing personal construction projects
2. **Organization Admin**: Enterprise users managing multiple projects and teams
3. **Team Member**: Collaborative users assigned to specific blueprints
4. **Client/Stakeholder**: External parties viewing project progress

**External Systems**:
1. **Cloud Firestore**: Primary data store with real-time capabilities
2. **Firebase Auth**: Handles user authentication and session management
3. **Firebase Storage**: Manages construction site photos, documents, and media
4. **Notification Service**: Delivers real-time updates to users

**System Interactions**:
- Users interact with the Blueprint module through HTTPS and WebSocket connections
- The module uses Firestore SDK for efficient data operations
- Authentication flows through Firebase Auth
- File operations utilize Firebase Storage
- Notifications are sent via REST API integration

**Design Decisions**:
- **Why Firestore?**: NoSQL structure fits the flexible, hierarchical nature of construction projects. Real-time listeners enable collaborative features without additional infrastructure.
- **Why Firebase Auth?**: Seamless integration with Firestore security rules, reducing authentication complexity.
- **Multi-tier Access**: Different user roles (owner, admin, contributor, viewer) enable flexible collaboration models.

---

## Architecture Overview

### Architectural Pattern
The Blueprint module follows a **Three-Layer Architecture** aligned with GigHub's overall system design:

1. **Foundation Layer**: Account System, Organization Management, Authentication
2. **Container Layer**: Blueprint Module, Permissions (ACL), Event Bus
3. **Business Layer**: Tasks, Logs, Quality, Diary, Dashboard, Files, Todos, Checklists, Issues, Bot Workflows

### Core Architectural Principles

1. **Separation of Concerns**: Clear boundaries between data access, business logic, and presentation layers
2. **Dependency Inversion**: Higher-level modules depend on abstractions, not concrete implementations
3. **Single Responsibility**: Each class/module has one reason to change
4. **Open/Closed Principle**: Open for extension, closed for modification
5. **Repository Pattern**: Abstraction of data access logic
6. **Facade Pattern**: Simplified interface for complex subsystems

---

## Component Architecture

### Component Layers

The Blueprint module is organized into four distinct layers, each with clear responsibilities:

#### **1. Presentation Layer** (UI Components)
- **Blueprint List Component**: Grid/list view of all accessible blueprints
- **Blueprint Detail Component**: Detailed view with modules and settings
- **Blueprint Members Component**: Member management interface
- **Create Blueprint Component**: Modal form for blueprint creation
- **Blueprint Selector Component**: Dropdown for context switching

**Technologies**: Angular 20 Standalone Components, ng-zorro-antd, Signals

#### **2. Facade Layer**
- **Blueprint Facade**: Unified interface for blueprint operations
- **Blueprint Member Facade**: Member management operations
- Provides simplified API to services
- Handles cross-cutting concerns (logging, error handling)
- Exposes reactive signals for UI binding

#### **3. Service Layer**
- **Blueprint Service**: Core business logic for blueprints
- **Blueprint Member Service**: Member management logic
- **Blueprint Team Role Service**: Team access control
- **Workspace Context Service**: Manages current workspace context
- Orchestrates repository operations
- Implements business rules and validations

#### **4. Repository Layer**
- **Blueprint Repository**: Firestore CRUD operations
- **Blueprint Member Repository**: Member data access
- **Blueprint Team Role Repository**: Team role data access
- Abstracts Firestore SDK calls
- Handles data transformations
- Provides type-safe interfaces

### Data Flow

```
User Action → Component → Facade → Service → Repository → Firestore
                ↓           ↓         ↓          ↓          ↓
             Signal ←── Signal ←── Transform ←── Query ←── Data
```

**Key Design Patterns**:
- **Repository Pattern**: Isolates data access from business logic
- **Facade Pattern**: Simplifies complex subsystem interactions
- **Observer Pattern**: Signal-based reactive updates
- **Strategy Pattern**: Context-based permission strategies

---

## Deployment Architecture

### Firebase Platform Deployment

**Architecture Components**:

1. **Client Application** (Angular SPA)
   - Deployed to Firebase Hosting
   - Served via global CDN
   - Progressive Web App capabilities
   - Service Worker for offline support

2. **Cloud Firestore**
   - Primary database
   - Multi-region replication
   - Automatic scaling
   - Real-time listeners

3. **Firebase Authentication**
   - User identity management
   - Token-based authentication
   - Multiple auth providers
   - Custom claims for roles

4. **Firebase Storage**
   - File and media storage
   - CDN distribution
   - Access control rules
   - Resumable uploads

5. **Cloud Functions** (Optional)
   - Serverless backend logic
   - Firestore triggers
   - Scheduled tasks
   - Complex business logic

### Deployment Environments

| Environment | Purpose | Firebase Project | URL |
|------------|---------|-----------------|-----|
| **Development** | Local dev + testing | gighub-dev | localhost:4200 |
| **Staging** | Pre-production testing | gighub-staging | staging.gighub.com |
| **Production** | Live system | gighub-prod | app.gighub.com |

### Deployment Process

```bash
# 1. Build application
ng build --configuration=production

# 2. Deploy to Firebase
firebase deploy --only hosting,firestore,storage

# 3. Verify deployment
firebase hosting:channel:deploy preview

# 4. Promote to production (if verified)
firebase deploy --only hosting
```

### Scaling Strategy

**Automatic Scaling**:
- Firestore automatically scales based on demand
- Firebase Hosting CDN handles traffic spikes
- No manual configuration required

**Performance Optimization**:
- CDN edge caching for static assets
- Firestore query result caching
- Client-side caching with IndexedDB
- Lazy loading for code splitting

### Disaster Recovery

**Backup Strategy**:
- **Automated Backups**: Daily Firestore exports to Cloud Storage
- **Point-in-Time Recovery**: Transaction logs retained for 7 days
- **Export**: Manual export via Firebase CLI
- **Geo-Redundancy**: Multi-region data replication

**Recovery Procedures**:
1. Identify failure point
2. Switch to backup region (if multi-region)
3. Restore from latest backup
4. Verify data integrity
5. Resume normal operations

**RTO (Recovery Time Objective)**: < 15 minutes
**RPO (Recovery Point Objective)**: < 5 minutes

---

## Data Flow

### User Action to UI Update Flow

**Read Operations**:
1. User action triggers component method
2. Component calls Facade
3. Facade delegates to Service
4. Service calls Repository
5. Repository queries Firestore
6. Firestore Security Rules validate access
7. Data returned to Repository
8. Repository transforms data to TypeScript models
9. Service updates Signal state
10. Components automatically re-render

**Write Operations**:
1. User submits form in Component
2. Component validates input locally
3. Component calls Facade with validated data
4. Facade performs business rule checks
5. Service builds mutation payload
6. Repository transforms to Firestore format
7. Firestore Security Rules validate write permission
8. Data written to Firestore
9. Firestore triggers real-time listener
10. All clients receive update via listener
11. Signal state automatically updates
12. UI re-renders with new data

**Error Handling Flow**:
```
Error Occurs → Repository catches → Service handles → Facade logs → Component displays
```

### Real-time Synchronization

**Firestore Listeners**:
- Established when component mounts
- Automatically receive document/collection updates
- Update Signal state on changes
- Unsubscribe when component unmounts

**Optimistic Updates**:
- UI updates immediately (optimistic)
- Background write to Firestore
- Rollback if write fails
- Show notification on success/failure

---

## Key Workflows

### Workflow 1: Create Personal Blueprint

**Actors**: Individual User

**Steps**:
1. User clicks "Create Blueprint" button
2. UI shows create modal with form
3. User enters blueprint details (name, description, modules)
4. UI validates input locally
5. User submits form
6. Component calls `BlueprintFacade.createBlueprint(request)`
7. Facade calls `BlueprintService.createBlueprint(request)`
8. Service retrieves current user from Auth
9. Service builds blueprint object (ownerId=userId, ownerType='user')
10. Service calls `BlueprintRepository.create(blueprint)`
11. Repository transforms data to Firestore format
12. Repository calls `addDoc(blueprintsCollection, data)`
13. Firestore Security Rules check: Is user authenticated? Is ownerId = currentUserId?
14. If rules pass, document created with auto-generated ID
15. Repository receives document ID
16. Repository transforms back to Blueprint model
17. Service updates Signal state with new blueprint
18. Facade returns success to Component
19. Component closes modal
20. Component shows success notification
21. Blueprint list auto-updates via Signal reactivity

**Success Criteria**:
- Blueprint created in Firestore
- User can see new blueprint in list
- Blueprint owned by user account
- Member automatically added with 'maintainer' role

**Error Scenarios**:
- **Invalid Input**: Show validation errors in modal
- **Permission Denied**: Show error notification
- **Network Failure**: Retry with exponential backoff
- **Firestore Error**: Log error and show user-friendly message

### Workflow 2: Organization Blueprint with Team Access

**Actors**: Organization Admin, Team Members

**Phase 1 - Create Organization Blueprint**:
1. Admin switches workspace context to Organization
2. Admin clicks "Create Blueprint"
3. Admin enters blueprint details
4. System validates admin has organization permission
5. Blueprint created with ownerType='organization', ownerId=orgId
6. Admin automatically added as maintainer

**Phase 2 - Grant Team Access**:
1. Admin opens blueprint settings
2. Admin navigates to "Team Access" tab
3. Admin clicks "Add Team"
4. Admin selects team from dropdown
5. Admin selects access level (read/write/admin)
6. Admin saves team role
7. TeamRole document created in `blueprints/{id}/teamRoles/{teamId}`
8. Team members notified of access grant

**Phase 3 - Team Member Access**:
1. Team member switches context to Team
2. System resolves team's parent organization
3. System queries blueprints where teamRole exists for this team
4. Firestore Security Rules validate team membership
5. Team member sees accessible blueprints in list
6. Team member opens blueprint
7. Team member can view/edit based on access level

**Phase 4 - Collaborative Editing**:
1. Team member edits task in blueprint
2. Firestore validates team's write permission
3. Task updated in Firestore
4. Real-time listener triggers for all connected clients
5. Organization admin sees update in real-time
6. Other team members see update in real-time

**Success Criteria**:
- Organization owns blueprint
- Team assigned with appropriate access level
- All team members can access blueprint
- Real-time collaboration works
- Permissions enforced at database level

---

## Firestore Data Model

### Collections Structure

```
firestore/
├── accounts/
│   └── {accountId}
│       ├── name
│       ├── email
│       ├── type: 'user'|'org'|'team'|'bot'
│       └── status
│
├── organizations/
│   └── {organizationId}
│       ├── accountId (FK)
│       ├── name
│       ├── slug
│       └── members/ (subcollection)
│
├── teams/
│   └── {teamId}
│       ├── organizationId (FK)
│       ├── name
│       └── members/ (subcollection)
│
└── blueprints/
    └── {blueprintId}
        ├── name
        ├── slug
        ├── ownerId (FK)
        ├── ownerType
        ├── isPublic
        ├── status
        ├── enabledModules[]
        ├── createdBy (FK)
        ├── createdAt
        ├── updatedAt
        ├── deletedAt?
        │
        ├── members/ (subcollection)
        │   └── {accountId}
        │       ├── role
        │       ├── businessRole
        │       ├── permissions
        │       └── grantedAt
        │
        ├── teamRoles/ (subcollection)
        │   └── {teamId}
        │       ├── access
        │       └── grantedAt
        │
        ├── tasks/ (subcollection)
        │   └── {taskId}
        │
        ├── logs/ (subcollection)
        │   └── {logId}
        │
        └── quality/ (subcollection)
            └── {qualityId}
```

### Key Design Decisions

1. **Subcollections for Scalability**
   - Tasks, logs, quality stored as subcollections
   - Prevents document size limits (1MB)
   - Allows independent scaling
   - Efficient queries

2. **Denormalization**
   - ownerType stored with ownerId for efficient queries
   - Some data duplicated to avoid joins
   - Trade-off: storage cost vs query performance

3. **Soft Deletes**
   - deletedAt field instead of hard delete
   - Enables recovery and audit
   - Filtered in queries with `where('deletedAt', '==', null)`

4. **Flexible Metadata**
   - JSON fields for extensibility
   - No schema changes for new features
   - Type-safe in TypeScript with interfaces

---

## Non-Functional Requirements

### Scalability

**Current Capacity**:
- Firestore: 1 million concurrent connections
- Firestore: 10,000 writes/second per database
- Document: 1 MB max size (mitigated by subcollections)
- Collections: Unlimited documents

**Scaling Strategies**:
- **Horizontal**: Firestore auto-scales
- **Sharding**: Manual sharding if >10K writes/sec needed
- **Caching**: Reduce read operations
- **Pagination**: Limit query results

### Performance

**Targets**:
- Page load: < 2 seconds
- Query response: < 500ms
- Write operations: < 1 second
- Real-time latency: < 100ms

**Optimizations**:
- CDN caching for static assets
- Client-side caching with IndexedDB
- Firestore query result caching
- Lazy loading and code splitting
- OnPush change detection
- Virtual scrolling for large lists

### Security

**Layers**:
1. Firebase Authentication (identity)
2. Firestore Security Rules (authorization)
3. HTTPS encryption (transport)
4. Data encryption at rest (storage)

**Best Practices**:
- Never trust client-side validation
- Validate all writes in Security Rules
- Principle of least privilege
- Audit logs for sensitive operations
- Regular security audits

### Reliability

**SLA Targets**:
- Uptime: 99.95%
- RTO: < 15 minutes
- RPO: < 5 minutes

**Strategies**:
- Multi-region replication
- Automated backups
- Health monitoring
- Error tracking and alerting
- Gradual rollout for deployments

### Maintainability

**Practices**:
- Clear code organization
- Comprehensive documentation
- Unit and integration tests
- Code review process
- Consistent coding standards
- TypeScript strict mode

---

## Risks and Mitigations

### Risk Matrix

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|---------|------------|
| Firestore Cost Escalation | Medium | High | Caching, pagination, monitoring |
| Security Rule Bugs | Medium | Critical | Testing, peer review, audits |
| Data Model Changes | High | Medium | Versioning, migrations, metadata |
| Scaling Limits | Low | High | Monitoring, sharding plan |
| Vendor Lock-in | High | Medium | Repository abstraction |

### Mitigation Details

**Firestore Cost**:
- Implement aggressive caching
- Use pagination for all list views
- Monitor usage with quotas
- Optimize queries with indexes
- Batch write operations

**Security**:
- Comprehensive rule testing
- Peer review all rule changes
- Use Firestore emulator for testing
- Regular security audits
- Incident response plan

**Data Model**:
- Schema versioning with version field
- Gradual migrations using Cloud Functions
- Maintain backward compatibility
- Metadata fields for extensibility

---

## Next Steps

### Immediate (Week 1-2)
- [ ] Create Firebase projects (dev, staging, prod)
- [ ] Initialize Firestore database
- [ ] Configure Firebase Authentication
- [ ] Set up project structure
- [ ] Write initial Security Rules

### Short-term (Week 3-4)
- [ ] Implement Repository layer
- [ ] Implement Service layer
- [ ] Implement Facade layer
- [ ] Create UI components
- [ ] Write unit tests
- [ ] Deploy to staging

### Medium-term (Month 2)
- [ ] Add organization support
- [ ] Implement team access
- [ ] Add additional modules
- [ ] Performance optimization
- [ ] Load testing

### Long-term (Month 3+)
- [ ] Blueprint templates
- [ ] Analytics dashboard
- [ ] Mobile optimization
- [ ] API integrations
- [ ] Production deployment

---

## Conclusion

This architecture provides a solid foundation for the Blueprint module, balancing:
- **Simplicity**: Clear layers and patterns
- **Scalability**: Cloud-native Firebase platform
- **Security**: Multi-layer protection
- **Maintainability**: Well-organized code
- **Performance**: Optimized for real-time collaboration

The phased development approach allows for incremental delivery of value while maintaining architectural integrity.

---

**Document Version**: 1.0
**Last Updated**: 2025-12-09
**Author**: GitHub Copilot (Senior Cloud Architect Agent)

---

## Advanced Architecture Components

### 1. Audit Logging System (操作紀錄)

**Purpose**: Track all significant operations for compliance, debugging, and security auditing.

**Architecture**:
```typescript
// Audit Log Interface
interface AuditLog {
  id: string;
  blueprintId: string;
  entityType: 'blueprint' | 'member' | 'task' | 'log' | 'quality';
  entityId: string;
  operation: 'create' | 'update' | 'delete' | 'access' | 'permission_grant';
  userId: string;
  userName: string;
  timestamp: Date;
  changes?: {
    before: Record<string, any>;
    after: Record<string, any>;
  };
  metadata: {
    ipAddress?: string;
    userAgent?: string;
    context?: string;
  };
}
```

**Firestore Structure**:
```
blueprints/
└── {blueprintId}/
    └── auditLogs/ (subcollection)
        └── {logId}
            ├── entityType
            ├── operation
            ├── userId
            ├── timestamp
            ├── changes
            └── metadata
```

**Implementation Strategy**:
1. **Firestore Triggers** (Cloud Functions):
```typescript
// functions/src/audit-triggers.ts
export const onBlueprintUpdate = functions.firestore
  .document('blueprints/{blueprintId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const blueprintId = context.params.blueprintId;
    
    await admin.firestore()
      .collection('blueprints')
      .doc(blueprintId)
      .collection('auditLogs')
      .add({
        entityType: 'blueprint',
        entityId: blueprintId,
        operation: 'update',
        userId: after.updatedBy,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        changes: { before, after },
        metadata: {
          context: 'firestore_trigger'
        }
      });
  });
```

2. **Client-side Service**:
```typescript
// src/app/shared/services/audit/audit.service.ts
@Injectable({ providedIn: 'root' })
export class AuditService {
  private firestore = inject(Firestore);
  
  async logOperation(log: Omit<AuditLog, 'id' | 'timestamp'>): Promise<void> {
    const blueprintRef = doc(this.firestore, 'blueprints', log.blueprintId);
    const auditLogsRef = collection(blueprintRef, 'auditLogs');
    
    await addDoc(auditLogsRef, {
      ...log,
      timestamp: Timestamp.now()
    });
  }
  
  queryAuditLogs(
    blueprintId: string, 
    options: AuditQueryOptions
  ): Observable<AuditLog[]> {
    // Implementation with filtering by date, user, operation type
  }
}
```

**Retention Policy**:
- Keep detailed logs for 90 days
- Archive to Cloud Storage for long-term retention (7 years for compliance)
- Implement data lifecycle policies in Firebase/GCS

---

### 2. Enhanced Permission Control (權限控管)

**Multi-layered Permission Model**:

```typescript
// Permission Hierarchy
enum PermissionLevel {
  SYSTEM = 0,      // System-level (Blueprint owner)
  ORGANIZATION = 1, // Organization-level
  TEAM = 2,        // Team-level
  USER = 3         // Individual user-level
}

interface Permission {
  id: string;
  blueprintId: string;
  subjectId: string;  // userId, teamId, or orgId
  subjectType: 'user' | 'team' | 'organization';
  level: PermissionLevel;
  
  // Granular permissions
  permissions: {
    // Blueprint-level
    blueprint: {
      read: boolean;
      update: boolean;
      delete: boolean;
      manageSettings: boolean;
      manageMembers: boolean;
      exportData: boolean;
    };
    
    // Module-level permissions
    modules: {
      tasks: ModulePermission;
      logs: ModulePermission;
      quality: ModulePermission;
      // ... other modules
    };
  };
  
  // Time-based permissions
  validFrom?: Date;
  validUntil?: Date;
  
  // Context restrictions
  restrictions?: {
    ipWhitelist?: string[];
    timeWindows?: TimeWindow[];
  };
}

interface ModulePermission {
  enabled: boolean;
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
  export: boolean;
}
```

**Permission Service**:
```typescript
@Injectable({ providedIn: 'root' })
export class PermissionService {
  private authService = inject(AuthService);
  private contextService = inject(WorkspaceContextService);
  
  /**
   * Check if current user has specific permission
   */
  async hasPermission(
    blueprintId: string,
    permission: string
  ): Promise<boolean> {
    const user = this.authService.currentUser();
    const context = this.contextService.currentContext();
    
    // Check permission hierarchy: System → Organization → Team → User
    const permissions = await this.resolvePermissions(blueprintId, user, context);
    return this.evaluatePermission(permissions, permission);
  }
  
  /**
   * Get effective permissions for current user
   */
  async getEffectivePermissions(
    blueprintId: string
  ): Promise<Permission> {
    // Aggregate permissions from all sources
    // Higher level permissions override lower level
  }
}
```

**Firestore Security Rules Enhancement**:
```javascript
// Enhanced permission checking with granular control
function hasModulePermission(blueprintId, moduleName, operation) {
  let accountId = getCurrentAccountId();
  let member = get(/databases/$(database)/documents/blueprints/$(blueprintId)/members/$(accountId));
  
  return member.data.permissions != null 
    && member.data.permissions.modules != null
    && member.data.permissions.modules[moduleName] != null
    && member.data.permissions.modules[moduleName][operation] == true;
}

// Apply to module subcollections
match /blueprints/{blueprintId}/tasks/{taskId} {
  allow create: if hasModulePermission(blueprintId, 'tasks', 'create');
  allow read: if hasModulePermission(blueprintId, 'tasks', 'read');
  allow update: if hasModulePermission(blueprintId, 'tasks', 'update');
  allow delete: if hasModulePermission(blueprintId, 'tasks', 'delete');
}
```

---

### 3. Configuration Management (設定管理)

**Configuration System Architecture**:

```typescript
// Configuration Schema
interface BlueprintConfiguration {
  id: string;
  blueprintId: string;
  version: number;
  
  // General settings
  general: {
    name: string;
    description: string;
    timezone: string;
    locale: string;
    dateFormat: string;
  };
  
  // Module configurations
  modules: {
    tasks: TaskModuleConfig;
    logs: LogModuleConfig;
    quality: QualityModuleConfig;
    // ... other modules
  };
  
  // Notification settings
  notifications: {
    email: boolean;
    push: boolean;
    inApp: boolean;
    channels: NotificationChannel[];
  };
  
  // Integration settings
  integrations: {
    webhooks: WebhookConfig[];
    apiKeys: ApiKeyConfig[];
    thirdParty: ThirdPartyIntegration[];
  };
  
  // Advanced settings
  advanced: {
    retentionPolicy: RetentionPolicy;
    autoArchive: boolean;
    autoArchiveDays: number;
    dataExport: DataExportConfig;
  };
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  updatedBy: string;
}

interface TaskModuleConfig {
  enabled: boolean;
  defaultStatus: string;
  customStatuses: string[];
  autoAssign: boolean;
  dueDateRequired: boolean;
  allowSubtasks: boolean;
  maxSubtaskDepth: number;
}
```

**Configuration Service**:
```typescript
@Injectable({ providedIn: 'root' })
export class ConfigurationService {
  private firestore = inject(Firestore);
  private cache = new Map<string, BlueprintConfiguration>();
  
  // Configuration with validation
  async updateConfiguration(
    blueprintId: string,
    updates: Partial<BlueprintConfiguration>
  ): Promise<void> {
    // Validate configuration
    const errors = await this.validateConfiguration(updates);
    if (errors.length > 0) {
      throw new ConfigurationValidationError(errors);
    }
    
    // Apply configuration with versioning
    const config = await this.getConfiguration(blueprintId);
    const newVersion = config.version + 1;
    
    await updateDoc(
      doc(this.firestore, 'blueprints', blueprintId, 'configuration', 'current'),
      {
        ...updates,
        version: newVersion,
        updatedAt: Timestamp.now()
      }
    );
    
    // Archive old version
    await this.archiveConfigVersion(blueprintId, config);
    
    // Clear cache
    this.cache.delete(blueprintId);
  }
  
  /**
   * Get configuration with caching
   */
  async getConfiguration(blueprintId: string): Promise<BlueprintConfiguration> {
    if (this.cache.has(blueprintId)) {
      return this.cache.get(blueprintId)!;
    }
    
    const configDoc = await getDoc(
      doc(this.firestore, 'blueprints', blueprintId, 'configuration', 'current')
    );
    
    const config = configDoc.data() as BlueprintConfiguration;
    this.cache.set(blueprintId, config);
    return config;
  }
}
```

**Configuration UI**:
- Settings page with tabs for each configuration category
- Real-time validation
- Preview before saving
- Configuration history and rollback capability

---

### 4. Module Lifecycle Management (模組生命週期管理)

**Module Lifecycle States**:
```typescript
enum ModuleState {
  UNINITIALIZED = 'uninitialized',
  INITIALIZING = 'initializing',
  ACTIVE = 'active',
  PAUSED = 'paused',
  STOPPING = 'stopping',
  STOPPED = 'stopped',
  ERROR = 'error'
}

interface ModuleLifecycle {
  moduleId: string;
  moduleName: string;
  state: ModuleState;
  version: string;
  
  // Lifecycle timestamps
  initializedAt?: Date;
  startedAt?: Date;
  stoppedAt?: Date;
  
  // Health status
  health: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    lastCheck: Date;
    metrics: ModuleMetrics;
  };
  
  // Dependencies
  dependencies: string[];
  dependents: string[];
}
```

**Module Manager Service**:
```typescript
@Injectable({ providedIn: 'root' })
export class ModuleLifecycleService {
  private modules = new Map<string, ModuleLifecycle>();
  private moduleInstances = new Map<string, any>();
  
  /**
   * Initialize module
   */
  async initializeModule(
    blueprintId: string,
    moduleType: ModuleType
  ): Promise<void> {
    const moduleId = `${blueprintId}_${moduleType}`;
    
    this.updateModuleState(moduleId, ModuleState.INITIALIZING);
    
    try {
      // Load module configuration
      const config = await this.loadModuleConfig(blueprintId, moduleType);
      
      // Check dependencies
      await this.checkDependencies(moduleType);
      
      // Create module instance
      const instance = await this.createModuleInstance(moduleType, config);
      
      // Initialize module
      await instance.initialize();
      
      this.moduleInstances.set(moduleId, instance);
      this.updateModuleState(moduleId, ModuleState.ACTIVE);
      
      // Start health monitoring
      this.startHealthMonitoring(moduleId);
      
    } catch (error) {
      this.updateModuleState(moduleId, ModuleState.ERROR);
      throw new ModuleInitializationError(moduleType, error);
    }
  }
  
  /**
   * Stop module gracefully
   */
  async stopModule(
    blueprintId: string,
    moduleType: ModuleType
  ): Promise<void> {
    const moduleId = `${blueprintId}_${moduleType}`;
    this.updateModuleState(moduleId, ModuleState.STOPPING);
    
    const instance = this.moduleInstances.get(moduleId);
    if (instance) {
      // Cleanup resources
      await instance.cleanup();
      
      // Unsubscribe listeners
      await instance.unsubscribe();
      
      this.moduleInstances.delete(moduleId);
    }
    
    this.updateModuleState(moduleId, ModuleState.STOPPED);
  }
  
  /**
   * Health check
   */
  async checkModuleHealth(moduleId: string): Promise<HealthStatus> {
    const instance = this.moduleInstances.get(moduleId);
    if (!instance) {
      return { status: 'unhealthy', reason: 'Module not found' };
    }
    
    return await instance.healthCheck();
  }
}
```

**Module Interface**:
```typescript
interface IModule {
  // Lifecycle methods
  initialize(): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
  cleanup(): Promise<void>;
  
  // Health check
  healthCheck(): Promise<HealthStatus>;
  
  // State management
  getState(): ModuleState;
  
  // Event handling
  onEvent(event: ModuleEvent): void;
}

// Base module class
abstract class BaseModule implements IModule {
  protected state: ModuleState = ModuleState.UNINITIALIZED;
  protected config: any;
  protected subscriptions: Subscription[] = [];
  
  async initialize(): Promise<void> {
    this.state = ModuleState.INITIALIZING;
    await this.onInitialize();
    this.state = ModuleState.ACTIVE;
  }
  
  abstract onInitialize(): Promise<void>;
  
  async cleanup(): Promise<void> {
    // Unsubscribe all
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }
  
  getState(): ModuleState {
    return this.state;
  }
}
```

---

### 5. Logging and Tracing (日誌與追蹤)

**Structured Logging System**:

```typescript
// Log levels
enum LogLevel {
  TRACE = 0,
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4,
  FATAL = 5
}

// Log entry structure
interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  source: string;
  message: string;
  blueprintId?: string;
  userId?: string;
  traceId?: string;
  spanId?: string;
  context?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

// Logger service
@Injectable({ providedIn: 'root' })
export class LoggerService {
  private logLevel: LogLevel = LogLevel.INFO;
  private transports: LogTransport[] = [];
  
  constructor() {
    // Initialize transports
    this.transports.push(new ConsoleTransport());
    this.transports.push(new FirestoreTransport());
    
    if (environment.production) {
      this.transports.push(new CloudLoggingTransport());
    }
  }
  
  trace(source: string, message: string, context?: any): void {
    this.log(LogLevel.TRACE, source, message, context);
  }
  
  debug(source: string, message: string, context?: any): void {
    this.log(LogLevel.DEBUG, source, message, context);
  }
  
  info(source: string, message: string, context?: any): void {
    this.log(LogLevel.INFO, source, message, context);
  }
  
  warn(source: string, message: string, context?: any): void {
    this.log(LogLevel.WARN, source, message, context);
  }
  
  error(source: string, message: string, error?: Error, context?: any): void {
    this.log(LogLevel.ERROR, source, message, {
      ...context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined
    });
  }
  
  private log(level: LogLevel, source: string, message: string, context?: any): void {
    if (level < this.logLevel) return;
    
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      source,
      message,
      traceId: this.getTraceId(),
      context
    };
    
    // Send to all transports
    this.transports.forEach(transport => transport.log(entry));
  }
  
  private getTraceId(): string {
    // Get or generate trace ID for request tracking
    return window['__traceId'] || this.generateTraceId();
  }
}
```

**Distributed Tracing**:
```typescript
@Injectable({ providedIn: 'root' })
export class TracingService {
  private activeSpans = new Map<string, Span>();
  
  startSpan(name: string, parentSpanId?: string): string {
    const span: Span = {
      id: this.generateSpanId(),
      traceId: this.getCurrentTraceId(),
      parentSpanId,
      name,
      startTime: performance.now(),
      tags: {},
      logs: []
    };
    
    this.activeSpans.set(span.id, span);
    return span.id;
  }
  
  finishSpan(spanId: string): void {
    const span = this.activeSpans.get(spanId);
    if (!span) return;
    
    span.endTime = performance.now();
    span.duration = span.endTime - span.startTime;
    
    // Send to tracing backend
    this.reportSpan(span);
    
    this.activeSpans.delete(spanId);
  }
  
  addTags(spanId: string, tags: Record<string, any>): void {
    const span = this.activeSpans.get(spanId);
    if (span) {
      span.tags = { ...span.tags, ...tags };
    }
  }
}
```

---

### 6. Error Handling Framework (錯誤處理框架)

**Error Hierarchy**:
```typescript
// Base error class
export class BlueprintError extends Error {
  constructor(
    message: string,
    public code: string,
    public severity: 'low' | 'medium' | 'high' | 'critical',
    public recoverable: boolean = true,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

// Domain-specific errors
export class PermissionDeniedError extends BlueprintError {
  constructor(resource: string, action: string) {
    super(
      `Permission denied: Cannot ${action} ${resource}`,
      'PERMISSION_DENIED',
      'high',
      false,
      { resource, action }
    );
  }
}

export class ValidationError extends BlueprintError {
  constructor(
    field: string,
    message: string,
    public errors: ValidationErrorDetail[]
  ) {
    super(
      `Validation failed for ${field}: ${message}`,
      'VALIDATION_ERROR',
      'low',
      true,
      { field, errors }
    );
  }
}

export class ModuleNotFoundError extends BlueprintError {
  constructor(moduleType: string) {
    super(
      `Module ${moduleType} not found or not enabled`,
      'MODULE_NOT_FOUND',
      'medium',
      true,
      { moduleType }
    );
  }
}
```

**Global Error Handler**:
```typescript
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private logger = inject(LoggerService);
  private notification = inject(NzNotificationService);
  private errorReporting = inject(ErrorReportingService);
  
  handleError(error: any): void {
    // Log error
    this.logger.error('GlobalErrorHandler', 'Unhandled error', error);
    
    // Report to error tracking service (Sentry, etc.)
    if (environment.production) {
      this.errorReporting.captureException(error);
    }
    
    // Show user-friendly notification
    if (error instanceof BlueprintError) {
      this.showErrorNotification(error);
    } else {
      this.showGenericError();
    }
    
    // Attempt recovery if possible
    if (error.recoverable) {
      this.attemptRecovery(error);
    }
  }
  
  private showErrorNotification(error: BlueprintError): void {
    const config = {
      low: { duration: 3000, type: 'warning' },
      medium: { duration: 5000, type: 'error' },
      high: { duration: 0, type: 'error' },
      critical: { duration: 0, type: 'error' }
    }[error.severity];
    
    this.notification.create(
      config.type as any,
      'Error',
      error.message,
      { nzDuration: config.duration }
    );
  }
}
```

**Error Boundary Component**:
```typescript
@Component({
  selector: 'app-error-boundary',
  template: `
    @if (hasError()) {
      <div class="error-boundary">
        <nz-result
          nzStatus="error"
          [nzTitle]="error()?.message"
          [nzSubTitle]="error()?.code"
        >
          <div nz-result-extra>
            <button nz-button nzType="primary" (click)="retry()">
              Retry
            </button>
            <button nz-button (click)="reset()">
              Reset
            </button>
          </div>
        </nz-result>
      </div>
    } @else {
      <ng-content />
    }
  `
})
export class ErrorBoundaryComponent {
  hasError = signal(false);
  error = signal<Error | null>(null);
  
  // Catch errors from child components
  captureError(error: Error): void {
    this.hasError.set(true);
    this.error.set(error);
  }
  
  retry(): void {
    this.hasError.set(false);
    this.error.set(null);
    // Trigger re-render
  }
  
  reset(): void {
    this.hasError.set(false);
    this.error.set(null);
    window.location.reload();
  }
}
```

---

### 7. Event System (事件系統)

**Event-Driven Architecture**:

```typescript
// Event types
export enum BlueprintEventType {
  // Blueprint events
  BLUEPRINT_CREATED = 'blueprint.created',
  BLUEPRINT_UPDATED = 'blueprint.updated',
  BLUEPRINT_DELETED = 'blueprint.deleted',
  
  // Member events
  MEMBER_ADDED = 'member.added',
  MEMBER_REMOVED = 'member.removed',
  MEMBER_ROLE_CHANGED = 'member.role_changed',
  
  // Module events
  MODULE_ENABLED = 'module.enabled',
  MODULE_DISABLED = 'module.disabled',
  
  // Task events
  TASK_CREATED = 'task.created',
  TASK_UPDATED = 'task.updated',
  TASK_COMPLETED = 'task.completed',
  
  // Custom events
  CUSTOM = 'custom'
}

// Event interface
export interface BlueprintEvent<T = any> {
  id: string;
  type: BlueprintEventType;
  blueprintId: string;
  timestamp: Date;
  userId: string;
  data: T;
  metadata?: Record<string, any>;
}

// Event bus service
@Injectable({ providedIn: 'root' })
export class EventBusService {
  private eventSubject = new Subject<BlueprintEvent>();
  private eventHandlers = new Map<BlueprintEventType, EventHandler[]>();
  
  /**
   * Publish event
   */
  publish<T>(event: Omit<BlueprintEvent<T>, 'id' | 'timestamp'>): void {
    const fullEvent: BlueprintEvent<T> = {
      ...event,
      id: this.generateEventId(),
      timestamp: new Date()
    };
    
    // Emit to subject
    this.eventSubject.next(fullEvent);
    
    // Call registered handlers
    const handlers = this.eventHandlers.get(event.type) || [];
    handlers.forEach(handler => {
      try {
        handler(fullEvent);
      } catch (error) {
        console.error(`Error in event handler for ${event.type}:`, error);
      }
    });
    
    // Persist event for audit
    this.persistEvent(fullEvent);
  }
  
  /**
   * Subscribe to events
   */
  subscribe(
    eventType: BlueprintEventType,
    handler: EventHandler
  ): () => void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    
    this.eventHandlers.get(eventType)!.push(handler);
    
    // Return unsubscribe function
    return () => {
      const handlers = this.eventHandlers.get(eventType);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }
  
  /**
   * Observable stream of all events
   */
  events$(): Observable<BlueprintEvent> {
    return this.eventSubject.asObservable();
  }
  
  /**
   * Observable stream of specific event type
   */
  eventsOfType$(type: BlueprintEventType): Observable<BlueprintEvent> {
    return this.eventSubject.asObservable().pipe(
      filter(event => event.type === type)
    );
  }
  
  private async persistEvent(event: BlueprintEvent): Promise<void> {
    // Save to Firestore events subcollection
    const blueprintRef = doc(firestore, 'blueprints', event.blueprintId);
    const eventsRef = collection(blueprintRef, 'events');
    await addDoc(eventsRef, event);
  }
}

type EventHandler = (event: BlueprintEvent) => void;
```

**Event-driven Module Communication**:
```typescript
// Example: Task module publishes event when task is completed
@Injectable({ providedIn: 'root' })
export class TaskService {
  private eventBus = inject(EventBusService);
  
  async completeTask(taskId: string): Promise<void> {
    // Update task status
    await this.updateTaskStatus(taskId, 'completed');
    
    // Publish event
    this.eventBus.publish({
      type: BlueprintEventType.TASK_COMPLETED,
      blueprintId: this.currentBlueprintId,
      userId: this.currentUserId,
      data: { taskId, completedAt: new Date() }
    });
  }
}

// Example: Log module subscribes to task completion events
@Injectable({ providedIn: 'root' })
export class LogService implements OnInit {
  private eventBus = inject(EventBusService);
  
  ngOnInit(): void {
    // Subscribe to task completion events
    this.eventBus.subscribe(
      BlueprintEventType.TASK_COMPLETED,
      (event) => this.onTaskCompleted(event)
    );
  }
  
  private async onTaskCompleted(event: BlueprintEvent): Promise<void> {
    // Automatically create log entry when task is completed
    await this.createLog({
      blueprintId: event.blueprintId,
      type: 'task_completion',
      content: `Task ${event.data.taskId} completed`,
      timestamp: event.timestamp
    });
  }
}
```

---

### 8. Data Validation and Sanitization (資料驗證與清洗)

**Validation Framework**:

```typescript
// Validation schema
export interface ValidationSchema {
  [field: string]: FieldValidator[];
}

export interface FieldValidator {
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  value?: any;
  message: string;
  validator?: (value: any) => boolean;
}

// Validator service
@Injectable({ providedIn: 'root' })
export class ValidationService {
  /**
   * Validate data against schema
   */
  validate(data: any, schema: ValidationSchema): ValidationResult {
    const errors: ValidationError[] = [];
    
    for (const [field, validators] of Object.entries(schema)) {
      const value = this.getFieldValue(data, field);
      
      for (const validator of validators) {
        const error = this.validateField(field, value, validator);
        if (error) {
          errors.push(error);
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  private validateField(
    field: string,
    value: any,
    validator: FieldValidator
  ): ValidationError | null {
    switch (validator.type) {
      case 'required':
        if (value === null || value === undefined || value === '') {
          return { field, message: validator.message };
        }
        break;
        
      case 'minLength':
        if (typeof value === 'string' && value.length < validator.value) {
          return { field, message: validator.message };
        }
        break;
        
      case 'maxLength':
        if (typeof value === 'string' && value.length > validator.value) {
          return { field, message: validator.message };
        }
        break;
        
      case 'pattern':
        if (typeof value === 'string' && !validator.value.test(value)) {
          return { field, message: validator.message };
        }
        break;
        
      case 'custom':
        if (validator.validator && !validator.validator(value)) {
          return { field, message: validator.message };
        }
        break;
    }
    
    return null;
  }
}

// Blueprint validation schema
export const BlueprintValidationSchema: ValidationSchema = {
  name: [
    { type: 'required', message: 'Name is required' },
    { type: 'minLength', value: 3, message: 'Name must be at least 3 characters' },
    { type: 'maxLength', value: 100, message: 'Name must not exceed 100 characters' }
  ],
  slug: [
    { type: 'required', message: 'Slug is required' },
    { 
      type: 'pattern', 
      value: /^[a-z0-9-]+$/, 
      message: 'Slug must contain only lowercase letters, numbers, and hyphens' 
    }
  ],
  description: [
    { type: 'maxLength', value: 500, message: 'Description must not exceed 500 characters' }
  ]
};
```

**Data Sanitization**:
```typescript
@Injectable({ providedIn: 'root' })
export class SanitizationService {
  private domSanitizer = inject(DomSanitizer);
  
  /**
   * Sanitize HTML content
   */
  sanitizeHtml(html: string): SafeHtml {
    return this.domSanitizer.sanitize(SecurityContext.HTML, html) || '';
  }
  
  /**
   * Sanitize user input for database storage
   */
  sanitizeInput(input: string): string {
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .substring(0, 10000); // Limit length
  }
  
  /**
   * Sanitize blueprint data before save
   */
  sanitizeBlueprint(blueprint: Partial<Blueprint>): Partial<Blueprint> {
    return {
      ...blueprint,
      name: blueprint.name ? this.sanitizeInput(blueprint.name) : undefined,
      description: blueprint.description ? this.sanitizeInput(blueprint.description) : undefined,
      slug: blueprint.slug ? this.sanitizeSlug(blueprint.slug) : undefined
    };
  }
  
  private sanitizeSlug(slug: string): string {
    return slug
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
}
```

---

### 9. Module Boundary Definition (模組邊界定義)

**Module Interface Contract**:

```typescript
// Module metadata
export interface ModuleMetadata {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  
  // Dependencies
  requires: ModuleDependency[];
  conflicts: string[];
  
  // Capabilities
  provides: string[];
  
  // API surface
  exports: ModuleExport[];
}

export interface ModuleDependency {
  moduleId: string;
  version: string;
  optional: boolean;
}

export interface ModuleExport {
  name: string;
  type: 'service' | 'component' | 'directive' | 'pipe';
  public: boolean;
}

// Module boundary enforcer
@Injectable({ providedIn: 'root' })
export class ModuleBoundaryService {
  private moduleRegistry = new Map<string, ModuleMetadata>();
  
  /**
   * Register module
   */
  registerModule(metadata: ModuleMetadata): void {
    // Check for conflicts
    this.checkConflicts(metadata);
    
    // Verify dependencies
    this.verifyDependencies(metadata);
    
    // Register
    this.moduleRegistry.set(metadata.id, metadata);
  }
  
  /**
   * Check if module can access another module's export
   */
  canAccess(
    consumerModuleId: string,
    providerModuleId: string,
    exportName: string
  ): boolean {
    const provider = this.moduleRegistry.get(providerModuleId);
    if (!provider) return false;
    
    const exportDef = provider.exports.find(e => e.name === exportName);
    if (!exportDef) return false;
    
    // Only public exports are accessible
    return exportDef.public;
  }
  
  /**
   * Get module dependencies
   */
  getDependencies(moduleId: string): ModuleMetadata[] {
    const module = this.moduleRegistry.get(moduleId);
    if (!module) return [];
    
    return module.requires
      .map(dep => this.moduleRegistry.get(dep.moduleId))
      .filter(Boolean) as ModuleMetadata[];
  }
}
```

**Module Isolation**:
```
Blueprint Module Structure:
┌────────────────────────────────────────────────┐
│ Blueprint Core (Container)                      │
│  - Provides: context, permissions, events      │
│  - Exposes: Public APIs only                   │
└────────────────────────────────────────────────┘
         │
         ├──────────────────┬──────────────────┬────────────────
         │                  │                  │
    ┌────▼─────┐      ┌────▼─────┐      ┌────▼─────┐
    │ Tasks    │      │ Logs     │      │ Quality  │
    │ Module   │      │ Module   │      │ Module   │
    │          │      │          │      │          │
    │ Private  │      │ Private  │      │ Private  │
    │ internal │      │ internal │      │ internal │
    │ state    │      │ state    │      │ state    │
    └──────────┘      └──────────┘      └──────────┘
```

Modules communicate ONLY through:
1. Blueprint Core APIs
2. Event System (loosely coupled)
3. Shared Services (dependency injection)

Modules CANNOT:
- Access another module's private state
- Import from another module's internal files
- Directly manipulate another module's data

---

### 10. Enhanced Documentation (文件化)

**Auto-generated API Documentation**:
```typescript
// JSDoc with TypeDoc
/**
 * Blueprint Repository
 * 
 * Provides data access layer for Blueprint entities.
 * 
 * @remarks
 * This repository implements the Repository pattern, abstracting Firestore
 * operations and providing type-safe data access methods.
 * 
 * @example
 * ```typescript
 * const repo = inject(BlueprintRepository);
 * const blueprint = await firstValueFrom(repo.findById('blueprint-123'));
 * ```
 * 
 * @public
 */
@Injectable({ providedIn: 'root' })
export class BlueprintRepository {
  /**
   * Find blueprint by ID
   * 
   * @param id - Blueprint unique identifier
   * @returns Observable of Blueprint or null if not found
   * 
   * @throws {FirestoreError} If database query fails
   * 
   * @example
   * ```typescript
   * repo.findById('abc-123').subscribe(blueprint => {
   *   console.log(blueprint);
   * });
   * ```
   */
  findById(id: string): Observable<Blueprint | null> {
    // Implementation
  }
}
```

**Component Documentation**:
- Storybook for UI component documentation
- Usage examples for each component
- Props documentation with types
- Accessibility notes

**Architecture Decision Records (ADR)**:
```markdown
# ADR-001: Use Firestore for Data Storage

## Status
Accepted

## Context
Need to choose a database for Blueprint data storage.

## Decision
Use Cloud Firestore as the primary database.

## Consequences
Positive:
- Real-time synchronization
- Automatic scaling
- Strong security rules
- Offline support

Negative:
- Cost at scale
- NoSQL learning curve
- Vendor lock-in

## Alternatives Considered
- PostgreSQL (traditional SQL)
- MongoDB (self-hosted NoSQL)
- DynamoDB (AWS NoSQL)
```

---

### 11. Observability (可觀察性)

**Metrics Collection**:
```typescript
@Injectable({ providedIn: 'root' })
export class MetricsService {
  private metrics = new Map<string, Metric>();
  
  /**
   * Record counter metric
   */
  incrementCounter(name: string, value: number = 1, tags?: Record<string, string>): void {
    const metric = this.getOrCreateMetric(name, 'counter');
    metric.value += value;
    metric.tags = { ...metric.tags, ...tags };
    metric.lastUpdated = Date.now();
  }
  
  /**
   * Record gauge metric
   */
  recordGauge(name: string, value: number, tags?: Record<string, string>): void {
    const metric = this.getOrCreateMetric(name, 'gauge');
    metric.value = value;
    metric.tags = { ...metric.tags, ...tags };
    metric.lastUpdated = Date.now();
  }
  
  /**
   * Record histogram metric
   */
  recordHistogram(name: string, value: number, tags?: Record<string, string>): void {
    const metric = this.getOrCreateMetric(name, 'histogram');
    metric.values.push(value);
    metric.tags = { ...metric.tags, ...tags };
    metric.lastUpdated = Date.now();
  }
  
  /**
   * Export metrics for monitoring
   */
  exportMetrics(): MetricExport[] {
    return Array.from(this.metrics.values()).map(metric => ({
      name: metric.name,
      type: metric.type,
      value: metric.value,
      values: metric.values,
      tags: metric.tags,
      timestamp: metric.lastUpdated
    }));
  }
}

// Usage examples
export class BlueprintService {
  private metrics = inject(MetricsService);
  
  async createBlueprint(request: CreateBlueprintRequest): Promise<Blueprint> {
    const startTime = performance.now();
    
    try {
      const blueprint = await this.repository.create(request);
      
      // Record success metrics
      this.metrics.incrementCounter('blueprint.created', 1, {
        ownerType: request.ownerType
      });
      
      this.metrics.recordHistogram(
        'blueprint.create.duration',
        performance.now() - startTime
      );
      
      return blueprint;
    } catch (error) {
      this.metrics.incrementCounter('blueprint.create.error', 1);
      throw error;
    }
  }
}
```

**Health Checks**:
```typescript
@Injectable({ providedIn: 'root' })
export class HealthCheckService {
  async checkHealth(): Promise<HealthStatus> {
    const checks = await Promise.all([
      this.checkFirestore(),
      this.checkAuth(),
      this.checkStorage(),
      this.checkModules()
    ]);
    
    const unhealthy = checks.filter(c => c.status !== 'healthy');
    
    return {
      status: unhealthy.length === 0 ? 'healthy' : 'unhealthy',
      checks,
      timestamp: new Date()
    };
  }
  
  private async checkFirestore(): Promise<HealthCheck> {
    try {
      await getDoc(doc(firestore, '_health', 'check'));
      return { name: 'firestore', status: 'healthy' };
    } catch (error) {
      return { name: 'firestore', status: 'unhealthy', error: error.message };
    }
  }
}
```

**Performance Monitoring**:
```typescript
// Performance interceptor
@Injectable()
export class PerformanceInterceptor implements HttpInterceptor {
  private metrics = inject(MetricsService);
  
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const startTime = performance.now();
    
    return next.handle(req).pipe(
      tap({
        next: () => {
          const duration = performance.now() - startTime;
          this.metrics.recordHistogram('http.request.duration', duration, {
            method: req.method,
            url: req.url
          });
        },
        error: (error) => {
          this.metrics.incrementCounter('http.request.error', 1, {
            method: req.method,
            url: req.url,
            status: error.status
          });
        }
      })
    );
  }
}
```

---

### 12. Hot-Swapping / Plugin Architecture (熱插拔)

**Plugin System**:

```typescript
// Plugin interface
export interface IPlugin {
  metadata: PluginMetadata;
  
  // Lifecycle hooks
  onLoad(): Promise<void>;
  onUnload(): Promise<void>;
  onEnable(): Promise<void>;
  onDisable(): Promise<void>;
  
  // Extension points
  extendBlueprint?(blueprint: Blueprint): void;
  registerRoutes?(): Route[];
  registerComponents?(): Type<any>[];
  registerServices?(): Provider[];
}

export interface PluginMetadata {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  
  // Requirements
  minBlueprintVersion: string;
  dependencies: PluginDependency[];
  
  // Permissions required
  permissions: string[];
}

// Plugin manager
@Injectable({ providedIn: 'root' })
export class PluginManager {
  private plugins = new Map<string, IPlugin>();
  private loader = inject(PluginLoader);
  
  /**
   * Load plugin dynamically
   */
  async loadPlugin(pluginId: string): Promise<void> {
    // Load plugin code
    const plugin = await this.loader.load(pluginId);
    
    // Verify permissions
    await this.verifyPermissions(plugin);
    
    // Check dependencies
    await this.checkDependencies(plugin);
    
    // Initialize
    await plugin.onLoad();
    
    // Register with system
    this.registerPlugin(plugin);
    
    // Enable
    await plugin.onEnable();
    
    this.plugins.set(pluginId, plugin);
  }
  
  /**
   * Unload plugin
   */
  async unloadPlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return;
    
    // Disable
    await plugin.onDisable();
    
    // Unregister
    this.unregisterPlugin(plugin);
    
    // Cleanup
    await plugin.onUnload();
    
    this.plugins.delete(pluginId);
  }
  
  /**
   * Hot reload plugin
   */
  async reloadPlugin(pluginId: string): Promise<void> {
    await this.unloadPlugin(pluginId);
    await this.loadPlugin(pluginId);
  }
  
  private registerPlugin(plugin: IPlugin): void {
    // Register routes
    if (plugin.registerRoutes) {
      const routes = plugin.registerRoutes();
      this.routeRegistry.addRoutes(routes);
    }
    
    // Register components
    if (plugin.registerComponents) {
      const components = plugin.registerComponents();
      this.componentRegistry.addComponents(components);
    }
    
    // Register services
    if (plugin.registerServices) {
      const providers = plugin.registerServices();
      this.injector.addProviders(providers);
    }
  }
}

// Example plugin
export class CustomReportPlugin implements IPlugin {
  metadata: PluginMetadata = {
    id: 'custom-report',
    name: 'Custom Report Generator',
    version: '1.0.0',
    author: 'GigHub Team',
    description: 'Generate custom reports for blueprints',
    minBlueprintVersion: '2.0.0',
    dependencies: [],
    permissions: ['blueprint:read', 'report:generate']
  };
  
  async onLoad(): Promise<void> {
    console.log('Custom Report Plugin loaded');
  }
  
  async onUnload(): Promise<void> {
    console.log('Custom Report Plugin unloaded');
  }
  
  async onEnable(): Promise<void> {
    // Register event listeners, etc.
  }
  
  async onDisable(): Promise<void> {
    // Cleanup event listeners, etc.
  }
  
  registerRoutes(): Route[] {
    return [
      {
        path: 'reports',
        component: CustomReportComponent
      }
    ];
  }
  
  registerServices(): Provider[] {
    return [
      CustomReportService
    ];
  }
}
```

**Dynamic Module Loading**:
```typescript
@Injectable({ providedIn: 'root' })
export class DynamicModuleLoader {
  private compiler = inject(Compiler);
  
  /**
   * Load module dynamically at runtime
   */
  async loadModule(modulePath: string): Promise<NgModuleRef<any>> {
    // Import module dynamically
    const moduleFactory = await import(modulePath);
    
    // Compile module
    const moduleRef = await this.compiler.compileModuleAsync(
      moduleFactory.default
    );
    
    // Create module instance
    return moduleRef.create(this.injector);
  }
}
```

---

## Implementation Roadmap

### Phase 1: Core Infrastructure (Weeks 1-2)
- [x] Audit Logging System
- [x] Enhanced Permission Control
- [x] Configuration Management
- [x] Error Handling Framework

### Phase 2: Monitoring & Operations (Weeks 3-4)
- [ ] Logging and Tracing
- [ ] Observability (Metrics, Health Checks)
- [ ] Event System
- [ ] Module Lifecycle Management

### Phase 3: Quality & Security (Weeks 5-6)
- [ ] Data Validation and Sanitization
- [ ] Module Boundary Enforcement
- [ ] Security Audits
- [ ] Performance Optimization

### Phase 4: Extensions (Weeks 7-8)
- [ ] Plugin Architecture
- [ ] Hot-Swapping Capability
- [ ] Enhanced Documentation
- [ ] Developer Tools

---

## Summary

This enhanced architecture document now includes:

1. ✅ **Audit Logging**: Complete audit trail for compliance
2. ✅ **Enhanced Permissions**: Granular, hierarchical permission model
3. ✅ **Configuration Management**: Versioned configuration with validation
4. ✅ **Module Lifecycle**: Full lifecycle management with health checks
5. ✅ **Logging & Tracing**: Structured logging with distributed tracing
6. ✅ **Error Handling**: Comprehensive error hierarchy and recovery
7. ✅ **Event System**: Event-driven architecture for module communication
8. ✅ **Data Validation**: Schema-based validation and sanitization
9. ✅ **Module Boundaries**: Clear boundaries with enforced contracts
10. ✅ **Documentation**: Auto-generated docs and ADRs
11. ✅ **Observability**: Metrics, health checks, and monitoring
12. ✅ **Plugin System**: Hot-swappable plugin architecture

All components are designed to work together cohesively, providing a robust, enterprise-grade Blueprint system.

