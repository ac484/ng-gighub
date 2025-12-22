---

# Blueprint Module Template (Angular v20 + @angular/fire)

## 1️⃣ Standard Module Structure

```
src/app/routes/blueprint/modules/feature/
│
├─ feature.module.ts                  # Angular Module
├─ feature-routing.module.ts          # Lazy load Routing
│
├─ components/                        # All UI Components
│   ├─ list/                           # List page components
│   │   ├─ feature-list.component.ts
│   │   ├─ feature-list.component.html
│   │   └─ feature-list.component.scss
│   ├─ edit/                           # Edit / Create page components
│   │   ├─ feature-edit.component.ts
│   │   ├─ feature-edit.component.html
│   │   └─ feature-edit.component.scss
│   └─ detail/                         # Detail / Drawer page components
│       ├─ feature-detail.component.ts
│       ├─ feature-detail.component.html
│       └─ feature-detail.component.scss
│
├─ services/                          # Business logic and data access
│   ├─ feature.service.ts             # Core Firestore / API wrapper
│   └─ feature.facade.ts              # Unified interface for external use
│
├─ models/                            # Value Objects / DTO
│   └─ feature.model.ts
│
├─ state/                             # State management (Signal / RxJS / NgRx)
│   ├─ feature.store.ts
│   └─ feature.query.ts
│
└─ utils/                             # Utility functions
    └─ feature.helpers.ts
```

---

## 2️⃣ Core Principles

1. **Single Responsibility (SRP)**
   Each module focuses on a single responsibility (e.g., Contracts, Tasks, User Settings).

2. **Clear Boundaries and Interfaces**

   * Use services or facades for external access.
   * Do not allow direct manipulation of internal state or Firestore collections.

3. **Plug-and-Play / Extensible Design**

   * Support `forRoot()` / `forFeature()` static methods for dependency injection.
   * Lazy loading reduces tight coupling between modules.

4. **Centralized Data Access Layer**

   * Firestore or API operations go through service/repository.
   * Swapping data sources does not affect module logic.

---

## 3️⃣ Extensibility Considerations

1. **Adding Sub-Modules**

   * Example: `installments-module`, `audit-log-module`.
   * Use lazy loading and `forFeature()` pattern.

2. **State Management**

   * Use Signals, RxJS, or NgRx for shared module state.
   * Avoid repeated Firestore reads.

3. **Permissions and Roles**

   * Abstract permission logic via `PermissionsService` or `NgxPermissions` + Firebase Claims.
   * Standard checks like `canEditContract(user, contract)`.

4. **Shared UI Components**

   * Tables, PDF viewers, attachments, timelines should live in `shared/components` for reuse.

---

## 4️⃣ Sub-Modules Guidelines

* Each sub-module should be self-contained with its own services, state, and components.
* Lazy load whenever possible to optimize performance.
* Expose a facade to wrap service layer, preventing direct dependency on internal implementations.
* Maintain consistent naming for folders, components, services, and models.

---

## 5️⃣ Notes / Best Practices

* Keep all modules consistent in structure to make onboarding and expansion easier.
* Optional folders (`state`, `utils`) can be left empty but preserve the folder for consistency.
* Service → Facade → Component flow should always be maintained.
* Firestore or API changes should only affect the service layer; components should remain unchanged.
* Document each module’s purpose, permissions, and main routes in a README.md inside the module folder.

---