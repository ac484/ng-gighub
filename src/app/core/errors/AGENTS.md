# Core Errors Agent Guide (Self-Owned Modules)

Scope: Shared error classes and severity conventions under `src/app/core/errors`. Module-specific errors stay with the module in self-owned mode.

## Key Rules
- Keep errors typed, serializable, and free of feature logic. No Firebase calls in constructors.
- Use shared severity enums/context metadata; convert repository/service failures via Result pattern.
- Do not centralize module error codes; modules own their own error types.
- Keep guidance concise.

## Allowed
- Shared base errors, severity enums, and small utilities/tests for cross-cutting concerns.

## Forbidden
- Module-specific errors or registries in core, UI logic, or sensitive data in messages.

References: `../AGENTS.md`, `../services/AGENTS.md`.

Metadata: version 1.2.0 (self-owned), Status Active.
