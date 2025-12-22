# Core Networking Agent Guide (Self-Owned Modules)

Scope: HTTP utilities/interceptors under `src/app/core/net`. Supports self-owned modules without centralizing module behavior.

## Key Rules
- Keep interceptors/helpers generic and feature-agnostic; no UI. Use `inject()` DI and Result-pattern error handling.
- Do not embed module metadata or lifecycle here; modules manage themselves.
- Firestore stays in repositories; networking code avoids new backends or secrets.
- Keep docs brief.

## Allowed
- HTTP interceptors, token refresh helpers, and small utilities/tests that respect module boundaries.

## Forbidden
- Module-specific coupling, global module registries, or long-form docs.

References: `../AGENTS.md`, `../services/AGENTS.md`.

Metadata: version 1.2.0 (self-owned), Status Active.
