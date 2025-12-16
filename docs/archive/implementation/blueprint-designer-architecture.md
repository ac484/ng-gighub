# Blueprint Designer Architecture - Drag & Drop System

## Component Hierarchy

```
BlueprintDesignerComponent
├── cdkDropListGroup (NEW - connects all drop lists)
│   ├── Validation Alerts
│   ├── Module Palette (Left Panel)
│   │   └── cdkDropList (NEW)
│   │       └── Module Categories
│   │           └── Module Cards (cdkDrag)
│   │               ├── Tasks Module
│   │               ├── Logs Module
│   │               ├── Documents Module
│   │               ├── Quality Module
│   │               └── Inspection Module
│   └── Canvas Area (Center)
│       └── cdkDropList (EXISTING)
│           ├── Connection Layer (SVG)
│           ├── Connection Preview (SVG)
│           └── Canvas Modules (cdkDrag)
│               ├── Module 1
│               ├── Module 2
│               └── Module N
```

## Data Flow

### Before Fix ❌

```
Module Palette                    Canvas Area
┌─────────────┐                  ┌─────────────┐
│ Module Card │                  │             │
│  (cdkDrag)  │──────X───────────│ cdkDropList │
│             │   No Connection  │             │
└─────────────┘                  └─────────────┘
                                         
❌ Cannot drag from palette to canvas
```

### After Fix ✅

```
                    cdkDropListGroup
        ┌───────────────────────────────────┐
        │                                   │
Module Palette              Canvas Area    │
┌──────────────┐           ┌────────────┐  │
│ cdkDropList  │           │cdkDropList │  │
│ ┌──────────┐ │           │            │  │
│ │ Module   │ │───────────│            │  │
│ │ (cdkDrag)│ │    ✅     │            │  │
│ └──────────┘ │  Connected│            │  │
└──────────────┘           └────────────┘  │
                                           │
        └───────────────────────────────────┘

✅ Can drag from palette to canvas
```

## Drag & Drop Event Flow

### 1. Drag Start (from Palette)

```typescript
User Action: Click + Hold on Module Card
    ↓
cdkDragStarted event fired
    ↓
onDragStart(module) called
    ↓
Log drag start event
```

### 2. Dragging (over Canvas)

```typescript
User Action: Move mouse while holding
    ↓
Angular CDK tracks mouse position
    ↓
Visual drag preview follows cursor
    ↓
Canvas highlights as valid drop target
```

### 3. Drop (on Canvas)

```typescript
User Action: Release mouse button
    ↓
cdkDropListDropped event fired
    ↓
onDrop(event: CdkDragDrop<CanvasModule[]>)
    ↓
Check: event.previousContainer === event.container?
    ├─ YES: Reorder within canvas (moveItemInArray)
    └─ NO:  Add new module from palette
            ↓
            Calculate drop position
            ↓
            Create new CanvasModule
            ↓
            Add to canvasModules signal
            ↓
            Run validation
            ↓
            Show success message
```

## Position Calculation

### Coordinate System

```
Browser Viewport
┌──────────────────────────────────────┐
│                                      │
│  Canvas Container (cdkDropList)      │
│  ┌────────────────────────────────┐  │
│  │ scrollLeft, scrollTop          │  │
│  │                                │  │
│  │    Drop Point (x, y)           │  │
│  │         ↓                      │  │
│  │    [Module Center]             │  │
│  │    ┌──────────┐                │  │
│  │    │  Module  │                │  │
│  │    │ (200x60) │                │  │
│  │    └──────────┘                │  │
│  │                                │  │
│  └────────────────────────────────┘  │
│                                      │
└──────────────────────────────────────┘
```

### Calculation Logic

```typescript
// Get canvas element bounds
const canvas = this.canvasElement.nativeElement;
const rect = canvas.getBoundingClientRect();

// Convert viewport coordinates to canvas-relative coordinates
x = event.dropPoint.x - rect.left + canvas.scrollLeft;
y = event.dropPoint.y - rect.top + canvas.scrollTop;

// Adjust to center module at drop point
x = Math.max(0, x - 100);  // 200px width / 2 = 100px
y = Math.max(0, y - 30);   // ~60px height / 2 = 30px

// Result: Module center aligns with mouse cursor
```

## State Management with Signals

```typescript
// Component State (Reactive)
┌─────────────────────────────────────────┐
│ BlueprintDesignerComponent              │
├─────────────────────────────────────────┤
│ Signals:                                │
│  • blueprint = signal<Blueprint | null> │
│  • canvasModules = signal<Module[]>     │
│  • selectedModule = signal<Module?>     │
│  • connections = signal<Connection[]>   │
│  • validationResult = signal<Result?>   │
├─────────────────────────────────────────┤
│ Computed:                               │
│  • moduleCategories = computed(...)     │
│  • modulePositions = computed(...)      │
└─────────────────────────────────────────┘
         │
         ↓ (Change Detection)
    Template Updates
         │
         ↓
    UI Re-renders
```

