# Social (Friends) Module AGENTS

## Title + Scope
Scope: Friends/Social features under src/app/routes/social.

## Purpose / Responsibility
Guide agents implementing friends UI pages, services, and routing while keeping to GigHub conventions.

## Hard Rules / Constraints
- NO UI components outside this module scope.
- NO feature-specific logic leaking beyond social/friends responsibilities.
- NO direct Firebase access outside adapters/repositories; use FriendService/Store abstractions.

## Allowed / Expected Content
- Standalone components for friends list/card pages.
- Service and store wiring for friend data.
- Event bus integration for relevant events and supporting docs/tests.

## Structure / Organization
- pages/ for primary views
- components/ for reusable friend UI
- routes/ for route registration
- Service/store files colocated per convention

## Integration / Dependencies
- Use Angular DI with inject(); interact with BlueprintEventBus and Firestore through repositories.
- Keep interactions within published interfaces; avoid cross-feature imports.

## Best Practices / Guidelines
- Use signals for state, Result pattern for async operations, and maintain accessibility in UI components.
- Keep components presentational and delegate logic to services.

## Related Docs / References
- ../AGENTS.md (Routes)
- ../../AGENTS.md (App)
- ../../../core/AGENTS.md (Core services)

## Metadata
Version: 1.1.0
Status: Active
Audience: AI Coding Agents

---

# Social (Friends) Module AGENTS

This module contains the Friends UI pages and components. It follows the GigHub conventions:
- Standalone components
- Uses `FriendService` for business logic
- Uses `FriendStore` (signals) for local state
- Emits/consumes events via `BlueprintEventBus`

Files:
- `pages/friends.page.ts` — friends list page
- `components/friend-card.component.ts` — simple friend card
- `routes/friends.routes.ts` — route registration

Next steps: implement repository Firestore calls, wire `FriendService` in the page, add tests, and update Firestore rules.
