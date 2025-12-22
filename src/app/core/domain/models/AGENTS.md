# Core Domain Models Agent Guide (Self-Owned Modules)

Scope: Shared domain models in `src/app/core/domain/models`. Blueprint modules keep their own models; do not relocate module-specific shapes here.

## Key Rules
- Models are pure types/interfaces/classes with no feature logic or Firebase calls.
- Use strict typing, no `any`; keep contracts small and documented.
- Align with self-owned modules: only shared/neutral models live here; module-owned schemas stay with the module.
- Keep docs concise.

## Allowed
- Shared model definitions, lightweight mappers/serializers, and brief docs/tests.

## Forbidden
- Module-specific models, central module metadata, or feature logic.
- UI code or repository/service behavior inside models.

References: `../types/AGENTS.md`, `../../AGENTS.md`, `docs/architecture/`.

Metadata: version 1.2.0 (self-owned), Status Active.
