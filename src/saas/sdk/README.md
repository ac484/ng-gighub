# sdk — README

Overview
- Typed client helpers and small SDK utilities used across saas modules.

Quickstart
- Import the typed client and call service methods via the SDK facade.

File layout
- `client.ts` — typed client constructors
- `mappers.ts` — response/request mappers

Available dependencies

- `@angular/fire` for calling Firebase functions if the SDK wraps function clients.
- Lightweight: prefer fetch/HTTP client patterns built on the repo's conventions; avoid adding new external SDKs.

