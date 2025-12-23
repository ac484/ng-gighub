# saas (GigHub) — Module Overview

This folder contains the SaaS features and submodules used by the GigHub application.

Structure
- `api/` — API layer helpers, controllers, validators and policies used by Cloud Functions or local testing.
- `app/` — UI shell, pages and components for the SaaS product.
- `billing/` — Billing and subscription related logic.
- `marketplace/` — Plugin and marketplace features.
- `onboarding/` — Onboarding flows and step definitions.
- `tenant/` — Tenant models, policies and repositories.

How to use
- Each submodule exposes a small `*.facade.ts` entrypoint. Use these facades from services or pages to keep integration code small and testable.

Notes
- Follow the repository's three-layer architecture and security guidelines.
- Accessibility and performance considerations should be applied to UI code (see `.github/instructions`).
