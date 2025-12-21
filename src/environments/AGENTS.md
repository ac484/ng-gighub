# Environments – AGENTS

## Title + Scope
Scope: Environment configuration guidance for the project, covering all files under src/environments/.

## Purpose / Responsibility
Defines responsibilities and boundaries for files under src/environments/, ensuring build-time configuration stays minimal, type-safe, and free from secrets.

## Hard Rules / Constraints
- NO UI components.
- NO feature-specific logic.
- NO direct Firebase access outside adapters.
- Do not include secrets or runtime credentials in environment files.
- Keep build replacements aligned across environments.

## Allowed / Expected Content
- Build-time configuration and environment flags.
- Provider selection and global toggles.
- Singleton infrastructure services, global interceptors, and cross-cutting concerns when environment-scoped.

## Structure / Organization
- environment.ts
- environment.prod.ts
- Optional supporting folders (services/, guards/, interceptors/) for environment-specific wiring only.

## Integration / Dependencies
- Angular DI only; prefer inject().
- Uses @angular/fire adapters through approved repositories/services.
- No feature-to-feature imports; use Angular build replacements for environment switching.
- No runtime secrets or direct external AI calls.

## Best Practices / Guidelines
- Keep environments type-safe and structurally consistent.
- Do not include secrets; inject sensitive values via deployment configuration.
- Prefer composition over inheritance and keep services stateless.
- Validate all environment-provided values at build or runtime.

## Related Docs / References
- ../shared/AGENTS.md
- ../app/AGENTS.md
- docs/architecture/
- docs/security/

## Metadata
Version: 1.1.0
Status: Active
Audience: AI Coding Agents

---

This document defines rules and boundaries for environment configuration in GigHub. It governs what may exist in `src/environments/` and how it is used at build time.

## Details

- The `environments/` directory contains build-time configuration only. It must not contain runtime logic or secrets.
- environment.ts (Development): MUST set `production: false`; may enable verbose logging, mock providers/interceptors; must use non-production endpoints.
- environment.prod.ts (Production): MUST set `production: true`; must use production endpoints; must disable mock providers/interceptors and debug logging.
- Environment files MUST conform to a stable Environment interface and remain structurally consistent across environments.
- Security: forbidden to include secrets, credentials, or environment-specific business logic. Sensitive values MUST be injected at build or runtime.
- Build Integration: `angular.json` MUST define `fileReplacements` so production builds replace `environment.ts`.

---

**Last Updated**: 2025-12-21
