/**
 * Module Communication Integration Tests
 *
 * Tests event-driven communication between modules through the Event Bus.
 * Verifies zero-coupling architecture and message passing patterns.
 */

import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { IBlueprintConfig } from '../config/blueprint-config.interface';
import { BlueprintContainer } from '../container/blueprint-container';
import { IExecutionContext, ContextType } from '../context/execution-context.interface';
import { BlueprintEvent } from '../events/event.interface';
import { ModuleStatus } from '../modules/module-status.enum';
import { IBlueprintModule } from '../modules/module.interface';

/**
 * Publisher Module - Sends events
 */
class PublisherModule implements IBlueprintModule {
  readonly id = 'publisher';
  readonly name = 'Publisher Module';
  readonly version = '1.0.0';
  readonly dependencies: string[] = [];
  readonly status = signal<ModuleStatus>(ModuleStatus.UNINITIALIZED);

  private context?: IExecutionContext;

  async init(context: IExecutionContext): Promise<void> {
    this.context = context;
    this.status.set(ModuleStatus.INITIALIZED);
  }

  async start(): Promise<void> {
    this.status.set(ModuleStatus.STARTED);
  }

  async ready(): Promise<void> {
    this.status.set(ModuleStatus.READY);
  }

  async stop(): Promise<void> {
    this.status.set(ModuleStatus.STOPPED);
  }

  async dispose(): Promise<void> {
    this.status.set(ModuleStatus.DISPOSED);
  }

  // Public method to publish events
  publishTaskCreated(taskId: string, taskName: string): void {
    if (!this.context) return;

    this.context.eventBus.emit(
      'TASK_CREATED',
      {
        taskId,
        taskName,
        timestamp: Date.now()
      },
      this.id
    );
  }

  publishTaskUpdated(taskId: string, changes: Record<string, any>): void {
    if (!this.context) return;

    this.context.eventBus.emit(
      'TASK_UPDATED',
      {
        taskId,
        changes,
        timestamp: Date.now()
      },
      this.id
    );
  }
}

/**
 * Subscriber Module - Receives events
 */
class SubscriberModule implements IBlueprintModule {
  readonly id = 'subscriber';
  readonly name = 'Subscriber Module';
  readonly version = '1.0.0';
  readonly dependencies: string[] = [];
  readonly status = signal<ModuleStatus>(ModuleStatus.UNINITIALIZED);

  private context?: IExecutionContext;
  receivedEvents: BlueprintEvent[] = [];

  async init(context: IExecutionContext): Promise<void> {
    this.context = context;

    // Subscribe to events
    context.eventBus.on('TASK_CREATED', event => {
      this.receivedEvents.push(event);
    });

    context.eventBus.on('TASK_UPDATED', event => {
      this.receivedEvents.push(event);
    });

    this.status.set(ModuleStatus.INITIALIZED);
  }

  async start(): Promise<void> {
    this.status.set(ModuleStatus.STARTED);
  }

  async ready(): Promise<void> {
    this.status.set(ModuleStatus.READY);
  }

  async stop(): Promise<void> {
    this.status.set(ModuleStatus.STOPPED);
  }

  async dispose(): Promise<void> {
    this.status.set(ModuleStatus.DISPOSED);
  }
}

/**
 * Logger Module - Logs all events
 */
class LoggerModule implements IBlueprintModule {
  readonly id = 'logger';
  readonly name = 'Logger Module';
  readonly version = '1.0.0';
  readonly dependencies: string[] = [];
  readonly status = signal<ModuleStatus>(ModuleStatus.UNINITIALIZED);

  loggedEvents: Array<{ type: string; source: string; timestamp: number }> = [];

  async init(context: IExecutionContext): Promise<void> {
    // Subscribe to all events using wildcard pattern
    context.eventBus.on('*', event => {
      this.loggedEvents.push({
        type: event.type,
        source: event.source,
        timestamp: event.timestamp
      });
    });

    this.status.set(ModuleStatus.INITIALIZED);
  }

  async start(): Promise<void> {
    this.status.set(ModuleStatus.STARTED);
  }

  async ready(): Promise<void> {
    this.status.set(ModuleStatus.READY);
  }

  async stop(): Promise<void> {
    this.status.set(ModuleStatus.STOPPED);
  }

  async dispose(): Promise<void> {
    this.status.set(ModuleStatus.DISPOSED);
  }
}

