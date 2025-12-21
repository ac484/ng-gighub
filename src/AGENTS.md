Title: Source Directory – AGENTS.md

Scope: This file defines how AI coding agents must treat the src/ directory and what is permitted inside it. It specifies responsibilities, boundaries, and forbidden actions for agents operating at the repository root level.

---

1. Purpose / Responsibility

Purpose: The src/ directory is the root of all application source code. It contains application bootstrap and runtime entry, Angular application code, global styles and assets, environment configuration, and global TypeScript definitions. All business logic MUST live under src/app/. Agents should treat src/ as infrastructure, not domain.

Responsibility: Ensure bootstrap files remain minimal and declarative, prevent business logic leakage into infrastructure files, and guide the agent to defer feature decisions to src/app/.

---

2. Hard Rules / Constraints

Hard Rules (must follow):
- NO UI components in this file or at src/ root. UI components belong under src/app/.
- NO feature-specific business logic outside src/app/.
- NO direct Firebase access outside repository adapters (repositories are the only layer allowed to access Firestore).
- DO NOT add business logic to main.ts, index.html, or environment files.
- DO NOT modify auto-generated files (e.g., style-icons-auto.ts) manually.

These constraints are the primary safety checks to prevent architectural, security, or deployment problems.

---

3. Allowed / Expected Content

Allowed content under src/ (infrastructure-level):
- Singleton services that are infrastructure-oriented (not feature behavior)
- Global interceptors and cross-cutting concerns (logging, error handling, telemetry)
- Global TypeScript declarations and typings that do NOT contain domain models
- Global styles, assets, and environment configuration (no secrets)
- Bootstrapping code that remains minimal and framework-agnostic

Expected agent behavior: Validate inputs, prefer composition over inheritance for shared utilities, and minimize surface area for changes.

---

4. Structure / Organization

Recommended organization to reduce ad-hoc files and drift:
- services/       # singleton infrastructure services
- guards/         # global guards not tied to a single feature
- interceptors/   # HTTP / cross-cutting interceptors (infrastructure-only)
- assets/         # static assets: images, fonts, icons
- environments/   # environment-specific configs (no secrets)
- styles/         # global style themes and variables

Notes: No business logic should exist outside src/app/. Keep file placement intentionally conservative.

---

5. Integration / Dependencies

Integration rules:
- Use Angular DI only (inject() over constructor injection where repository conventions require it).
- Use @angular/fire adapters where Firebase interaction is needed, but only within repository adapters under src/app/.
- No feature-to-feature imports; modules communicate via explicit public interfaces or events.
- Frontend must never contain API keys or call external AI services directly (AI calls via functions-ai and OCR via functions-ai-document only).

---

6. Best Practices / Guidelines

Guidelines (not all mandatory but recommended):
- Prefer composition over inheritance for shared utilities and services.
- Keep services stateless where possible; explicit state belongs to feature modules under src/app/.
- Use bootstrapApplication() in main.ts and keep it minimal (no feature imports).
- Respect TypeScript strict mode and linting rules defined in the repository.
- Prefer batch writes for Firestore when applicable for cost control.

---

7. Related Docs / References

Helpful references for agents and humans:
- src/app/AGENTS.md  # Application-level agent rules
- src/environments/AGENTS.md  # Environment configuration rules
- docs/architecture/  # Architectural guidance
- docs/security/  # Security guidance and Firestore rules

---

8. Metadata

Version: 1.1.0
Status: Active
Audience: AI Coding Agents

---

Notes: This file replaces previous layouts and enforces a strict ordering of sections to make agent responsibilities and constraints explicit. Keep this file synchronized with other AGENTS.md files across the repo.

