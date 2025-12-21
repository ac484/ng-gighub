---
# GigHub – AGENTS (Title + Scope)

Scope: Repository-level guidance for automated AI coding agents working in the GigHub frontend repository (Angular 20 + Firebase). This document defines what agents may change, where they operate (layer), and the boundaries they must respect.

## Purpose / Responsibility

Purpose: Define the responsibilities and expected behavior of AI coding agents when modifying or adding code in this repository.
Responsibility: Ensure changes follow the project's architecture, security, and maintainability rules; implement minimal, Firestore-first solutions; avoid introducing new infrastructure or libraries without human approval.

## Hard Rules / Constraints

- NO UI components: Agents must not create or modify UI components unless explicitly requested in a feature ticket.
- NO feature-specific logic: Do not add business or feature logic outside designated domain services or feature modules.
- NO direct Firebase access outside adapters: Only approved adapters or domain services may access @angular/fire; components must not access Firestore directly.
- Use inject() for DI; do not use constructor injection in new services.
- Use Signals and standalone components where UI changes are allowed; otherwise avoid UI work.
- Do not introduce REST APIs, servers, or external backends.
- No NgModules, no any types, and no state libraries (NgRx etc.).
- All backend logic must run on Firebase; AI calls only via functions-ai and OCR via functions-ai-document.

## Allowed / Expected Content

- Singleton domain services (use providedIn: 'root' and inject()).
- Global interceptors and cross-cutting concerns (logging, error normalization, observability) that do not implement feature logic.
- Repository or adapter files only when justified (cross-collection logic, complex permission translation).
- Firestore queries via @angular/fire primitives (collectionData, docData) inside domain services or justified repositories.
- Tests and documentation updates related to changes.

## Structure / Organization

Preferred layout for agent-created cross-cutting modules:
- services/        (domain or cross-cutting services)
- guards/          (route guards enforcing permissions)
- interceptors/    (HTTP / Angular interceptors limited to allowed concerns)
- repositories/    (optional, only when justified by complexity)

Follow existing repository directories and naming conventions; place models under core/models and domain services under core/services when applicable.

## Integration / Dependencies

- Use Angular DI exclusively; use inject() in new code.
- Use @angular/fire adapters for Firestore access. Do not call Vertex AI or other cloud AI APIs directly from the frontend.
- Do not introduce new libraries without human approval; prefer built-in Angular, RxJS, and repository-provided functions packages.
- Modules should not perform feature-to-feature imports; communicate via explicit public interfaces or domain events.

## Best Practices / Guidelines

- Prefer composition over inheritance.
- Keep services stateless where possible; use Signals for state.
- Use the Result pattern for async error handling and typed errors extending project error types.
- Use takeUntilDestroyed() for subscriptions and ChangeDetectionStrategy.OnPush for components (when UI allowed).
- Favor batch writes and cost-aware Firestore patterns.
- Validate all user input and follow Firestore security rules.

## Related Docs / References

- docs/architecture/ (general architecture)
- docs/operations/ (operational runbooks)
- functions-ai/README.md and functions-ai-document/README.md (AI integration)
- src/app/core/AGENTS.md or ../shared/AGENTS.md if present

## Metadata

Version: 1.1.0
Status: Active
Audience: AI Coding Agents

---

