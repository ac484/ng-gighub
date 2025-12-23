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

