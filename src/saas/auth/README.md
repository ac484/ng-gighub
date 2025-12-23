# auth — README

Overview
- Small facade around Firebase Auth used by SaaS features (sign-in, sign-out, user info).

Quickstart
- Import the facade and call `signInWithEmail` in your sign-in component.

Example
```ts
import { AuthFacade } from 'src/saas/auth/auth.facade';

const result = await AuthFacade.signInWithEmail('me@example.com', 'secret');
if (result.ok) { /* navigate */ } else { /* show result.error */ }
```

File layout
- `auth.facade.ts` — public methods
- `auth.repository.ts` — low-level auth helpers (if needed)

Conventions
- Use `inject()` and Result<T> for all async operations.
