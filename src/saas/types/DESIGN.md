# types — DESIGN

Purpose
- Centralized domain types and interfaces used by saas facades and repositories.

Public API
- Exported interfaces and type aliases that are stable across modules.

Conventions
- Keep types minimal and explicit; avoid `any` and prefer discriminated unions where appropriate.

TODO
- Create `types/index.ts` and document important interfaces like `Tenant`, `Subscription`, `Invoice`.
