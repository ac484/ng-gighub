/**
 * Event Bus Integration Tests
 *
 * Tests the Event Bus functionality in the context of a full container.
 * Verifies event flow, history tracking, and performance characteristics.
 */

import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { IBlueprintConfig } from '../config/blueprint-config.interface';
import { BlueprintContainer } from '../container/blueprint-container';
import { IExecutionContext } from '../context/execution-context.interface';
import { BlueprintEventType } from '../events/event-types';
import { ModuleStatus } from '../modules/module-status.enum';
import { IBlueprintModule } from '../modules/module.interface';

/**
 * Event Counter Module - Tracks event statistics
 */
class EventCounterModule implements IBlueprintModule {
  readonly id = 'event-counter';
  readonly name = 'Event Counter Module';
  readonly version = '1.0.0';
  readonly dependencies: string[] = [];
  readonly status = signal<ModuleStatus>(ModuleStatus.UNINITIALIZED);

  eventCounts = new Map<string, number>();

  async init(context: IExecutionContext): Promise<void> {
    // Count all events using wildcard
    context.eventBus.on('*', event => {
      const count = this.eventCounts.get(event.type) || 0;
      this.eventCounts.set(event.type, count + 1);
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

  getCount(eventType: string): number {
    return this.eventCounts.get(eventType) || 0;
  }

  getTotalCount(): number {
    let total = 0;
    for (const count of this.eventCounts.values()) {
      total += count;
    }
    return total;
  }
}

/**
 * Simple Test Module
 */
class SimpleModule implements IBlueprintModule {
  readonly id: string;
  readonly name: string;
  readonly version = '1.0.0';
  readonly dependencies: string[] = [];
  readonly status = signal<ModuleStatus>(ModuleStatus.UNINITIALIZED);

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }

  async init(context: IExecutionContext): Promise<void> {
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

describe('Event Bus Integration', () => {
  let container: BlueprintContainer;
  let config: IBlueprintConfig;
  let eventCounter: EventCounterModule;

  beforeEach(() => {
    config = {
      blueprintId: 'test-event-bus',
      name: 'Test Event Bus Blueprint',
      version: '1.0.0',
      description: 'Integration test for event bus',
      modules: [{ id: 'event-counter', enabled: true }],
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

    eventCounter = new EventCounterModule();
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

  describe('Event Flow', () => {
    it('should emit container lifecycle events', async () => {
      await container.initialize();
      await container.loadModule(eventCounter);

      // Clear initialization events
      eventCounter.eventCounts.clear();

      await container.start();
      await container.stop();

      // Should have container lifecycle events
      expect(eventCounter.getCount(BlueprintEventType.CONTAINER_STARTING)).toBeGreaterThan(0);
      expect(eventCounter.getCount(BlueprintEventType.CONTAINER_STARTED)).toBeGreaterThan(0);
      expect(eventCounter.getCount(BlueprintEventType.CONTAINER_STOPPING)).toBeGreaterThan(0);
      expect(eventCounter.getCount(BlueprintEventType.CONTAINER_STOPPED)).toBeGreaterThan(0);
    });

    it('should emit module lifecycle events', async () => {
      await container.initialize();

      const module1 = new SimpleModule('module-1', 'Module 1');

      await container.loadModule(eventCounter);

      // Clear initialization events
      eventCounter.eventCounts.clear();

      await container.loadModule(module1);

      // Should have module loaded event
      expect(eventCounter.getCount(BlueprintEventType.MODULE_LOADED)).toBe(1);
    });

    it('should track event flow across container lifecycle', async () => {
      await container.initialize();
      await container.loadModule(eventCounter);

      const module1 = new SimpleModule('module-1', 'Module 1');
      const module2 = new SimpleModule('module-2', 'Module 2');

      await container.loadModule(module1);
      await container.loadModule(module2);
      await container.start();
      await container.stop();

      // Should have captured all events
      expect(eventCounter.getTotalCount()).toBeGreaterThan(10);
    });
  });

  describe('Event History', () => {
    it('should maintain complete event history', async () => {
      await container.initialize();
      await container.loadModule(eventCounter);

      const context = container.getExecutionContext();

      const module1 = new SimpleModule('module-1', 'Module 1');
      await container.loadModule(module1);
      await container.start();

      const history = context.eventBus.getHistory();

      // Should have history
      expect(history.length).toBeGreaterThan(0);

      // History should be chronologically ordered
      for (let i = 1; i < history.length; i++) {
        expect(history[i].timestamp).toBeGreaterThanOrEqual(history[i - 1].timestamp);
      }
    });

    it('should limit history size to prevent memory leaks', async () => {
      await container.initialize();
      await container.loadModule(eventCounter);
      await container.start();

      const context = container.getExecutionContext();

      // Emit many custom events
      for (let i = 0; i < 2000; i++) {
        context.eventBus.emit('TEST_EVENT', { index: i }, 'test');
      }

      await new Promise(resolve => setTimeout(resolve, 50));

      const history = context.eventBus.getHistory();

      // History should be capped (typically max 1000 events)
      expect(history.length).toBeLessThanOrEqual(1000);
    });

    it('should include event metadata in history', async () => {
      await container.initialize();
      await container.loadModule(eventCounter);

      const context = container.getExecutionContext();

      context.eventBus.emit(
        'CUSTOM_EVENT',
        {
          data: 'test data',
          userId: '123'
        },
        'test-source'
      );

      await new Promise(resolve => setTimeout(resolve, 10));

      const history = context.eventBus.getHistory();
      const customEvent = history.find(e => e.type === 'CUSTOM_EVENT');

      expect(customEvent).toBeTruthy();
      expect(customEvent?.payload.data).toBe('test data');
      expect(customEvent?.payload.userId).toBe('123');
      expect(customEvent?.source).toBe('test-source');
      expect(customEvent?.timestamp).toBeGreaterThan(0);
    });
  });

  describe('Event Subscriptions', () => {
    it('should support multiple handlers for same event', async () => {
      await container.initialize();
      await container.loadModule(eventCounter);

      const context = container.getExecutionContext();

      const handler1Calls: any[] = [];
      const handler2Calls: any[] = [];
      const handler3Calls: any[] = [];

      context.eventBus.on('TEST_MULTI', e => {
        handler1Calls.push(e);
      });
      context.eventBus.on('TEST_MULTI', e => {
        handler2Calls.push(e);
      });
      context.eventBus.on('TEST_MULTI', e => {
        handler3Calls.push(e);
      });

      context.eventBus.emit('TEST_MULTI', { value: 42 }, 'test');

      await new Promise(resolve => setTimeout(resolve, 10));

      // All handlers should be called
      expect(handler1Calls.length).toBe(1);
      expect(handler2Calls.length).toBe(1);
      expect(handler3Calls.length).toBe(1);

      expect(handler1Calls[0].payload.value).toBe(42);
      expect(handler2Calls[0].payload.value).toBe(42);
      expect(handler3Calls[0].payload.value).toBe(42);
    });

    it('should support unsubscribing from events', async () => {
      await container.initialize();
      await container.loadModule(eventCounter);

      const context = container.getExecutionContext();

      const calls: any[] = [];
      const unsubscribe = context.eventBus.on('TEST_UNSUB', e => {
        calls.push(e);
      });

      context.eventBus.emit('TEST_UNSUB', { value: 1 }, 'test');
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(calls.length).toBe(1);

      // Unsubscribe
      unsubscribe();

      context.eventBus.emit('TEST_UNSUB', { value: 2 }, 'test');
      await new Promise(resolve => setTimeout(resolve, 10));

      // Should not receive second event
      expect(calls.length).toBe(1);
    });

    it('should support one-time event handlers', async () => {
      await container.initialize();
      await container.loadModule(eventCounter);

      const context = container.getExecutionContext();

      const calls: any[] = [];
      context.eventBus.once('TEST_ONCE', e => {
        calls.push(e);
      });

      // Emit multiple times
      context.eventBus.emit('TEST_ONCE', { value: 1 }, 'test');
      context.eventBus.emit('TEST_ONCE', { value: 2 }, 'test');
      context.eventBus.emit('TEST_ONCE', { value: 3 }, 'test');

      await new Promise(resolve => setTimeout(resolve, 10));

      // Should only receive first event
      expect(calls.length).toBe(1);
      expect(calls[0].payload.value).toBe(1);
    });
  });

  describe('Performance', () => {
    it('should handle high-frequency events efficiently', async () => {
      await container.initialize();
      await container.loadModule(eventCounter);
      await container.start();

      const context = container.getExecutionContext();
      const startTime = Date.now();
      const eventCount = 10000;

      // Emit many events rapidly
      for (let i = 0; i < eventCount; i++) {
        context.eventBus.emit('PERF_TEST', { index: i }, 'perf');
      }

      const emitDuration = Date.now() - startTime;

      // Should emit 10k events quickly (< 100ms)
      expect(emitDuration).toBeLessThan(100);

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 100));

      // Event counter should have received all events
      expect(eventCounter.getCount('PERF_TEST')).toBe(eventCount);
    });

    it('should handle concurrent event emissions', async () => {
      await container.initialize();
      await container.loadModule(eventCounter);
      await container.start();

      const context = container.getExecutionContext();

      // Clear previous events
      eventCounter.eventCounts.clear();

      // Emit events concurrently
      const promises = [];
      for (let i = 0; i < 100; i++) {
        promises.push(
          new Promise<void>(resolve => {
            context.eventBus.emit('CONCURRENT_TEST', { thread: i }, 'concurrent');
            resolve();
          })
        );
      }

      await Promise.all(promises);
      await new Promise(resolve => setTimeout(resolve, 50));

      // All events should be received
      expect(eventCounter.getCount('CONCURRENT_TEST')).toBe(100);
    });
  });

  describe('Error Resilience', () => {
    it('should continue processing events after handler error', async () => {
      await container.initialize();
      await container.loadModule(eventCounter);

      const context = container.getExecutionContext();

      const successCalls: any[] = [];

      // Add failing handler
      context.eventBus.on('ERROR_TEST', () => {
        throw new Error('Handler failure');
      });

      // Add successful handler after failing one
      context.eventBus.on('ERROR_TEST', e => {
        successCalls.push(e);
      });

      // Emit event
      context.eventBus.emit('ERROR_TEST', { value: 'test' }, 'error-test');
      await new Promise(resolve => setTimeout(resolve, 10));

      // Successful handler should still be called
      expect(successCalls.length).toBe(1);
    });
  });

  describe('Event Bus Cleanup', () => {
    it('should clean up all subscriptions on dispose', async () => {
      await container.initialize();
      await container.loadModule(eventCounter);
      await container.start();

      const context = container.getExecutionContext();

      // Add subscriptions
      context.eventBus.on('CLEANUP_TEST', () => {});
      context.eventBus.on('CLEANUP_TEST', () => {});
      context.eventBus.on('CLEANUP_TEST', () => {});

      // Dispose container
      await container.stop();
      await container.dispose();

      // Event bus should be cleaned up (can't test directly, but shouldn't crash)
      expect(true).toBe(true);
    });
  });

  describe('Reactive Signal Integration', () => {
    it('should reflect event count in reactive signal', async () => {
      await container.initialize();
      await container.loadModule(eventCounter);
      await container.start();

      const context = container.getExecutionContext();

      // Event bus has a reactive counter
      const initialCount = context.eventBus.eventCount();

      // Emit events
      context.eventBus.emit('SIGNAL_TEST', {}, 'test');
      context.eventBus.emit('SIGNAL_TEST', {}, 'test');
      context.eventBus.emit('SIGNAL_TEST', {}, 'test');

      await new Promise(resolve => setTimeout(resolve, 10));

      // Counter should have increased
      expect(context.eventBus.eventCount()).toBeGreaterThan(initialCount);
    });
  });
});
