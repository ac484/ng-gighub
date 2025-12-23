# saas (GigHub) — Module Overview

This folder contains the SaaS features and submodules used by the GigHub application.

Structure

How to use

Notes

Quick notes for AI-driven code generation

- For each facade: provide full TypeScript interfaces for inputs/outputs, example JSON payloads, enumerated error codes, and at least one acceptance-test description.
- Label backend-only operations explicitly (they must be implemented in Cloud Functions and called via repository/cloud function clients).

## Available dependencies (important for AI code generation)

The repository includes frontend UI and utility libraries the AI may and should reuse when generating code. Use these packages where appropriate rather than inventing custom UI/utility code.

- `@angular/*` — Angular framework (core, forms, router, common). Use Signals and `inject()` per repo conventions.
- `ng-zorro-antd` — UI components (forms, lists, modals, tables). Prefer these components for consistent look & feel.
- `@delon/*` (`@delon/theme`, `@delon/auth`, `@delon/abc`, etc.) — higher-level UI patterns, auth helpers and theme integrations used by the app.
- `@angular/fire` — Firebase SDK integration (use only in repositories/services that access Firebase).
- `rxjs` — Observables for streams where needed; prefer Signals for local state.

When generating UI components, prefer `ng-zorro-antd` + `@delon/theme` primitives and follow existing theming and accessibility rules in `.github/instructions/a11y.instructions.md`.


