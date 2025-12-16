# Blueprint V2.0 Architecture Diagrams

**Version**: 2.0.0  
**Last Updated**: 2025-01-10

This document provides visual architecture diagrams for the Blueprint V2.0 system.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Component Architecture](#component-architecture)
3. [Module Lifecycle](#module-lifecycle)
4. [Event Flow](#event-flow)
5. [Dependency Resolution](#dependency-resolution)
6. [Data Flow](#data-flow)
7. [Deployment Architecture](#deployment-architecture)

---

## System Overview

### High-Level Architecture

```mermaid
graph TB
    subgraph "Blueprint V2.0 System"
        Container[Blueprint Container<br/>Orchestrator]
        
        subgraph "Core Components"
            Registry[Module Registry<br/>Dependency Resolution]
            Lifecycle[Lifecycle Manager<br/>State Machine]
            EventBus[Event Bus<br/>Zero-Coupling Comm]
            Resources[Resource Provider<br/>DI Container]
            Context[Shared Context<br/>Reactive State]
        end
        
        subgraph "Modules"
            Tasks[Tasks Module]
            Logs[Logs Module]
            Quality[Quality Module]
            Custom[Custom Modules...]
        end
        
        subgraph "Infrastructure"
            Firebase[Firebase/Firestore<br/>@angular/fire]
            Angular[Angular 20<br/>Signals + DI]
        end
    end
    
    Container --> Registry
    Container --> Lifecycle
    Container --> EventBus
    Container --> Resources
    Container --> Context
    
    Registry --> Tasks
    Registry --> Logs
    Registry --> Quality
    Registry --> Custom
    
    Lifecycle --> Tasks
    Lifecycle --> Logs
    Lifecycle --> Quality
    Lifecycle --> Custom
    
    Tasks -.->|events| EventBus
    Logs -.->|events| EventBus
    Quality -.->|events| EventBus
    Custom -.->|events| EventBus
    
    Tasks -.->|resources| Resources
    Logs -.->|resources| Resources
    Quality -.->|resources| Resources
    
    Tasks -.->|state| Context
    Logs -.->|state| Context
    Quality -.->|state| Context
    
    Resources --> Firebase
    Container --> Angular
    
    style Container fill:#1890ff,color:#fff
    style EventBus fill:#52c41a,color:#fff
    style Firebase fill:#ff7875,color:#fff
```

---

## Component Architecture

### Container Components

```mermaid
graph LR
    subgraph "Blueprint Container"
        Config[Configuration]
        Init[Initialization]
        
        subgraph "Core Services"
            MR[Module Registry]
            LM[Lifecycle Manager]
            EB[Event Bus]
            RP[Resource Provider]
            SC[Shared Context]
        end
        
        Start[Start Process]
        Stop[Stop Process]
        Dispose[Disposal]
    end
    
    Config --> Init
    Init --> MR
    Init --> LM
    Init --> EB
    Init --> RP
    Init --> SC
    
    MR --> Start
    LM --> Start
    
    Start --> Stop
    Stop --> Dispose
    
    style Config fill:#f0f0f0
    style Init fill:#e6f7ff
    style Start fill:#d9f7be
    style Stop fill:#ffe7ba
    style Dispose fill:#ffa39e
```

### Module Registry Architecture

```mermaid
graph TB
    subgraph "Module Registry"
        Register[register<br/>Module]
        Store[Internal Storage<br/>Map<id, module>]
        
        subgraph "Dependency Resolution"
            TopoSort[Topological Sort<br/>Kahn's Algorithm]
            CircularCheck[Circular Detection<br/>DFS Algorithm]
        end
        
        GetModule[get<br/>Retrieve Module]
        GetDeps[getDependencies<br/>Direct Dependencies]
        GetAllDeps[getAllDependencies<br/>Transitive]
        Resolve[resolveDependencies<br/>Load Order]
    end
    
    Register --> Store
    Store --> GetModule
    Store --> GetDeps
    Store --> GetAllDeps
    Store --> Resolve
    
    Resolve --> TopoSort
    Resolve --> CircularCheck
    
    TopoSort --> LoadOrder[Load Order Array]
    CircularCheck --> CircularPaths[Circular Paths]
    
    style Register fill:#e6f7ff
    style TopoSort fill:#d9f7be
    style CircularCheck fill:#ffe7ba
```

---

## Module Lifecycle

### State Machine Diagram

```mermaid
stateDiagram-v2
    [*] --> Uninitialized
    
    Uninitialized --> Initialized: init(context)
    
    Initialized --> Starting: start()
    Starting --> Started: (automatic)
    
    Started --> Ready: ready()
    
    Ready --> Stopping: stop()
    Stopping --> Stopped: (automatic)
    
    Stopped --> Disposed: dispose()
    Disposed --> [*]
    
    note right of Initialized
        Module receives
        execution context
    end note
    
    note right of Ready
        Module is fully
        operational
    end note
    
    note right of Disposed
        All resources
        cleaned up
    end note
```

### Lifecycle Flow

```mermaid
sequenceDiagram
    participant Container
    participant Lifecycle
    participant Module
    participant EventBus
    
    Container->>Lifecycle: initialize(module, context)
    Lifecycle->>Module: init(context)
    Module-->>Lifecycle: Promise<void>
    Lifecycle->>EventBus: emit('MODULE_INITIALIZED')
    Lifecycle-->>Container: Success
    
    Container->>Lifecycle: start(moduleId)
    Lifecycle->>Module: start()
    Module-->>Lifecycle: Promise<void>
    Lifecycle->>EventBus: emit('MODULE_STARTED')
    Lifecycle-->>Container: Success
    
    Container->>Lifecycle: ready(moduleId)
    Lifecycle->>Module: ready()
    Module-->>Lifecycle: Promise<void>
    Lifecycle->>EventBus: emit('MODULE_READY')
    Lifecycle-->>Container: Success
    
    Note over Container,EventBus: Module is now ready to use
    
    Container->>Lifecycle: stop(moduleId)
    Lifecycle->>Module: stop()
    Module-->>Lifecycle: Promise<void>
    Lifecycle->>EventBus: emit('MODULE_STOPPED')
    Lifecycle-->>Container: Success
    
    Container->>Lifecycle: dispose(moduleId)
    Lifecycle->>Module: dispose()
    Module-->>Lifecycle: Promise<void>
    Lifecycle->>EventBus: emit('MODULE_DISPOSED')
    Lifecycle-->>Container: Success
```

---

## Event Flow

### Event Bus Architecture

```mermaid
graph TB
    subgraph "Event Bus"
        Emit[emit<br/>Publish Event]
        Stream[RxJS Subject<br/>Central Stream]
        
        subgraph "Subscriptions"
            On[on<br/>Permanent]
            Once[once<br/>One-time]
            Off[off<br/>Unsubscribe]
        end
        
        Filter[Event Filtering<br/>by Type]
        History[Event History<br/>Max 1000]
        Counter[Event Counter<br/>Signal]
    end
    
    Emit --> Stream
    Stream --> Filter
    Filter --> On
    Filter --> Once
    
    Emit --> History
    Emit --> Counter
    
    On --> Handler1[Handler Function]
    Once --> Handler2[Handler Function]
    
    Handler1 --> Off
    Handler2 -.->|auto| Off
    
    style Emit fill:#e6f7ff
    style Stream fill:#d9f7be
    style History fill:#ffe7ba
```

### Module Communication Pattern

```mermaid
sequenceDiagram
    participant TasksModule
    participant EventBus
    participant LogsModule
    participant NotificationsModule
    
    TasksModule->>EventBus: emit('TASK_CREATED', taskData, 'tasks-module')
    
    Note over EventBus: Event distributed<br/>to all subscribers
    
    EventBus->>LogsModule: on('TASK_CREATED') handler
    LogsModule->>LogsModule: createLog("Task created")
    LogsModule->>EventBus: emit('LOG_CREATED', logData, 'logs-module')
    
    EventBus->>NotificationsModule: on('TASK_CREATED') handler
    NotificationsModule->>NotificationsModule: sendNotification()
    
    Note over TasksModule,NotificationsModule: Zero coupling between modules
```

---

## Dependency Resolution

### Dependency Graph Resolution

```mermaid
graph TB
    subgraph "Module Dependencies"
        Tasks[Tasks Module<br/>No dependencies]
        Logs[Logs Module<br/>Depends on: Tasks]
        Quality[Quality Module<br/>Depends on: Tasks, Logs]
        Reports[Reports Module<br/>Depends on: Quality]
    end
    
    Tasks --> Logs
    Tasks --> Quality
    Logs --> Quality
    Quality --> Reports
    
    subgraph "Resolution Result"
        Order["Load Order:<br/>1. Tasks<br/>2. Logs<br/>3. Quality<br/>4. Reports"]
    end
    
    Tasks -.-> Order
    Logs -.-> Order
    Quality -.-> Order
    Reports -.-> Order
    
    style Tasks fill:#d9f7be
    style Logs fill:#d9f7be
    style Quality fill:#d9f7be
    style Reports fill:#d9f7be
    style Order fill:#e6f7ff
```

### Circular Dependency Detection

```mermaid
graph TB
    subgraph "Circular Dependency Example"
        A[Module A<br/>depends on: B]
        B[Module B<br/>depends on: C]
        C[Module C<br/>depends on: A]
    end
    
    A -->|dependency| B
    B -->|dependency| C
    C -->|dependency| A
    
    Detection[DFS Detection<br/>Found cycle: A→B→C→A]
    
    A -.-> Detection
    B -.-> Detection
    C -.-> Detection
    
    Error[❌ CircularDependencyError<br/>Cannot load modules]
    
    Detection --> Error
    
    style A fill:#ffa39e
    style B fill:#ffa39e
    style C fill:#ffa39e
    style Detection fill:#ffe7ba
    style Error fill:#ff4d4f,color:#fff
```

---

## Data Flow

### Complete Data Flow

```mermaid
flowchart TB
    subgraph "User Interaction"
        UI[Angular Component]
    end
    
    subgraph "Blueprint Container"
        Module[Module<br/>Business Logic]
        EventBus[Event Bus]
        Context[Shared Context]
    end
    
    subgraph "Data Layer"
        Resources[Resource Provider]
        Firestore[Firestore]
    end
    
    UI -->|User Action| Module
    Module -->|Get Resource| Resources
    Resources -->|Return Firestore| Module
    Module -->|Query/Update| Firestore
    Firestore -->|Data| Module
    Module -->|setState| Context
    Module -->|emit Event| EventBus
    EventBus -->|Notify| OtherModules[Other Modules]
    Context -->|getStateSignal| UI
    
    style UI fill:#e6f7ff
    style Module fill:#d9f7be
    style Firestore fill:#ffa39e
```

### Resource Provider Flow

```mermaid
sequenceDiagram
    participant Module
    participant ResourceProvider
    participant Factory
    participant FirestoreInstance
    
    Module->>ResourceProvider: get('firestore')
    
    alt Resource exists in cache
        ResourceProvider-->>Module: Return cached instance
    else Resource not instantiated
        ResourceProvider->>Factory: Call factory function
        Factory->>FirestoreInstance: Create instance
        FirestoreInstance-->>Factory: Instance
        Factory-->>ResourceProvider: Instance
        ResourceProvider->>ResourceProvider: Cache instance
        ResourceProvider-->>Module: Return new instance
    end
    
    Note over Module,FirestoreInstance: Lazy loading with caching
```

---

## Deployment Architecture

### Production Deployment

```mermaid
graph TB
    subgraph "Client (Browser)"
        Angular[Angular 20 App<br/>Standalone Components]
        Blueprint[Blueprint Container]
        Modules[Loaded Modules]
    end
    
    subgraph "Firebase Platform"
        Auth[Firebase Auth]
        Firestore[Cloud Firestore]
        Storage[Cloud Storage]
        Functions[Cloud Functions]
        Hosting[Firebase Hosting]
    end
    
    subgraph "CI/CD"
        GitHub[GitHub Actions]
        Build[Build Process]
        Test[Test Suite]
        Deploy[Deploy]
    end
    
    Angular --> Blueprint
    Blueprint --> Modules
    
    Modules <-->|@angular/fire| Auth
    Modules <-->|@angular/fire| Firestore
    Modules <-->|@angular/fire| Storage
    Modules <-->|HTTP| Functions
    
    Angular -->|Hosted on| Hosting
    
    GitHub --> Build
    Build --> Test
    Test --> Deploy
    Deploy --> Hosting
    
    style Angular fill:#e6f7ff
    style Blueprint fill:#d9f7be
    style Firestore fill:#ffa39e
    style Hosting fill:#ffe7ba
```

### Multi-Tenant Architecture

```mermaid
graph TB
    subgraph "Client Applications"
        Org1[Organization 1<br/>Blueprint Instance]
        Org2[Organization 2<br/>Blueprint Instance]
        Org3[Organization 3<br/>Blueprint Instance]
    end
    
    subgraph "Shared Infrastructure"
        subgraph "Firestore Collections"
            OrgData[/organizations/{orgId}]
            TeamData[/teams/{teamId}]
            UserData[/users/{userId}]
        end
        
        subgraph "Security"
            RLS[Row Level Security<br/>Firestore Rules]
            Auth[Firebase Auth<br/>Identity Management]
        end
    end
    
    Org1 -->|Isolated Data| OrgData
    Org2 -->|Isolated Data| OrgData
    Org3 -->|Isolated Data| OrgData
    
    OrgData --> RLS
    TeamData --> RLS
    UserData --> RLS
    
    Org1 --> Auth
    Org2 --> Auth
    Org3 --> Auth
    
    Auth --> RLS
    
    style Org1 fill:#e6f7ff
    style Org2 fill:#e6f7ff
    style Org3 fill:#e6f7ff
    style RLS fill:#ffa39e
```

---

## Component Interaction Diagram

### Complete System Interaction

```mermaid
sequenceDiagram
    participant User
    participant Component
    participant Container
    participant Module
    participant EventBus
    participant Firestore
    
    User->>Component: User Action
    Component->>Module: Call Module API<br/>(via exports)
    
    Module->>Firestore: Query/Update Data
    Firestore-->>Module: Data Response
    
    Module->>EventBus: Emit Event
    EventBus->>OtherModules: Notify Subscribers
    
    Module->>SharedContext: Update State
    SharedContext-->>Component: Signal Update
    
    Component-->>User: UI Update
    
    Note over User,Firestore: Complete request/response cycle
```

---

## Performance Architecture

### Optimization Strategies

```mermaid
graph TB
    subgraph "Performance Optimizations"
        LazyLoad[Lazy Loading<br/>Resources on demand]
        EventCache[Event History<br/>Max 1000 events]
        SignalOpt[Signals<br/>Fine-grained reactivity]
        OnPush[OnPush Detection<br/>Optimized rendering]
        
        subgraph "Caching Layers"
            ResourceCache[Resource Cache<br/>Singleton instances]
            StateCache[State Cache<br/>Shared Context]
        end
        
        subgraph "Monitoring"
            PerfMetrics[Performance Metrics]
            EventCount[Event Counter]
            ModuleCount[Module Counter]
        end
    end
    
    LazyLoad --> ResourceCache
    EventCache --> PerfMetrics
    SignalOpt --> OnPush
    
    ResourceCache --> ModuleCount
    StateCache --> PerfMetrics
    
    style LazyLoad fill:#d9f7be
    style SignalOpt fill:#d9f7be
    style PerfMetrics fill:#e6f7ff
```

---

## Summary

### Key Architectural Principles

1. **Zero Coupling**: Modules communicate only via Event Bus
2. **Dependency Resolution**: Automatic with topological sort
3. **Lifecycle Management**: Robust state machine
4. **Resource Sharing**: DI container with lazy loading
5. **Reactive State**: Angular Signals for fine-grained reactivity
6. **Multi-Tenant**: Isolated data with Firestore Security Rules
7. **Performance**: Optimized with caching and lazy loading
8. **Scalability**: Infinite module extensibility

---

## Additional Resources

- **API Reference**: [BLUEPRINT_V2_API_REFERENCE.md](./BLUEPRINT_V2_API_REFERENCE.md)
- **Usage Examples**: [BLUEPRINT_V2_USAGE_EXAMPLES.md](./BLUEPRINT_V2_USAGE_EXAMPLES.md)
- **Migration Guide**: [BLUEPRINT_V2_MIGRATION_GUIDE.md](./BLUEPRINT_V2_MIGRATION_GUIDE.md)
- **Specification**: [blueprint-v2-specification.md](./blueprint-v2-specification.md)

---

**Last Updated**: 2025-01-10  
**Version**: 2.0.0  
**Format**: Mermaid Diagrams
