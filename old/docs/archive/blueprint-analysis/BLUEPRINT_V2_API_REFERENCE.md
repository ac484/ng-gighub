# Blueprint V2.0 API Reference

**Version**: 2.0.0  
**Date**: 2025-01-10  
**Status**: Production Ready

This document provides complete API documentation for the Blueprint V2.0 system.

---

## Table of Contents

1. [Core Interfaces](#core-interfaces)
2. [Module System](#module-system)
3. [Event Bus](#event-bus)
4. [Container Management](#container-management)
5. [Lifecycle Management](#lifecycle-management)
6. [Resource Provider](#resource-provider)
7. [Shared Context](#shared-context)
8. [Configuration](#configuration)

---

## Core Interfaces

### IBlueprintModule

The main interface that all blueprint modules must implement.

```typescript
interface IBlueprintModule {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly dependencies: string[];
  readonly status: Signal<ModuleStatus>;
  readonly exports?: Record<string, any>;
  
  init(context: IExecutionContext): Promise<void>;
  start(): Promise<void>;
  ready(): Promise<void>;
  stop(): Promise<void>;
  dispose(): Promise<void>;
}
```

**Properties**:
- `id`: Unique module identifier (e.g., 'tasks-module')
- `name`: Human-readable module name
- `version`: Semantic version (e.g., '1.0.0')
- `dependencies`: Array of module IDs this module depends on
- `status`: Reactive signal of current module state
- `exports`: Optional exported functions/objects for other modules

**Methods**:
- `init(context)`: Initialize module with execution context
- `start()`: Start module services
- `ready()`: Mark module as ready to receive requests
- `stop()`: Stop module services gracefully
- `dispose()`: Clean up all module resources

---

### ModuleStatus

Enum defining all possible module states.

```typescript
enum ModuleStatus {
  Uninitialized = 'uninitialized',
  Initialized = 'initialized',
  Starting = 'starting',
  Started = 'started',
  Ready = 'ready',
  Stopping = 'stopping',
  Stopped = 'stopped',
  Disposed = 'disposed'
}
```

**State Transitions**:
```
uninitialized → initialized → starting → started → ready
                                                     ↓
                            disposed ← stopped ← stopping
```

---

## Module System

### IModuleRegistry

Interface for module registration and dependency management.

```typescript
interface IModuleRegistry {
  register(module: IBlueprintModule): void;
  unregister(moduleId: string): void;
  get(moduleId: string): IBlueprintModule | undefined;
  has(moduleId: string): boolean;
  getAll(): IBlueprintModule[];
  getDependencies(moduleId: string): string[];
  getAllDependencies(moduleId: string): string[];
  getDependents(moduleId: string): string[];
  resolveDependencies(moduleIds: string[]): DependencyResolution;
  readonly moduleCount: Signal<number>;
}
```

**Usage Example**:
```typescript
// Register modules
registry.register(tasksModule);
registry.register(logsModule);

// Resolve load order
const resolution = registry.resolveDependencies(['tasks-module']);
console.log('Load order:', resolution.loadOrder);

// Check for circular dependencies
if (resolution.hasCircularDependency) {
  console.error('Circular paths:', resolution.circularPaths);
}
```

---

## Event Bus

### IEventBus

Interface for zero-coupling event-driven communication.

```typescript
interface IEventBus {
  emit<T = any>(
    type: BlueprintEventType | string,
    payload: T,
    source: string
  ): void;
  
  on<T = any>(
    type: BlueprintEventType | string,
    handler: EventHandler<T>
  ): () => void;
  
  once<T = any>(
    type: BlueprintEventType | string,
    handler: EventHandler<T>
  ): () => void;
  
  off(type: BlueprintEventType | string, handler: EventHandler<any>): void;
  
  getHistory(
    type?: BlueprintEventType | string,
    limit?: number
  ): IBlueprintEvent<any>[];
  
  clear(): void;
  dispose(): void;
  
  readonly eventCount: Signal<number>;
}
```

**Usage Example**:
```typescript
// Emit event
eventBus.emit('TASK_CREATED', { taskId: '123', name: 'New Task' }, 'tasks-module');

// Subscribe to event
const unsubscribe = eventBus.on('TASK_CREATED', (event) => {
  console.log('Task created:', event.payload);
});

// One-time subscription
eventBus.once('MODULE_LOADED', (event) => {
  console.log('Module loaded:', event.source);
});

// Unsubscribe
unsubscribe();

// Get event history
const recentEvents = eventBus.getHistory('TASK_CREATED', 10);
```

---

## Container Management

### IBlueprintContainer

Main container interface for managing the blueprint system.

```typescript
interface IBlueprintContainer {
  readonly id: string;
  readonly config: IBlueprintConfig;
  readonly status: Signal<ContainerStatus>;
  readonly moduleCount: Signal<number>;
  
  initialize(): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
  dispose(): Promise<void>;
  
  loadModule(module: IBlueprintModule): Promise<void>;
  unloadModule(moduleId: string): Promise<void>;
  getModule(moduleId: string): IBlueprintModule | undefined;
  getAllModules(): IBlueprintModule[];
  
  reloadModule(moduleId: string): Promise<void>;
  
  getEventBus(): IEventBus;
  getResourceProvider(): IResourceProvider;
  getSharedContext(): SharedContext;
}
```

**Full Usage Example**:
```typescript
// 1. Create container
const config: IBlueprintConfig = {
  id: 'main-blueprint',
  name: 'GigHub Main Blueprint',
  version: '1.0.0',
  modules: ['tasks-module', 'logs-module'],
  featureFlags: { enableHotReload: true },
  theme: { primaryColor: '#1890ff' },
  permissions: { allowModuleUnload: true }
};

const container = new BlueprintContainer(config);

// 2. Initialize container
await container.initialize();

// 3. Load modules
await container.loadModule(tasksModule);
await container.loadModule(logsModule);

// 4. Start container (auto-resolves dependencies)
await container.start();

// 5. Access services
const eventBus = container.getEventBus();
const resources = container.getResourceProvider();

// 6. Hot reload a module
await container.reloadModule('tasks-module');

// 7. Unload module
await container.unloadModule('logs-module');

// 8. Stop and cleanup
await container.stop();
await container.dispose();
```

---

## Lifecycle Management

### ILifecycleManager

Interface for managing module lifecycles.

```typescript
interface ILifecycleManager {
  initialize(module: IBlueprintModule, context: IExecutionContext): Promise<void>;
  start(moduleId: string): Promise<void>;
  ready(moduleId: string): Promise<void>;
  stop(moduleId: string): Promise<void>;
  dispose(moduleId: string): Promise<void>;
  
  getState(moduleId: string): ModuleStatus | undefined;
  isModuleReady(moduleId: string): boolean;
  getModulesByState(status: ModuleStatus): IBlueprintModule[];
  
  readonly moduleStates: Signal<Map<string, ModuleStatus>>;
}
```

**Usage Example**:
```typescript
// Initialize module
await lifecycleManager.initialize(myModule, context);
// State: uninitialized → initialized

// Start module
await lifecycleManager.start(myModule.id);
// State: initialized → starting → started

// Mark ready
await lifecycleManager.ready(myModule.id);
// State: started → ready

// Check state
const isReady = lifecycleManager.isModuleReady(myModule.id);

// Get all ready modules
const readyModules = lifecycleManager.getModulesByState(ModuleStatus.Ready);
```

---

## Resource Provider

### IResourceProvider

Interface for dependency injection and resource management.

```typescript
interface IResourceProvider {
  register<T = any>(
    name: string,
    factory: () => T
  ): void;
  
  registerService<T = any>(
    name: string,
    serviceType: Type<T>
  ): void;
  
  registerValue<T = any>(
    name: string,
    value: T
  ): void;
  
  get<T = any>(name: string): T | undefined;
  
  has(name: string): boolean;
  
  remove(name: string): void;
  
  listResources(): string[];
  
  getInstantiatedResources(): string[];
}
```

**Usage Example**:
```typescript
// Register factory (lazy)
provider.register('apiClient', () => new ApiClient(config));

// Register service (uses Angular DI)
provider.registerService('logger', LoggerService);

// Register value (immediate)
provider.registerValue('config', { apiUrl: 'https://api.example.com' });

// Get resource (auto-instantiated on first access)
const client = provider.get<ApiClient>('apiClient');
const logger = provider.get<LoggerService>('logger');

// Check existence
if (provider.has('apiClient')) {
  // Resource is registered
}

// List all resources
const allResources = provider.listResources();
console.log('Available resources:', allResources);
```

**Default Resources**:
- `'firestore'`: Firestore instance from @angular/fire
- `'auth'`: Auth instance from @angular/fire

---

## Shared Context

### SharedContext

Service for managing shared state across modules.

```typescript
class SharedContext {
  initialize(tenant: TenantInfo): void;
  
  setState<T = any>(
    key: string,
    value: T,
    namespace?: string
  ): void;
  
  getState<T = any>(
    key: string,
    namespace?: string
  ): T | undefined;
  
  getStateSignal<T = any>(
    key: string,
    namespace?: string
  ): Signal<T | undefined>;
  
  hasState(key: string, namespace?: string): boolean;
  
  clearState(key: string, namespace?: string): void;
  
  clearNamespace(namespace: string): void;
  
  clearAll(): void;
  
  getAllKeys(namespace?: string): string[];
  
  readonly tenant: Signal<TenantInfo | null>;
}
```

**Usage Example**:
```typescript
// Initialize with tenant
context.initialize({
  contextType: ContextType.Organization,
  organizationId: 'org-123',
  teamId: 'team-456',
  userId: 'user-789'
});

// Set state
context.setState('theme', 'dark');
context.setState('language', 'zh-TW', 'user');

// Get state
const theme = context.getState<string>('theme');

// Get as reactive signal
const themeSignal = context.getStateSignal<string>('theme');

// In template
{{ themeSignal() }}

// Clear state
context.clearState('theme');
context.clearNamespace('user');
```

---

## Configuration

### IBlueprintConfig

Complete configuration interface for blueprints.

```typescript
interface IBlueprintConfig {
  id: string;
  name: string;
  version: string;
  modules: string[];
  featureFlags?: Record<string, boolean>;
  theme?: {
    primaryColor?: string;
    secondaryColor?: string;
    mode?: 'light' | 'dark';
  };
  permissions?: {
    allowModuleLoad?: boolean;
    allowModuleUnload?: boolean;
    allowModuleReload?: boolean;
  };
  metadata?: Record<string, any>;
}
```

**Example Configuration**:
```typescript
const config: IBlueprintConfig = {
  id: 'gighub-main',
  name: 'GigHub Construction Management',
  version: '2.0.0',
  modules: [
    'tasks-module',
    'logs-module',
    'quality-module'
  ],
  featureFlags: {
    enableHotReload: true,
    enableEventHistory: true,
    enablePerformanceMonitoring: true
  },
  theme: {
    primaryColor: '#1890ff',
    secondaryColor: '#52c41a',
    mode: 'light'
  },
  permissions: {
    allowModuleLoad: true,
    allowModuleUnload: true,
    allowModuleReload: true
  },
  metadata: {
    environment: 'production',
    region: 'asia-east',
    organizationId: 'org-123'
  }
};
```

---

## Event Types

### BlueprintEventType

Standard event types emitted by the system.

```typescript
enum BlueprintEventType {
  // Container events
  CONTAINER_INITIALIZING = 'container:initializing',
  CONTAINER_INITIALIZED = 'container:initialized',
  CONTAINER_STARTING = 'container:starting',
  CONTAINER_STARTED = 'container:started',
  CONTAINER_STOPPING = 'container:stopping',
  CONTAINER_STOPPED = 'container:stopped',
  
  // Module lifecycle events
  MODULE_LOADING = 'module:loading',
  MODULE_LOADED = 'module:loaded',
  MODULE_UNLOADING = 'module:unloading',
  MODULE_UNLOADED = 'module:unloaded',
  MODULE_INITIALIZING = 'module:initializing',
  MODULE_INITIALIZED = 'module:initialized',
  MODULE_STARTING = 'module:starting',
  MODULE_STARTED = 'module:started',
  MODULE_READY = 'module:ready',
  MODULE_STOPPING = 'module:stopping',
  MODULE_STOPPED = 'module:stopped',
  MODULE_DISPOSING = 'module:disposing',
  MODULE_DISPOSED = 'module:disposed',
  
  // Blueprint events
  BLUEPRINT_CREATED = 'blueprint:created',
  BLUEPRINT_UPDATED = 'blueprint:updated',
  BLUEPRINT_DELETED = 'blueprint:deleted',
  
  // Custom events (examples)
  TASK_CREATED = 'task:created',
  TASK_UPDATED = 'task:updated',
  LOG_CREATED = 'log:created'
}
```

---

## Error Handling

All async operations may throw errors. Always use try/catch:

```typescript
try {
  await container.loadModule(myModule);
} catch (error) {
  console.error('Failed to load module:', error);
  // Handle error appropriately
}
```

**Common Errors**:
- `ModuleAlreadyLoadedError`: Module ID already exists
- `ModuleDependencyError`: Missing dependencies
- `CircularDependencyError`: Circular dependency detected
- `ModuleNotFoundError`: Module ID not found
- `InvalidStateTransitionError`: Invalid lifecycle state transition
- `ContainerNotInitializedError`: Container not initialized

---

## Performance Considerations

### Benchmarks

Target performance metrics:
- Container initialization: <50ms
- Module loading: <100ms per module
- Event emission: <1ms
- Dependency resolution: <10ms for 10 modules
- Hot reload: <200ms

### Best Practices

1. **Module Design**:
   - Keep modules small and focused
   - Minimize dependencies
   - Dispose resources properly

2. **Event Bus**:
   - Use specific event types
   - Unsubscribe when done
   - Avoid heavy processing in handlers

3. **Resource Provider**:
   - Use lazy loading for expensive resources
   - Register services, not instances
   - Clean up resources in dispose()

4. **Shared Context**:
   - Use namespaces for organization
   - Clear unused state
   - Avoid storing large objects

---

## TypeScript Types

All APIs are fully typed. Enable strict mode in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true
  }
}
```

---

## Migration from V1

See [Migration Guide](./BLUEPRINT_V2_MIGRATION_GUIDE.md) for detailed migration steps.

---

## Support

For issues and questions:
- GitHub Issues: https://github.com/7Spade/GigHub/issues
- Documentation: `/docs/architecture/`
- Examples: `/docs/architecture/BLUEPRINT_V2_USAGE_EXAMPLES.md`

---

**Last Updated**: 2025-01-10  
**API Version**: 2.0.0  
**Status**: ✅ Production Ready
