# Core Domain Types Agent Guide (Self-Owned Modules)

Scope: Shared type aliases/enums/utilities in `src/app/core/domain/types`. Blueprint modules manage their own types; keep module-specific enums inside the module.

## Key Rules
- Provide reusable, framework-agnostic types; no feature logic or Firebase access.
- Use strict typing, discriminated unions, and `readonly` where helpful; avoid `any`.
- Respect self-owned modules by not centralizing module metadata/config types here.
- Keep documentation short and focused.

## Allowed
- Shared enums, utility types, and minimal helpers/tests used across modules.

## Forbidden
- Module-owned types, centralized module registry definitions, or runtime logic.
- UI code or cross-feature coupling.

References: `../models/AGENTS.md`, `../../AGENTS.md`.

Metadata: version 1.2.0 (self-owned), Status Active.
