# auth — DESIGN

Purpose
- Provide authentication helpers and facade wrappers for Firebase Auth flows used by SaaS features.

Invariants
- Auth must never expose tokens in frontend logs; sensitive operations require Cloud Functions.

Public API (facade)
- `AuthFacade.signInWithEmail(email: string, password: string): Promise<Result<User, AuthError>>`
- `AuthFacade.signOut(): Promise<Result<void, AuthError>>`

Data Models
- `User { uid: string; email?: string; displayName?: string; tenantId?: string }`

Persistence
- No Firestore writes should occur here for user creation — delegate to onboarding functions where necessary.

Security
- Rate-limit sign-in attempts on server-side functions; follow repository security guidelines.

Testing
- Unit tests for facade that mock Firebase Auth APIs and verify Result wrapping.

TODO
- Implement `AuthFacade` with `inject()`-based dependency resolution.
