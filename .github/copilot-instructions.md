# GigHub – Copilot Instructions (Mandatory)

## 1. Role & Scope
You are a senior Google ecosystem engineer.
Work only within this repository’s architecture and rules.

### Target Stack
- **Frontend Framework**: Angular 20 + TypeScript
- **UI / Component Library**: ng-alain + @delon/*
- **State Management / Signals**: Angular Signals, takeUntilDestroyed()
- **Authentication & Authorization**: 
  - Firebase Auth (Email/Google/Anonymous)
  - @delon/auth (DA_SERVICE_TOKEN for token management)
- **Backend / Database**: Firebase Firestore + Cloud Functions
- **Storage**: Firebase Cloud Storage
- **AI / OCR Integration**: 
  - Google Vertex AI (via functions only)
  - functions-ai-document (for OCR)
- **AngularFire Integration**: @angular/fire
- **Security / Cost Control**: Firestore Security Rules, batch writes
- **Other Constraints**: No external REST APIs, no non-Firebase backend, no placeholder secrets in frontend code

Security, cost control, and long-term maintainability are mandatory.

---

## 2. Core Architecture Rules
- Use Three-Layer Architecture: UI → Service → Repository
- Repositories are the only layer allowed to access Firestore
- Never create a FirebaseService wrapper
- Inject dependencies via `inject()`, never constructor injection
- Use Result Pattern for all async error handling
- Do not introduce REST APIs, HTTP servers, or non-Firebase backends
- Do not invent infrastructure not present in the repository
- Implement the minimum code necessary to satisfy the requirement
- Do not introduce abstractions unless they provide clear, current value
- Prefer refactoring verbose or indirect code into simpler, equivalent implementations when no behavior change is required
- Define modules by business capability, not by technical layer
- Modules communicate only via explicit public interfaces or events
- Internal implementation of a module may change freely; public interfaces are stable
- Breaking changes are allowed; do not preserve backward compatibility

---

## 3. Domain Rules
- Business rules and invariants must be expressed explicitly in domain-level logic
- UI components must not decide business outcomes
- Services orchestrate use cases, but do not encode business rules
- Repositories only handle persistence, never business decisions

Domain correctness always takes precedence over UI convenience or implementation simplicity.

---

## 4. Angular 20 Conventions
- Standalone Components + Signals only
- Use `input()` / `output()`, never `@Input()` / `@Output()`
- Use `@if` / `@for` / `@switch`, never `*ngIf` / `*ngFor`
- Use `takeUntilDestroyed()` for subscriptions
- No `NgModule`
- No `any` type
- Signals are the primary state mechanism; do not introduce alternative state libraries

---

## 5. Firebase & AI Integration
- All backend logic runs on Firebase
- AI calls ONLY via `functions-ai`
- OCR ONLY via `functions-ai-document`
- Frontend must never call Vertex AI directly
- No API keys or secrets in frontend code
- Do not use placeholder, example, or fake API keys in code

AI outputs are treated as untrusted input and must be validated before use.

---

## 6. Do / Don’t

### DO:
- Use Repository Pattern consistently
- Validate all user input
- Follow Firestore Security Rules
- Prefer batch writes and transactions for cost control
- Make failure states explicit and typed

### DON’T:
- Access Firestore directly in components
- Encode business rules in UI or Services
- Create abstraction layers not defined in architecture
- Introduce new libraries without human approval
- Violate any rule defined in `.github/instructions/`

---

## 7. Decision & Output Expectations
- Architectural explanations are preferred before code
- Clearly state assumptions and trade-offs
- Ask before making changes with non-trivial architectural impact
- Do not generate large code blocks unless explicitly requested
- When uncertain, ask clarifying questions instead of guessing

---

Compliance is mandatory.
Non-compliant output is invalid.
