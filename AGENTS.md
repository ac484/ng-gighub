# GigHub – AGENTS (Self-Owned Modules)

Scope: Repository-level guidance for AI agents in the Angular 20 + Firebase app. Blueprint container now runs **self-owned modules**—each module keeps its own services, repositories, and types; the container only mounts published contracts.

## Key Rules
- No UI work unless explicitly requested. Respect three-layer flow: UI → Service → Repository; Firestore only in repositories.
- Modules are self-owned: do not centralize module metadata/registries or move module code into core/shared. Configure modules within their own folders.
- Use `inject()` DI, Signals, Result-pattern async handling. No NgModules, no `any`, no new backends/REST servers, no placeholder secrets.
- Keep docs/tests concise; prefer minimal changes aligned with the self-owned model.

## Allowed
- Cross-cutting helpers in core/shared that do not override module-owned behavior.
- Shared validation, logging, or error mapping for non-module-specific resources.
- Documentation/tests that clarify boundaries for self-owned modules.

## Forbidden
- Central registries that dictate module lifecycle or metadata; modules manage themselves.
- Feature logic in core/shared or direct Firebase use from components.
- Introducing new infrastructure or unmanaged dependencies.

References: `src/app/core/AGENTS.md`, `src/app/core/blueprint/AGENTS.md`, `docs/architecture/`.

Metadata: version 1.2.0 (self-owned), status Active, audience AI agents.