describe('Module Communication Integration', () => {
  let container: BlueprintContainer;
  let config: IBlueprintConfig;
  let publisherModule: PublisherModule;
  let subscriberModule: SubscriberModule;
  let loggerModule: LoggerModule;

  beforeEach(() => {
    config = {
      blueprintId: 'test-communication',
      name: 'Test Communication Blueprint',
      version: '1.0.0',
      description: 'Integration test for module communication',
      modules: [
        { id: 'publisher', enabled: true },
        { id: 'subscriber', enabled: true },
        { id: 'logger', enabled: true }
      ],
      featureFlags: {},
      theme: {
        primaryColor: '#1890ff',
        layout: 'side'
      },
      permissions: {
        roles: {
          admin: ['*']
        }
      }
    };

    publisherModule = new PublisherModule();
    subscriberModule = new SubscriberModule();
    loggerModule = new LoggerModule();

    container = new BlueprintContainer(config);
  });

  afterEach(async () => {
    try {
      if (container.isRunning()) {
        await container.stop();
      }
      await container.dispose();
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('Event-Driven Communication', () => {
    it('should enable modules to communicate via events without direct references', async () => {
      await container.initialize();
      await container.loadModule(publisherModule);
      await container.loadModule(subscriberModule);
      await container.start();

      // Publisher sends event
      publisherModule.publishTaskCreated('task-1', 'Test Task');

      // Wait a tick for async event processing
      await new Promise(resolve => setTimeout(resolve, 10));

      // Subscriber should receive the event
      expect(subscriberModule.receivedEvents.length).toBe(1);
      expect(subscriberModule.receivedEvents[0].type).toBe('TASK_CREATED');
      expect(subscriberModule.receivedEvents[0].payload.taskId).toBe('task-1');
      expect(subscriberModule.receivedEvents[0].payload.taskName).toBe('Test Task');
    });

    it('should support multiple subscribers for the same event', async () => {
      await container.initialize();

      // Create second subscriber
      const subscriber2 = new SubscriberModule();
      (subscriber2 as any).id = 'subscriber2';

      await container.loadModule(publisherModule);
      await container.loadModule(subscriberModule);
      await container.loadModule(subscriber2);
      await container.start();

      // Publisher sends event
      publisherModule.publishTaskCreated('task-2', 'Shared Task');

      await new Promise(resolve => setTimeout(resolve, 10));

      // Both subscribers should receive the event
      expect(subscriberModule.receivedEvents.length).toBe(1);
      expect(subscriber2.receivedEvents.length).toBe(1);

      expect(subscriberModule.receivedEvents[0].payload.taskId).toBe('task-2');
      expect(subscriber2.receivedEvents[0].payload.taskId).toBe('task-2');
    });

    it('should support wildcard event subscriptions', async () => {
      await container.initialize();
      await container.loadModule(publisherModule);
      await container.loadModule(loggerModule);
      await container.start();

      // Clear initialization events
      loggerModule.loggedEvents = [];

      // Publisher sends multiple events
      publisherModule.publishTaskCreated('task-3', 'Task 3');
      publisherModule.publishTaskUpdated('task-3', { status: 'done' });

      await new Promise(resolve => setTimeout(resolve, 10));

      // Logger should have received both events
      expect(loggerModule.loggedEvents.length).toBeGreaterThanOrEqual(2);

      const taskEvents = loggerModule.loggedEvents.filter(e => e.type === 'TASK_CREATED' || e.type === 'TASK_UPDATED');

      expect(taskEvents.length).toBe(2);
      expect(taskEvents[0].type).toBe('TASK_CREATED');
      expect(taskEvents[1].type).toBe('TASK_UPDATED');
    });
  });

  describe('Zero-Coupling Verification', () => {
    it('should prevent direct module references', () => {
      // Verify that modules don't have references to each other
      expect(publisherModule.constructor.name).toBe('PublisherModule');
      expect(subscriberModule.constructor.name).toBe('SubscriberModule');

      // Publisher should not have any reference to subscriber
      const publisherProps = Object.keys(publisherModule);
      expect(publisherProps).not.toContain('subscriber');
      expect(publisherProps).not.toContain('subscriberModule');

      // Subscriber should not have any reference to publisher
      const subscriberProps = Object.keys(subscriberModule);
      expect(subscriberProps).not.toContain('publisher');
      expect(subscriberProps).not.toContain('publisherModule');
    });

    it('should allow modules to be loaded in any order', async () => {
      await container.initialize();

      // Load in reverse order
      await container.loadModule(subscriberModule);
      await container.loadModule(publisherModule);
      await container.start();

      publisherModule.publishTaskCreated('task-4', 'Order Test');

      await new Promise(resolve => setTimeout(resolve, 10));

      // Communication should still work
      expect(subscriberModule.receivedEvents.length).toBe(1);
    });
  });

  describe('Event Lifecycle', () => {
    it('should unsubscribe events when module is disposed', async () => {
      await container.initialize();
      await container.loadModule(publisherModule);
      await container.loadModule(subscriberModule);
      await container.start();

      // Send event while subscriber is active
      publisherModule.publishTaskCreated('task-5', 'Active Test');
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(subscriberModule.receivedEvents.length).toBe(1);

      // Unload subscriber
      await container.unloadModule('subscriber');

      // Send another event
      publisherModule.publishTaskCreated('task-6', 'Inactive Test');
      await new Promise(resolve => setTimeout(resolve, 10));

      // Subscriber should still have only 1 event (was disposed)
      expect(subscriberModule.receivedEvents.length).toBe(1);
    });

    it('should maintain event history for debugging', async () => {
      await container.initialize();
      await container.loadModule(publisherModule);
      await container.loadModule(subscriberModule);
      await container.start();

      const context = container.getExecutionContext();

      // Send multiple events
      publisherModule.publishTaskCreated('task-7', 'History Test 1');
      publisherModule.publishTaskUpdated('task-7', { status: 'in-progress' });
      publisherModule.publishTaskUpdated('task-7', { status: 'done' });

      await new Promise(resolve => setTimeout(resolve, 10));

      // Check event history
      const history = context.eventBus.getHistory();
      const taskEvents = history.filter(e => e.source === 'publisher' && (e.type === 'TASK_CREATED' || e.type === 'TASK_UPDATED'));

      expect(taskEvents.length).toBe(3);
      expect(taskEvents[0].type).toBe('TASK_CREATED');
      expect(taskEvents[1].type).toBe('TASK_UPDATED');
      expect(taskEvents[2].type).toBe('TASK_UPDATED');
    });
  });

  describe('Error Handling', () => {
    it('should isolate errors in event handlers', async () => {
      await container.initialize();

      // Create module with failing event handler
      class FailingSubscriber implements IBlueprintModule {
        readonly id = 'failing-subscriber';
        readonly name = 'Failing Subscriber';
        readonly version = '1.0.0';
        readonly dependencies: string[] = [];
        readonly status = signal<ModuleStatus>(ModuleStatus.UNINITIALIZED);

        async init(context: IExecutionContext): Promise<void> {
          context.eventBus.on('TASK_CREATED', () => {
            throw new Error('Handler error');
          });
          this.status.set(ModuleStatus.INITIALIZED);
        }

        async start(): Promise<void> {
          this.status.set(ModuleStatus.STARTED);
        }
        async ready(): Promise<void> {
          this.status.set(ModuleStatus.READY);
        }
        async stop(): Promise<void> {
          this.status.set(ModuleStatus.STOPPED);
        }
        async dispose(): Promise<void> {
          this.status.set(ModuleStatus.DISPOSED);
        }
      }

      await container.loadModule(publisherModule);
      await container.loadModule(new FailingSubscriber());
      await container.loadModule(subscriberModule);
      await container.start();

      // Send event - failing subscriber should not affect normal subscriber
      publisherModule.publishTaskCreated('task-8', 'Error Test');
      await new Promise(resolve => setTimeout(resolve, 10));

      // Normal subscriber should still receive the event
      expect(subscriberModule.receivedEvents.length).toBe(1);
    });
  });

  describe('Performance', () => {
    it('should handle high-volume event traffic', async () => {
      await container.initialize();
      await container.loadModule(publisherModule);
      await container.loadModule(subscriberModule);
      await container.start();

      const startTime = Date.now();
      const eventCount = 1000;

      // Send many events
      for (let i = 0; i < eventCount; i++) {
        publisherModule.publishTaskCreated(`task-${i}`, `Task ${i}`);
      }

      await new Promise(resolve => setTimeout(resolve, 100));

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should process 1000 events in reasonable time (< 200ms)
      expect(duration).toBeLessThan(200);

      // All events should be delivered
      expect(subscriberModule.receivedEvents.length).toBe(eventCount);
    });
  });
});
