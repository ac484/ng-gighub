# Blueprint Core Agent Guide (Self-Owned Modules)

Scope: `src/app/core/blueprint` container plumbing (config, context, events). Blueprint modules are **self-owned**: each module keeps its own services/repositories/types and exposes contracts the container mounts.

## Key Rules
- No UI, no feature logic beyond blueprint infrastructure. Container only wires published module contracts; do not build centralized registries or shared module metadata.
- Use `inject()` DI, Signals, and Result-pattern handling. Firestore access only through module-owned or shared repositories.
- Keep docs short; avoid duplicating module internals.

## Allowed
- Container/context/event helpers that respect module boundaries.
- Interfaces for module contracts and minimal docs/tests that explain how modules plug in.
- Cross-cutting validation or error mapping that does not override module-owned behavior.

## Forbidden
- Moving module code, metadata, or lifecycle management into core.
- Cross-module coupling or global registries controlling module enablement.
- New infrastructure/backends or direct Firebase use from components.

References: `../AGENTS.md`, `../data-access/repositories/AGENTS.md`, `docs/architecture/blueprint`.

Metadata: version 1.2.0 (self-owned), Status Active.
