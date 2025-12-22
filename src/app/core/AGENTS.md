# Core Module Agent Guide (Self-Owned Modules)

Scope: Core infrastructure under `src/app/core` (services, repositories, errors, guards, stores). Blueprint container now loads **self-owned modules**; core must not centralize module metadata or lifecycle.

## Key Rules
- No UI work. Keep logic feature-agnostic; follow UI → Service → Repository. Firestore only in repositories/adapters.
- Use `inject()` DI, Signals, and Result-pattern async handling. No NgModules, no `any`, no new backends.
- Self-owned modules: module-specific services/repositories/types stay with the module; core only provides cross-cutting helpers and container wiring.
- Keep documentation concise; avoid duplicating module contracts.

## Allowed
- Singleton infrastructure services (auth, logging, validation), shared errors/types, guards, and startup hooks.
- Repositories for shared resources that do not override module-owned data.
- Lightweight docs/tests clarifying self-owned boundaries.

## Forbidden
- Central registries controlling module lifecycle or metadata.
- Feature-specific logic in core or direct Firebase access from components.
- Introducing new infrastructure, REST servers, or unmanaged dependencies.

References: Root AGENTS, `core/blueprint/AGENTS.md`, `docs/architecture/`.

Metadata: version 1.2.0 (self-owned), Status Active, Audience AI Coding Agents.
