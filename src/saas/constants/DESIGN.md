# constants — DESIGN

Purpose
- Provide shared, well-documented constants (keys, Firestore collection names, feature flags) for the SaaS module.

Public API
- Export typed constants such as `COLLECTION_TENANTS`, `FEATURE_FLAGS`.

Data Models
- Describe shape and usage of feature flags and config constants.

Testing
- Unit tests that assert constant values and ensure no accidental renames.

TODO
- Add `constants/index.ts` barrel and document each exported value.
