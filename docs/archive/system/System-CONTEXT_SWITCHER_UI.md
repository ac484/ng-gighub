# Context Switcher UI Reference

## Location
The context switcher appears in the **left sidebar user menu dropdown** when you click on the user avatar.

## Visual Structure

```
┌─────────────────────────────────────────┐
│  User Avatar & Info (Click to Open)     │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ 🔄 切換工作區                           │ ← Header (non-clickable)
├─────────────────────────────────────────┤
│ 👤 個人帳戶                             │ ← User Context (selected by default)
│ 👥 示範組織 A ▶                        │ ← Organization (expandable)
│    👥 示範組織 A                        │   ← Org itself
│    👥 開發團隊                          │   ← Team 1
│    👥 設計團隊                          │   ← Team 2
│ 👥 示範組織 B ▶                        │ ← Organization (expandable)
│    👥 示範組織 B                        │   ← Org itself
│    👥 營運團隊                          │   ← Team 3
│ 🤖 自動化機器人                        │ ← Bot Context
├─────────────────────────────────────────┤
│ 👤 個人中心                             │ ← Account Center
│ ⚙️  個人設置                            │ ← Account Settings
└─────────────────────────────────────────┘
```

## Icons Reference

| Context Type   | Icon              | Description           |
|----------------|-------------------|-----------------------|
| User           | `user`            | Personal account      |
| Organization   | `team`            | Organization context  |
| Team           | `usergroup-add`   | Team within org       |
| Bot            | `robot`           | Automated bot account |

## Interaction Behavior

1. **Click on User Avatar** → Opens dropdown menu
2. **Click on Personal Account** → Switches to user context
3. **Hover on Organization** → Shows expand arrow
4. **Click on Organization Name** → Expands to show teams AND switches to org context
5. **Click on Team Name** → Switches to team context
6. **Click on Bot Name** → Switches to bot context
7. **Selected Context** → Highlighted with `ant-menu-item-selected` class

## State Indicators

### Selected Context (Highlighted)
The currently selected context is visually highlighted with:
- Background color change (Ant Design's selected style)
- Checkmark icon (optional, depending on theme)

### Current Context Display
The current context label is also displayed in:
- Service: `workspaceContext.contextLabel()`
- Service: `workspaceContext.contextIcon()`

Can be used elsewhere in the app to show:
```
Currently working in: 👥 示範組織 A
```

## Mock Data Structure

```typescript
{
  user: {
    id: '<firebase-uid>',
    name: '<from Firebase Auth displayName>',
    email: '<from Firebase Auth email>'
  },
  
  organizations: [
    { id: 'org-1', name: '示範組織 A' },
    { id: 'org-2', name: '示範組織 B' }
  ],
  
  teams: [
    { id: 'team-1', organization_id: 'org-1', name: '開發團隊' },
    { id: 'team-2', organization_id: 'org-1', name: '設計團隊' },
    { id: 'team-3', organization_id: 'org-2', name: '營運團隊' }
  ],
  
  bots: [
    { id: 'bot-1', name: '自動化機器人', owner_id: '<user-id>' }
  ]
}
```

## Persistence

Context selection is **automatically saved** to localStorage with key `'workspace_context'`:

```json
{
  "type": "organization",
  "id": "org-1"
}
```

On page reload, the service automatically:
1. Loads the saved context
2. Restores the selection
3. Updates the UI to show the selected context

## Integration Points

### To Check Current Context in Your Components

```typescript
import { inject } from '@angular/core';
import { WorkspaceContextService } from '@shared';

@Component({...})
export class MyComponent {
  private readonly workspaceContext = inject(WorkspaceContextService);
  
  // Get current context type
  contextType = this.workspaceContext.contextType;  // Signal<ContextType>
  
  // Get current context ID
  contextId = this.workspaceContext.contextId;  // Signal<string | null>
  
  // Get display label
  contextLabel = this.workspaceContext.contextLabel;  // Signal<string>
  
  // Get icon name
  contextIcon = this.workspaceContext.contextIcon;  // Signal<string>
  
  // Check if user context
  get isUserContext(): boolean {
    return this.contextType() === ContextType.USER;
  }
}
```

### To Filter Data by Context

```typescript
// In your data service
async getBlueprints() {
  const contextType = this.workspaceContext.contextType();
  const contextId = this.workspaceContext.contextId();
  
  switch (contextType) {
    case ContextType.ORGANIZATION:
      return this.firestore
        .collection('blueprints')
        .where('organization_id', '==', contextId)
        .get();
    
    case ContextType.TEAM:
      return this.firestore
        .collection('blueprints')
        .where('team_id', '==', contextId)
        .get();
    
    case ContextType.USER:
    default:
      return this.firestore
        .collection('blueprints')
        .where('user_id', '==', contextId)
        .get();
  }
}
```

## Responsive Behavior

- **Desktop**: Full menu with icons and text
- **Mobile**: Same behavior (part of sidebar drawer)
- **Touch**: Tap to expand organizations
- **Keyboard**: Support for arrow key navigation (native ng-zorro-antd behavior)

## Styling

The component uses:
- Ant Design's menu component classes
- ng-zorro-antd's built-in styles
- Custom padding for nested items
- Responsive spacing

Colors inherit from theme:
- Selected: Primary color background
- Hover: Lighter primary color
- Active: Darker primary color
- Disabled: Gray text

## Accessibility

- **ARIA Labels**: Inherited from ng-zorro-antd menu
- **Keyboard Navigation**: Full support via ng-zorro-antd
- **Screen Reader**: Announces context changes
- **Focus Management**: Proper focus handling on selection

## Future Enhancements

Potential additions:
- [ ] Search/filter organizations
- [ ] Pin favorite contexts
- [ ] Recent context history
- [ ] Custom context icons
- [ ] Context permissions display
- [ ] Org/team member count badges