## Angular CDK Integration

### Module Imports

```typescript
import { 
  CdkDragDrop,      // Drag drop event type
  DragDropModule,   // CDK drag-drop module
  moveItemInArray   // Array utility
} from '@angular/cdk/drag-drop';
```

### Template Directives

```html
<!-- Group all drop lists -->
<div cdkDropListGroup>
  
  <!-- Source drop list (palette) -->
  <div cdkDropList 
       id="module-palette-list"
       [cdkDropListData]="[]">
    
    <!-- Draggable items -->
    <div cdkDrag 
         [cdkDragData]="module"
         (cdkDragStarted)="onDragStart(module)">
    </div>
  </div>
  
  <!-- Target drop list (canvas) -->
  <div cdkDropList 
       id="canvas-drop-list"
       [cdkDropListData]="canvasModules()"
       (cdkDropListDropped)="onDrop($event)">
    
    <!-- Canvas modules (also draggable) -->
    <div cdkDrag>
    </div>
  </div>
</div>
```

## Connection System Architecture

### Port Types

```
Module
┌──────────────────────────────┐
│  Input Port    Output Port   │
│      ●              ●         │
│      │   Module    │         │
│      │   Content   │         │
│      ●              ●         │
└──────────────────────────────┘
   ↑                    ↑
   │                    │
Receives           Sends
Events             Events
```

### Connection Creation Flow

```typescript
1. User clicks Output Port
    ↓
2. Connection creation state activated
    ↓
3. Visual preview line follows cursor
    ↓
4. User hovers over Input Port
    ↓
5. Port highlights (valid target)
    ↓
6. User releases mouse
    ↓
7. Validate connection (no self, no duplicate)
    ↓
8. Create connection object
    ↓
9. Add to connections signal
    ↓
10. Run validation
    ↓
11. Render SVG connection line
```

## Validation System

```typescript
Validation Flow
┌─────────────────────────────────┐
│ Module Added/Connection Created │
└────────────┬────────────────────┘
             ↓
    ┌────────────────┐
    │ runValidation()│
    └────────┬───────┘
             ↓
    ┌────────────────────┐
    │ DependencyValidator│
    │ Service.validate() │
    └────────┬───────────┘
             ↓
    ┌─────────────────────────┐
    │ 1. Check Circular Deps  │
    │ 2. Check Missing Modules│
    │ 3. Generate Errors      │
    │ 4. Generate Warnings    │
    └────────┬────────────────┘
             ↓
    ┌────────────────────┐
    │ validationResult   │
    │ signal updated     │
    └────────┬───────────┘
             ↓
    ┌────────────────────┐
    │ ValidationAlerts   │
    │ Component displays │
    └────────────────────┘
```

## Key Classes and Interfaces

### CanvasModule Interface

```typescript
interface CanvasModule {
  id: string;                      // Unique identifier
  type: string;                    // Module type (tasks, logs, etc.)
  name: string;                    // Display name
  position: { x: number; y: number }; // Canvas position
  enabled: boolean;                // Active state
  config: Record<string, unknown>; // Module configuration
  dependencies: string[];          // Module dependencies
}
```

### ModuleConnection Interface

```typescript
interface ModuleConnection {
  id: string;
  source: {
    moduleId: string;
    position: { x: number; y: number };
  };
  target: {
    moduleId: string;
    position: { x: number; y: number };
  };
  eventType: string;
  status: 'active' | 'inactive';
}
```

## Performance Considerations

### Change Detection Strategy

```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Only check when:
  // 1. Input signals change
  // 2. Events are emitted
  // 3. Signals are updated
})
```

### Signal-Based Reactivity

```typescript
// Efficient updates with Signals
canvasModules.update(modules => [...modules, newModule]);
// ↓
// Only components using canvasModules() re-render
```

## Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| cdkDrag | ✅ 90+ | ✅ 88+  | ✅ 14+ | ✅ 90+ |
| cdkDropList | ✅ 90+ | ✅ 88+  | ✅ 14+ | ✅ 90+ |
| Signals | ✅ 90+ | ✅ 88+  | ✅ 14+ | ✅ 90+ |

## Summary

The drag-and-drop system in Blueprint Designer:

1. **Uses Angular CDK** for robust drag-drop functionality
2. **Leverages Signals** for reactive state management
3. **Implements proper coordinates** for accurate positioning
4. **Validates dependencies** after each change
5. **Follows OnPush strategy** for optimal performance
6. **Supports connections** between modules with visual feedback

This architecture ensures a smooth, performant, and maintainable drag-and-drop experience for blueprint design.
