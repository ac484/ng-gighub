# Firebase Functions Environment Configuration Audit

This audit aligns all Cloud Functions packages with the latest Firebase guidance on managing environment configuration (see https://firebase.google.com/docs/functions/config-env).

## Packages Reviewed
- functions-ai
- functions-ai-document
- functions-analytics
- functions-auth
- functions-calculation
- functions-event
- functions-fcm
- functions-firestore
- functions-governance
- functions-integration
- functions-observability
- functions-orchestration
- functions-scheduler
- functions-shared
- functions-storage

## Findings
- Runtime configuration is sourced via `process.env` across packages; no legacy `functions.config()` usage is required for new deployments (a compatibility fallback remains in `functions-ai-document` only).
- The weather integration README previously referenced `firebase functions:config:set debug.enabled=true`, which does not populate `process.env.DEBUG`. It has been updated to use `DEBUG="weather:*"` per Firebase's environment variable mapping.
- For new configuration values, prefer `.env` files (loaded by the CLI) or `firebase functions:config:set KEY="value"`, which exposes `KEY` as `process.env.KEY` in Functions v2.

## Action Items
- Use uppercase, flat keys when setting runtime config so they map directly to `process.env` (for example, `firebase functions:config:set DOCUMENTAI_LOCATION="us"`).
- Keep secrets in `firebase functions:secrets:set` and reference them via the Functions params API where appropriate.
- Reuse this audit checklist when adding new functions to ensure consistency with Firebase's current environment configuration guidance.
