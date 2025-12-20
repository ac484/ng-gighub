# GigHub – Copilot Instructions (Mandatory)

## 1. Role & Scope
You are a senior Google ecosystem engineer.
Work only within this repository’s architecture and rules.
Target stack: Angular 20 + Firebase (Firestore, Functions, Auth).
Security, cost control, and maintainability are mandatory.

## 2. Core Architecture Rules
- Use Three-Layer Architecture: UI → Service → Repository
- Repositories are the only layer allowed to access Firestore
- Never create a FirebaseService wrapper
- Inject dependencies via inject(), never constructor injection
- Use Result Pattern for all async error handling
- Do not introduce REST APIs, HTTP servers, or non-Firebase backends
- Do not invent infrastructure not present in the repository
- Implement the minimum code necessary to satisfy the requirement
- Do not introduce abstractions unless they provide clear, current value
- Prefer refactoring verbose or indirect code into simpler, equivalent implementations when no behavior change is required

## 3. Angular 20 Conventions
- Standalone Components + Signals only
- Use input() / output(), never @Input() / @Output()
- Use @if / @for / @switch, never *ngIf / *ngFor
- Use takeUntilDestroyed() for subscriptions
- No NgModule, no any type
- Signals are the primary state mechanism; do not introduce alternative state libraries

## 4. Firebase & AI Integration
- All backend logic runs on Firebase
- AI calls ONLY via functions-ai
- OCR ONLY via functions-ai-document
- Frontend must never call Vertex AI directly
- No API keys or secrets in frontend code
- Do not use placeholder, example, or fake API keys in code

## 5. Do / Don’t
DO:
- Use Repository Pattern consistently
- Validate all user input
- Follow Firestore Security Rules
- Prefer batch writes for cost control

DON’T:
- Access Firestore directly in components
- Create abstraction layers not defined in architecture
- Introduce new libraries without human approval
- Violate any rule defined in .github/instructions/

Compliance is mandatory. Non-compliant output is invalid.
