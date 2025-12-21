---

# GigHub Project – AGENTS.md

This document defines **how AI coding agents must behave** when working on the GigHub project.  
It is **not** a README and **not** a tutorial.

---

## 1. Project Overview

**GigHub** is an enterprise-level construction site progress and management system built with Angular and Firebase.

### Technology Stack

- **Frontend**: Angular 20 (Standalone Components + Signals)
- **Admin Framework**: ng-alain 20.x (@delon/*)
- **UI Library**: ng-zorro-antd 20.x
- **Backend Platform**: Firebase
  - Authentication: Firebase Auth
  - Database: Firestore
  - Storage: Firebase Storage
- **Integration**: @angular/fire
- **Language**: TypeScript (strict mode)
- **Reactive**: RxJS 7.x
- **Package Manager**: Yarn 4.x

### Core Backend Principle

> **Firestore is the single source of truth.**  
> All application data (blueprints, tasks, logs, permissions) lives in Firestore and is accessed via `@angular/fire`.

---

## 2. Architectural Philosophy

This project follows an **Angular + Firebase native architecture**.

### Practical Three-Layer Model

Component (UI) ↓ Domain Service (Use Case + State) ↓ Firestore Access (@angular/fire)

**Rules**
- Domain Services may access Firestore **directly via `@angular/fire`**
- No artificial backend-style layering
- Favor cohesion over abstraction

---

## 3. When Repositories Exist (Optional)

Repositories are **NOT mandatory**.

Introduce a repository **only** when:

- Cross-collection aggregation is required
- Permission translation logic is complex
- Data logic must be isolated for testing
- Blueprint / Container-level orchestration is involved

**Otherwise:**  
👉 Use `@angular/fire` directly inside Domain Services.

---

## 4. Domain Structure

### Domain Layers

- **Foundation Layer**  
  Auth, Account, Organization, Team
- **Container Layer**  
  Blueprint, Permissions, Events, Configuration
- **Business Layer**  
  Tasks, Diary, Quality Control, Finance

### Directory Rules

src/app/ ├─ core/ │  ├─ models/ │  ├─ services/ │  ├─ stores/            (signals-based) │  └─ blueprint/ │     ├─ services/ │     ├─ repositories/  (optional, advanced cases only) │     └─ modules/ ├─ features/ ├─ routes/ ├─ shared/               (UI only) └─ layout/

---

## 5. Angular Development Rules

### Components

**Must**
- Use **Standalone Components**
- Use `ChangeDetectionStrategy.OnPush`
- Use Signals for local state
- Import shared modules via `SHARED_IMPORTS`

**Forbidden**
- NgModules
- Business logic inside components
- Manual change detection

---

### Services (Domain Services)

**Rules**
- Services represent **use cases + state**
- May access Firestore directly via `@angular/fire`
- Must use `inject()` for dependency injection
- Must be singleton (`providedIn: 'root'`)

---

## 6. Firestore Usage Rules

**Must**
- Use `@angular/fire` primitives (`collectionData`, `docData`, etc.)
- Prefer observable → signal conversion
- Keep Firestore queries close to domain meaning

**Forbidden**
- Raw REST or SDK wrappers
- Direct Firestore access from components
- Duplicating Firestore APIs inside fake repositories

---

## 7. State Management

**Rules**
- Local state → `signal()`
- Derived state → `computed()`
- Shared state → Domain Services
- Real-time sync via Firestore snapshots
- No NgRx / Redux / external state libraries

---

## 8. Permission System

### Blueprint Roles

- **Owner** – full control
- **Maintainer** – manage members and settings
- **Contributor** – edit content
- **Viewer** – read-only

**Rules**
- UI checks via `permissionService`
- Guards enforce role access
- Firestore Security Rules are authoritative

---

## 9. Event-Driven Architecture

**Rules**
- All domain events flow through `BlueprintEventBus`
- Event naming: `[module].[action]`
- Event payload must include:
  - `type`
  - `blueprintId`
  - `timestamp`
  - `actor`
  - `data`
- Subscriptions must use `takeUntilDestroyed()`

---

## 10. Error Handling Standards

**Four Layers**
1. UI – Error Boundary Component
2. Service – try/catch
3. Firestore – error normalization
4. Global – GlobalErrorHandler

**Rules**
- Errors must be typed (extend `BlueprintError`)
- Errors must include context
- Silent failure is forbidden

---

## 11. Lifecycle Rules

**Rules**
- No logic in constructors
- No manual subscription management
- Cleanup via `takeUntilDestroyed()`
- No async work in `ngOnDestroy`

---

## 12. Module Extension Rules

When adding a new module:

1. Create module directory + `AGENTS.md`
2. Define models in `core/models`
3. Implement Domain Service (Firestore-first)
4. Add Repository **only if justified**
5. Register lazy-loaded routes
6. Emit domain events
7. Update Firestore Security Rules
8. Add unit tests

---

## 13. AI Agent Rules

### Forbidden Actions

- Creating NgModules
- Using NgRx / Redux
- Adding Facade layers
- Using `any`
- Forcing repository layers
- Direct Firestore access from components
- Ignoring error handling
- Bypassing permission checks

### Mandatory Actions

- Use Signals
- Use `inject()`
- Prefer Service-first design
- Respect Firestore-native patterns
- Update AGENTS.md when behavior changes

---

## 14. Decision Guidelines

- Need state? → `signal()`
- Need derived state? → `computed()`
- Need subscription? → `takeUntilDestroyed()`
- Need repository? → justify first
- Error occurs?
  - Recoverable → typed recoverable error
  - Fatal → typed non-recoverable error

---

## 15. Core Principles

1. Firestore-first, not backend-mimicry
2. High cohesion over abstraction
3. Type safety everywhere
4. Security enforced at Firestore Rules
5. Documentation is mandatory
6. Performance via Signals, OnPush, lazy loading

---

**Version**: 1.2.0  
**Last Updated**: 2025-12-21  
**Scope**: Repository Root  
**Audience**: GitHub Copilot Agent / AI Coding Agents


---

