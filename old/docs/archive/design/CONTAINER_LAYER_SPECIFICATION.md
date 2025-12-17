# Expandable Container Layer Specification (Spec.md)

## 1. Overview

A **Container Layer** is a logical execution environment that isolates modules, provides shared context, manages lifecycle, and enables unlimited extensibility through a pluggable architecture. It is used as the foundation for Blueprint-based systems, multi-tenant SaaS environments, and modular workflow/agent platforms.

The Container is responsible for:

* Dynamic module loading
* Context management
* Dependency provisioning
* Event routing
* Module lifecycle coordination

This specification defines the structure, responsibilities, interfaces, and operational rules of a fully extensible container layer.

---

## 2. Goals

* Support unlimited modular expansion
* Decouple all modules from each other
* Allow dynamic module addition, removal, versioning, and replacement
* Provide cross-module shared data context
* Provide a unified dependency injection layer
* Support tenant-level isolation (Organization / User / Team)
* Enable Blueprint configurations that define container behavior

---

## 3. Container Architecture

```
Container (Blueprint Instance)
 ├── Module Registry
 ├── Shared Context
 ├── Resource Provider
 ├── Lifecycle Manager
 └── Event Bus
```

### 3.1 Module Registry

Responsible for:

* Module metadata
* Version resolution
* Loading/unloading modules

**Registry responsibilities:**

* Validate module interface
* Track loaded modules
* Manage module scope (Blueprint-level)

---

### 3.2 Shared Context

The Shared Context is a global key-value and service layer accessible by all modules.

Context includes:

* Tenant data (Organization, Team, User)
* Blueprint config
* Scoped state (runtime session state)
* Global resources (db, cache, logger)

Rules:

1. Modules MUST NOT store internal logic in context.
2. Context MUST be immutable except by container APIs.
3. Context SHOULD expose `use(resourceName)` for dependency access.

---

### 3.3 Resource Provider (Dependency Injection)

Provides:

* Database connections
* HTTP clients
* Storage
* KV / Cache
* Logging
* Tool adapters

Rules:

* All module dependencies MUST be resolved through the provider.
* No module shall instantiate its own external resource.

---

### 3.4 Lifecycle Manager

Defines and manages module lifecycle:

* `init(containerContext)`
* `start()`
* `ready()`
* `stop()`
* `dispose()`

Rules:

* Container MUST enforce lifecycle order.
* A module that fails `init()` MUST NOT be started.

---

### 3.5 Event Bus

A module-to-module communication mechanism.

Event Bus guarantees:

* Strict decoupling: No module can directly call another.
* All communication flows through publish/subscribe.

Event Format:

```
{
  type: string,
  payload: any,
  timestamp: number,
  context: ExecutionContext
}
```

---

## 4. Module Specification

### 4.1 Module Interface

```
interface Module {
  name: string;
  version: string;
  init(context): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
  exports?: Record<string, any>;
}
```

### 4.2 Module Metadata

Metadata file (module.yml):

```
name: tasks
version: 1.0.0
dependencies:
  - context
  - logging
```

### 4.3 Module Directories

```
/modules
  /tasks
    index.ts
    module.yml
    schema.sql
    config.yml
```

---

## 5. Blueprint Specification

A Blueprint defines a logical container instance.

### 5.1 Blueprint File

```
blueprint:
  name: Project Management
  version: 1.2.0
modules:
  - context
  - logging
  - tasks
  - workflow
  - scheduler
config:
  featureFlags:
    enableWorkflow: true
```

### 5.2 Blueprint Lifecycle

1. Validate blueprint
2. Resolve modules
3. Load container
4. Apply config
5. Start lifecycle manager
6. Expose API

---

## 6. Operational Rules

### 6.1 Decoupling Rules

* No module may import another module directly.
* All communication via Event Bus.
* All shared data via Context.
* All dependencies via Resource Provider.

### 6.2 Versioning Rules

* Major version changes require explicit Blueprint update.
* Containers may run multiple versions of the same module type (scoped).

### 6.3 Tenant Isolation

* Context must isolate Organization, Team, and User.
* Resource Provider must issue scoped credentials.

---

## 7. Error Handling

* Module failure in `init()` → block load
* Module failure in `start()` → rollback container
* Module runtime errors MUST NOT crash container

---

## 8. Security Model

* Module sandboxing
* No direct DB access
* Only Resource Provider can hold secrets
* All events validated before dispatch

---

## 9. Extensibility Guidelines

To add a new module:

1. Create module folder
2. Implement Module Interface
3. Add metadata file
4. Register module in registry
5. Reference in Blueprint

No existing code shall be modified when adding a new module.

---

## 10. Reference Example: Notification Module

```
name: notifications
version: 1.0.0
```

Events subscribed:

* TASK_CREATED
* WORKFLOW_TRANSITION

Exports:

* sendNotification()

No other module needs modification.

---

## End of Spec
