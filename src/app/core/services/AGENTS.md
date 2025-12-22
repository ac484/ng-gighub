# Core Services Agent Guide (Self-Owned Modules)

Scope: Infrastructure singletons in `src/app/core/services` (auth, logging, telemetry). Blueprint modules are self-owned; keep module business logic within the module.

## Key Rules
- No UI or feature logic. Use `inject()` DI, Signals where needed, and Result-pattern async handling. Firestore only via repositories.
- Do not centralize module metadata or lifecycle; modules own their services/repositories/types.
- Keep docs concise; avoid new backends or unmanaged dependencies.

## Allowed
- Infrastructure services (auth, logger, validation), shared interfaces, and small docs/tests supporting self-owned boundaries.

## Forbidden
- Module-specific services here, cross-module coupling, or placeholder secrets.

References: `../AGENTS.md`, `../../shared/services/AGENTS.md`, `docs/architecture/`.

Metadata: version 1.2.0 (self-owned), Status Active.
