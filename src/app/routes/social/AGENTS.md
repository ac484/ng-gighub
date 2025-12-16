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
