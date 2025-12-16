# Blueprint V2.0 Usage Examples

**Version**: 2.0.0  
**Last Updated**: 2025-01-10

This document provides practical examples for using the Blueprint V2.0 system.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Creating Your First Module](#creating-your-first-module)
3. [Container Setup](#container-setup)
4. [Module Communication](#module-communication)
5. [Resource Management](#resource-management)
6. [State Sharing](#state-sharing)
7. [Advanced Patterns](#advanced-patterns)
8. [Real-World Examples](#real-world-examples)

---

## Getting Started

### Prerequisites

```bash
# Angular 20.3.0
# @angular/fire 20.0.1
# RxJS 7.8.0
# TypeScript 5.9.2
```

### Installation

The Blueprint V2.0 system is included in the core package:

```typescript
import {
  IBlueprintModule,
  BlueprintContainer,
  IBlueprintConfig
} from '@core/blueprint';
```

---

## Creating Your First Module

### Step 1: Define Module Interface

```typescript
// tasks/tasks.module.ts
import { Injectable, signal } from '@angular/core';
import {
  IBlueprintModule,
  IExecutionContext,
  ModuleStatus
} from '@core/blueprint';

@Injectable()
export class TasksModule implements IBlueprintModule {
  readonly id = 'tasks-module';
  readonly name = 'Tasks Management';
  readonly version = '1.0.0';
  readonly dependencies: string[] = [];
  
  status = signal<ModuleStatus>(ModuleStatus.Uninitialized);
  
  private context?: IExecutionContext;
  
  constructor() {}
  
  async init(context: IExecutionContext): Promise<void> {
    console.log('[TasksModule] Initializing...');
    this.context = context;
    this.status.set(ModuleStatus.Initialized);
  }
  
  async start(): Promise<void> {
    console.log('[TasksModule] Starting...');
    this.status.set(ModuleStatus.Starting);
    
    // Initialize your services here
    await this.initializeServices();
    
    this.status.set(ModuleStatus.Started);
  }
  
  async ready(): Promise<void> {
    console.log('[TasksModule] Ready');
    this.status.set(ModuleStatus.Ready);
    
    // Subscribe to events
    this.setupEventListeners();
  }
  
  async stop(): Promise<void> {
    console.log('[TasksModule] Stopping...');
    this.status.set(ModuleStatus.Stopping);
    
    // Cleanup subscriptions
    this.cleanup();
    
    this.status.set(ModuleStatus.Stopped);
  }
  
  async dispose(): Promise<void> {
    console.log('[TasksModule] Disposing...');
    this.status.set(ModuleStatus.Disposed);
    
    // Final cleanup
    this.context = undefined;
  }
  
  private async initializeServices(): Promise<void> {
    // Initialize your module services
  }
  
  private setupEventListeners(): void {
    if (!this.context) return;
    
    // Listen to events from other modules
    this.context.eventBus.on('LOG_CREATED', (event) => {
      console.log('Log created:', event.payload);
    });
  }
  
  private cleanup(): void {
    // Cleanup logic
  }
  
  // Public API (exports)
  exports = {
    createTask: (name: string) => {
      console.log('Creating task:', name);
      this.context?.eventBus.emit('TASK_CREATED', { name }, this.id);
    },
    
    getTasks: () => {
      return []; // Return tasks
    }
  };
}
```

### Step 2: Register Module

```typescript
// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { TasksModule } from './tasks/tasks.module';

export const taskModuleProvider = {
  provide: TasksModule,
  useClass: TasksModule
};

export const appConfig: ApplicationConfig = {
  providers: [
    taskModuleProvider,
    // ... other providers
  ]
};
```

---

## Container Setup

### Basic Container Setup

```typescript
// blueprint.service.ts
import { Injectable, inject } from '@angular/core';
import {
  BlueprintContainer,
  IBlueprintConfig,
  IBlueprintModule
} from '@core/blueprint';

@Injectable({ providedIn: 'root' })
export class BlueprintService {
  private container?: BlueprintContainer;
  
  async initialize(modules: IBlueprintModule[]): Promise<void> {
    // 1. Create configuration
    const config: IBlueprintConfig = {
      id: 'main-blueprint',
      name: 'GigHub Main Blueprint',
      version: '2.0.0',
      modules: modules.map(m => m.id),
      featureFlags: {
        enableHotReload: true,
        enableEventHistory: true
      },
      theme: {
        primaryColor: '#1890ff',
        mode: 'light'
      },
      permissions: {
        allowModuleLoad: true,
        allowModuleUnload: true,
        allowModuleReload: true
      }
    };
    
    // 2. Create container
    this.container = new BlueprintContainer(config);
    
    // 3. Initialize container
    await this.container.initialize();
    
    // 4. Load all modules
    for (const module of modules) {
      await this.container.loadModule(module);
    }
    
    // 5. Start container
    await this.container.start();
    
    console.log('Blueprint system initialized successfully');
  }
  
  getContainer(): BlueprintContainer | undefined {
    return this.container;
  }
  
  async shutdown(): Promise<void> {
    if (!this.container) return;
    
    await this.container.stop();
    await this.container.dispose();
    
    console.log('Blueprint system shut down');
  }
}
```

### Using in App Component

```typescript
// app.component.ts
import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { TasksModule } from './tasks/tasks.module';
import { LogsModule } from './logs/logs.module';
import { BlueprintService } from './blueprint.service';

@Component({
  selector: 'app-root',
  standalone: true,
  template: `
    <h1>GigHub</h1>
    @if (initialized()) {
      <router-outlet />
    } @else {
      <nz-spin nzSimple />
    }
  `
})
export class AppComponent implements OnInit, OnDestroy {
  private blueprintService = inject(BlueprintService);
  private tasksModule = inject(TasksModule);
  private logsModule = inject(LogsModule);
  
  initialized = signal(false);
  
  async ngOnInit(): Promise<void> {
    try {
      await this.blueprintService.initialize([
        this.tasksModule,
        this.logsModule
      ]);
      
      this.initialized.set(true);
    } catch (error) {
      console.error('Failed to initialize blueprint:', error);
    }
  }
  
  async ngOnDestroy(): Promise<void> {
    await this.blueprintService.shutdown();
  }
}
```

---

## Module Communication

### Publishing Events

```typescript
// In any module
export class TasksModule implements IBlueprintModule {
  // ...
  
  createTask(name: string): void {
    const task = { id: crypto.randomUUID(), name, createdAt: new Date() };
    
    // Emit event
    this.context?.eventBus.emit(
      'TASK_CREATED',
      task,
      this.id
    );
  }
}
```

### Subscribing to Events

```typescript
// In another module
export class LogsModule implements IBlueprintModule {
  private unsubscribers: (() => void)[] = [];
  
  async ready(): Promise<void> {
    // Subscribe to task events
    const unsubscribe = this.context?.eventBus.on('TASK_CREATED', (event) => {
      console.log('Task created by', event.source, ':', event.payload);
      
      // Create a log entry
      this.createLog(`Task "${event.payload.name}" created`);
    });
    
    if (unsubscribe) {
      this.unsubscribers.push(unsubscribe);
    }
    
    this.status.set(ModuleStatus.Ready);
  }
  
  async stop(): Promise<void> {
    // Unsubscribe from all events
    this.unsubscribers.forEach(fn => fn());
    this.unsubscribers = [];
    
    this.status.set(ModuleStatus.Stopped);
  }
}
```

### One-Time Subscriptions

```typescript
// Subscribe once
this.context?.eventBus.once('MODULE_LOADED', (event) => {
  console.log('A module was loaded:', event.source);
  // This handler will only run once
});
```

---

## Resource Management

### Registering Resources

```typescript
export class TasksModule implements IBlueprintModule {
  async init(context: IExecutionContext): Promise<void> {
    this.context = context;
    
    // Register a factory (lazy loading)
    context.resourceProvider.register('taskRepository', () => {
      const firestore = context.resourceProvider.get('firestore');
      return new TaskRepository(firestore);
    });
    
    // Register a value (immediate)
    context.resourceProvider.registerValue('taskConfig', {
      maxTasks: 100,
      enableNotifications: true
    });
    
    // Register an Angular service
    context.resourceProvider.registerService('taskService', TaskService);
    
    this.status.set(ModuleStatus.Initialized);
  }
}
```

### Accessing Resources

```typescript
// In any module
const firestore = this.context?.resourceProvider.get('firestore');
const taskRepo = this.context?.resourceProvider.get('taskRepository');
const config = this.context?.resourceProvider.get('taskConfig');

// Use resources
if (taskRepo && config) {
  const tasks = await taskRepo.getTasks(config.maxTasks);
}
```

### Accessing Firebase/Firestore

```typescript
// Firestore is auto-registered
import { Firestore, collection, addDoc } from '@angular/fire/firestore';

export class TasksModule implements IBlueprintModule {
  async start(): Promise<void> {
    const firestore = this.context?.resourceProvider.get<Firestore>('firestore');
    
    if (firestore) {
      // Use Firestore
      const tasksRef = collection(firestore, 'tasks');
      await addDoc(tasksRef, {
        name: 'New Task',
        createdAt: new Date()
      });
    }
    
    this.status.set(ModuleStatus.Started);
  }
}
```

---

## State Sharing

### Setting Shared State

```typescript
export class TasksModule implements IBlueprintModule {
  async start(): Promise<void> {
    const context = this.context?.sharedContext;
    
    if (context) {
      // Set global state
      context.setState('currentProject', { id: 'proj-123', name: 'Project A' });
      
      // Set namespaced state
      context.setState('taskFilter', 'active', 'tasks');
      context.setState('sortOrder', 'asc', 'tasks');
    }
    
    this.status.set(ModuleStatus.Started);
  }
}
```

### Reading Shared State

```typescript
export class LogsModule implements IBlueprintModule {
  async start(): Promise<void> {
    const context = this.context?.sharedContext;
    
    if (context) {
      // Get state
      const project = context.getState('currentProject');
      console.log('Current project:', project);
      
      // Get as signal (reactive)
      const projectSignal = context.getStateSignal('currentProject');
      
      // React to changes
      effect(() => {
        const proj = projectSignal();
        if (proj) {
          console.log('Project changed:', proj);
        }
      });
    }
    
    this.status.set(ModuleStatus.Started);
  }
}
```

### Clearing State

```typescript
// Clear specific key
context.clearState('taskFilter', 'tasks');

// Clear entire namespace
context.clearNamespace('tasks');

// Clear all state
context.clearAll();
```

---

## Advanced Patterns

### Module Dependencies

```typescript
// Logs module depends on Tasks module
export class LogsModule implements IBlueprintModule {
  readonly id = 'logs-module';
  readonly dependencies = ['tasks-module']; // Dependency
  
  async ready(): Promise<void> {
    // Access tasks module exports
    const tasksModule = this.context?.moduleRegistry?.get('tasks-module');
    
    if (tasksModule?.exports) {
      const tasks = tasksModule.exports.getTasks();
      console.log('Tasks from tasks module:', tasks);
    }
    
    this.status.set(ModuleStatus.Ready);
  }
}
```

### Hot Reload

```typescript
// In a service or component
async reloadTasksModule(): Promise<void> {
  const container = this.blueprintService.getContainer();
  
  if (container) {
    try {
      await container.reloadModule('tasks-module');
      console.log('Tasks module reloaded successfully');
    } catch (error) {
      console.error('Failed to reload module:', error);
    }
  }
}
```

### Dynamic Module Loading

```typescript
async loadModuleOnDemand(moduleName: string): Promise<void> {
  const container = this.blueprintService.getContainer();
  
  if (!container) return;
  
  // Dynamically import module
  const { QualityModule } = await import('./quality/quality.module');
  const qualityModule = new QualityModule();
  
  // Load into container
  await container.loadModule(qualityModule);
  
  console.log(`${moduleName} loaded dynamically`);
}
```

### Error Recovery

```typescript
export class TasksModule implements IBlueprintModule {
  async start(): Promise<void> {
    this.status.set(ModuleStatus.Starting);
    
    try {
      await this.initializeServices();
      this.status.set(ModuleStatus.Started);
    } catch (error) {
      console.error('[TasksModule] Failed to start:', error);
      
      // Emit error event
      this.context?.eventBus.emit(
        'MODULE_ERROR',
        { moduleId: this.id, error },
        this.id
      );
      
      // Let lifecycle manager handle rollback
      throw error;
    }
  }
}
```

---

## Real-World Examples

### Example 1: Tasks Management Module

Complete implementation:

```typescript
// tasks/tasks.module.ts
import { Injectable, inject, signal } from '@angular/core';
import { Firestore, collection, addDoc, getDocs } from '@angular/fire/firestore';
import {
  IBlueprintModule,
  IExecutionContext,
  ModuleStatus
} from '@core/blueprint';

export interface Task {
  id?: string;
  name: string;
  status: 'pending' | 'in-progress' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

@Injectable({ providedIn: 'root' })
export class TasksModule implements IBlueprintModule {
  readonly id = 'tasks-module';
  readonly name = 'Tasks Management';
  readonly version = '1.0.0';
  readonly dependencies: string[] = [];
  
  status = signal<ModuleStatus>(ModuleStatus.Uninitialized);
  
  private context?: IExecutionContext;
  private firestore?: Firestore;
  private unsubscribers: (() => void)[] = [];
  
  async init(context: IExecutionContext): Promise<void> {
    console.log('[TasksModule] Initializing...');
    this.context = context;
    
    // Get Firestore
    this.firestore = context.resourceProvider.get<Firestore>('firestore');
    
    if (!this.firestore) {
      throw new Error('Firestore not available');
    }
    
    // Register task repository
    context.resourceProvider.register('taskRepository', () => {
      return {
        create: this.createTask.bind(this),
        getAll: this.getAllTasks.bind(this),
        update: this.updateTask.bind(this)
      };
    });
    
    this.status.set(ModuleStatus.Initialized);
  }
  
  async start(): Promise<void> {
    console.log('[TasksModule] Starting...');
    this.status.set(ModuleStatus.Starting);
    
    // Load initial data
    await this.loadTasks();
    
    this.status.set(ModuleStatus.Started);
  }
  
  async ready(): Promise<void> {
    console.log('[TasksModule] Ready');
    
    // Subscribe to events
    const unsubscribe = this.context?.eventBus.on('PROJECT_CHANGED', (event) => {
      console.log('Project changed, reloading tasks...');
      this.loadTasks();
    });
    
    if (unsubscribe) {
      this.unsubscribers.push(unsubscribe);
    }
    
    this.status.set(ModuleStatus.Ready);
  }
  
  async stop(): Promise<void> {
    console.log('[TasksModule] Stopping...');
    this.status.set(ModuleStatus.Stopping);
    
    // Unsubscribe from all events
    this.unsubscribers.forEach(fn => fn());
    this.unsubscribers = [];
    
    this.status.set(ModuleStatus.Stopped);
  }
  
  async dispose(): Promise<void> {
    console.log('[TasksModule] Disposing...');
    this.firestore = undefined;
    this.context = undefined;
    this.status.set(ModuleStatus.Disposed);
  }
  
  // Public API
  private async createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    if (!this.firestore) throw new Error('Firestore not initialized');
    
    const tasksRef = collection(this.firestore, 'tasks');
    const newTask: Task = {
      ...task,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const docRef = await addDoc(tasksRef, newTask);
    
    // Emit event
    this.context?.eventBus.emit(
      'TASK_CREATED',
      { ...newTask, id: docRef.id },
      this.id
    );
    
    return docRef.id;
  }
  
  private async getAllTasks(): Promise<Task[]> {
    if (!this.firestore) throw new Error('Firestore not initialized');
    
    const tasksRef = collection(this.firestore, 'tasks');
    const snapshot = await getDocs(tasksRef);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Task));
  }
  
  private async updateTask(id: string, updates: Partial<Task>): Promise<void> {
    // Implementation...
  }
  
  private async loadTasks(): Promise<void> {
    const tasks = await this.getAllTasks();
    
    // Store in shared context
    this.context?.sharedContext.setState('tasks', tasks, 'tasks');
  }
  
  exports = {
    createTask: this.createTask.bind(this),
    getAllTasks: this.getAllTasks.bind(this),
    updateTask: this.updateTask.bind(this)
  };
}
```

### Example 2: Module Communication Pattern

```typescript
// producer-module.ts (Tasks)
export class TasksModule implements IBlueprintModule {
  // ... initialization code ...
  
  async createTask(name: string): Promise<void> {
    // Create task in database
    const task = await this.saveToDatabase({ name });
    
    // Notify all interested modules
    this.context?.eventBus.emit('TASK_CREATED', task, this.id);
  }
}

// consumer-module.ts (Logs)
export class LogsModule implements IBlueprintModule {
  async ready(): Promise<void> {
    // Listen for task creation
    this.context?.eventBus.on('TASK_CREATED', async (event) => {
      // Create log entry
      await this.createLog({
        type: 'info',
        message: `Task "${event.payload.name}" created by ${event.source}`,
        timestamp: event.timestamp
      });
    });
    
    this.status.set(ModuleStatus.Ready);
  }
}

// consumer-module.ts (Notifications)
export class NotificationsModule implements IBlueprintModule {
  async ready(): Promise<void> {
    // Listen for task creation
    this.context?.eventBus.on('TASK_CREATED', async (event) => {
      // Send notification
      await this.sendNotification({
        title: 'New Task',
        message: `"${event.payload.name}" has been created`,
        userId: event.payload.assignedTo
      });
    });
    
    this.status.set(ModuleStatus.Ready);
  }
}
```

---

## Testing

### Unit Testing a Module

```typescript
// tasks.module.spec.ts
import { TestBed } from '@angular/core/testing';
import { TasksModule } from './tasks.module';
import { EventBus, ResourceProvider, SharedContext } from '@core/blueprint';

describe('TasksModule', () => {
  let module: TasksModule;
  let mockContext: IExecutionContext;
  
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TasksModule]
    });
    
    module = TestBed.inject(TasksModule);
    
    mockContext = {
      blueprintId: 'test',
      userId: 'user-123',
      eventBus: new EventBus(),
      resourceProvider: new ResourceProvider(),
      sharedContext: new SharedContext()
    };
  });
  
  it('should initialize successfully', async () => {
    await module.init(mockContext);
    expect(module.status()).toBe(ModuleStatus.Initialized);
  });
  
  it('should emit TASK_CREATED event', async () => {
    await module.init(mockContext);
    await module.start();
    await module.ready();
    
    let emittedEvent: any;
    mockContext.eventBus.on('TASK_CREATED', (event) => {
      emittedEvent = event;
    });
    
    module.exports.createTask('Test Task');
    
    expect(emittedEvent).toBeDefined();
    expect(emittedEvent.payload.name).toBe('Test Task');
  });
});
```

---

## Troubleshooting

### Common Issues

**1. Module won't start**
```typescript
// Check dependencies are loaded
const deps = container.getModule('my-module')?.dependencies;
console.log('Dependencies:', deps);

// Check if all dependencies are ready
deps?.forEach(depId => {
  const dep = container.getModule(depId);
  console.log(`${depId} status:`, dep?.status());
});
```

**2. Events not firing**
```typescript
// Check event bus subscription
const count = eventBus.getSubscriptionCount('MY_EVENT');
console.log('Subscribers:', count);

// Check event history
const history = eventBus.getHistory('MY_EVENT', 10);
console.log('Recent events:', history);
```

**3. Resource not found**
```typescript
// List all available resources
const resources = resourceProvider.listResources();
console.log('Available resources:', resources);

// Check if resource was instantiated
const instantiated = resourceProvider.getInstantiatedResources();
console.log('Instantiated resources:', instantiated);
```

---

## Best Practices

1. **Always dispose modules properly** - Unsubscribe from events, clean up resources
2. **Use signals for reactive state** - Leverage Angular Signals for reactive updates
3. **Emit events for all significant actions** - Enable loose coupling between modules
4. **Keep modules focused** - Single responsibility principle
5. **Handle errors gracefully** - Try/catch in all async methods
6. **Document your module's API** - Clear exports interface
7. **Test your modules** - Unit and integration tests

---

## Next Steps

- Read [API Reference](./BLUEPRINT_V2_API_REFERENCE.md)
- See [Architecture Documentation](./blueprint-v2-specification.md)
- Check [Migration Guide](./BLUEPRINT_V2_MIGRATION_GUIDE.md)

---

**Last Updated**: 2025-01-10  
**Version**: 2.0.0
