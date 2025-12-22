# Core Repositories Agent Guide (Self-Owned Modules)

Scope: Shared repositories under `src/app/core/data-access/repositories`. Blueprint modules own their own repositories; do not centralize module data here.

## Key Rules
- Repositories are the only place for Firestore access. Use `inject()` DI, Result pattern, and avoid `any`.
- Keep logic to data access/mapping/validation; no feature business rules.
- Respect self-owned modules: module-specific repositories live with the module; core repositories handle shared resources only.
- Keep documentation brief.

## Allowed
- CRUD/query helpers for shared entities, logging/error mapping, and small utilities/tests tied to persistence.

## Forbidden
- Central module registries or moving module repositories into core.
- Feature logic, UI code, or direct Firebase usage from components/services outside repositories.
- New infrastructure/backends or unmanaged dependencies.

References: `../AGENTS.md`, `../blueprint/AGENTS.md`, `docs/architecture/`.

Metadata: version 1.2.0 (self-owned), Status Active.
