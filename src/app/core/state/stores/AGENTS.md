# Core Stores Agent Guide (Self-Owned Modules)

Scope: Shared signal-based stores under `src/app/core/state/stores`. Module-specific stores stay with each self-owned module.

## Key Rules
- Manage shared state only; no UI logic or feature-specific behavior. Use private writable signals with readonly exposures and `computed` selectors.
- Respect self-owned modules: do not centralize module state or metadata here; module-owned stores live alongside the module.
- Consume services/repositories via `inject()`; no direct Firebase access. Keep docs brief.

## Allowed
- Shared stores, lightweight selectors/helpers, and concise tests/docs.

## Forbidden
- Module-owned state, global module registries, or cross-module coupling.

References: `../../AGENTS.md`, `../../services/AGENTS.md`, `../../data-access/repositories/AGENTS.md`.

Metadata: version 1.2.0 (self-owned), Status Active.
