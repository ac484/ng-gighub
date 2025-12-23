# SaaS Module — Design

This document describes the design decisions and architecture for the `saas` module.

Goals
- Provide a clear separation of concerns following the repository's Three-Layer Architecture (UI → Service → Repository).
- Keep facades thin: expose small, testable entry points used by the rest of the app.
- Use the Result pattern for async operations to make error handling explicit.

Patterns and Constraints
- Repositories are the only layer that access Firestore.
- Use `inject()` when Angular DI is needed; prefer plain functions/modules for facades.
- No secrets or direct external APIs called from frontend code.

Facade contract
- Each facade should export a small `Result<T>` type (or reuse a shared one) and a single `*Facade` object with a handful of methods.

Accessibility & Security
- Build with accessibility in mind (WCAG 2.2 AA); see repository instructions in `.github/instructions/a11y.instructions.md`.
- Do not hardcode secrets; follow `.github/instructions/security-and-owasp.instructions.md`.

Notes
- Keep implementations minimal and rely on backend Cloud Functions for heavy or privileged operations.


## Documentation templates (added)

To make AI-driven code generation precise and consistent, each `src/saas/*` submodule should include the two files below. Use the templates as a checklist when implementing features.

### `DESIGN.md` (required)

- Purpose: single-paragraph summary of responsibilities and boundaries.
- Invariants: domain rules that must always hold (e.g., "repositories are the only Firestore accessors").
- Public API: list the facade functions (name, parameters, return Result<T, E>), example signatures.
- Data Models: key interfaces/types (shape and required fields).
- Persistence: which repository manages which collection/document paths.
- Security: access rules, privileged operations, server-side checks needed.
- Accessibility: keyboard/ARIA expectations for any UI pieces.
- Testing: required unit/integration tests and recommended mocks/stubs.
- Implementation TODOs: small concrete tasks the developer or AI can implement (e.g., "add TenantRepository.findById() returning Result<Tenant>").

### `README.md` (required)

- Overview: short paragraph describing the submodule.
- Quickstart: how to import and call the facade (example code with inputs and expected outputs).
- File layout: list of important files (facade, repositories, types, components).
- Conventions: note patterns used (signals, `inject()`, facades, Result pattern).
- Example: minimal code example showing usage of the facade in a component or service.

Create both files for these submodules: `auth`, `constants`, `i18n`, `layout`, `sdk`, `types`, `ui`, `utils`.

Use the `README.md` for developer onboarding and `DESIGN.md` for machine-/human-readable contracts that guide code generation.

