---
Title + Scope

Scope: Environment configuration guidance for the project.

---

Purpose / Responsibility

Defines responsibilities and boundaries for files under src/environments/.

---

Hard Rules / Constraints

Hard Rules:
- NO UI components
- NO feature-specific logic
- NO direct Firebase access outside adapters

---

Allowed / Expected Content

Allowed:
- Build-time configuration
- Environment flags
- Provider selection
- Singleton services
- Global interceptors
- Cross-cutting concerns

---

Structure / Organization

Structure:
- environment.ts
- environment.prod.ts
- services/
- guards/
- interceptors/

---

Integration / Dependencies

Integration:
- Angular DI only
- Uses @angular/fire adapters
- No feature-to-feature imports
- Angular build replacements
- No runtime secrets

---

Best Practices / Guidelines

Guidelines:
- Keep environments type-safe
- Do not include secrets
- Prefer composition over inheritance
- Keep services stateless where possible
- Validate all environment-provided values at build or runtime

---

Related Docs / References

Related:
- ../shared/AGENTS.md
- ../environments/AGENTS.md
- ../app/AGENTS.md
- docs/architecture/

---

Metadata

Version: 1.1.0
Status: Active
Audience: AI Coding Agents

---

# Environments – AGENTS.md

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

