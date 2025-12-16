/**
 * Container Lifecycle Integration Tests
 *
 * Tests the complete lifecycle of a Blueprint Container with multiple modules.
 * Verifies that all subsystems work together correctly.
 */

import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { IBlueprintConfig } from '../config/blueprint-config.interface';
import { BlueprintContainer } from '../container/blueprint-container';
import { IExecutionContext, ContextType } from '../context/execution-context.interface';
import { BlueprintEventType } from '../events/event-types';
import { ModuleStatus } from '../modules/module-status.enum';
import { IBlueprintModule } from '../modules/module.interface';

/**
 * Test Module: Tasks
 */
class TasksModule implements IBlueprintModule {
  readonly id = 'tasks';
  readonly name = 'Tasks Module';
  readonly version = '1.0.0';
  readonly dependencies: string[] = [];
  readonly status = signal<ModuleStatus>(ModuleStatus.UNINITIALIZED);

  initialized = false;
  started = false;
  isReady = false;
  stopped = false;
  disposed = false;

  async init(context: IExecutionContext): Promise<void> {
    this.initialized = true;
    this.status.set(ModuleStatus.INITIALIZED);
    // Store task data in shared context
    context.sharedContext.setState('tasks.enabled', true);
  }

  async start(): Promise<void> {
    this.started = true;
    this.status.set(ModuleStatus.STARTED);
  }

  async ready(): Promise<void> {
    this.isReady = true;
    this.status.set(ModuleStatus.READY);
  }

  async stop(): Promise<void> {
    this.stopped = true;
    this.status.set(ModuleStatus.STOPPED);
  }

  async dispose(): Promise<void> {
    this.disposed = true;
    this.status.set(ModuleStatus.DISPOSED);
  }
}

/**
 * Test Module: Logs (depends on Tasks)
 */
class LogsModule implements IBlueprintModule {
  readonly id = 'logs';
  readonly name = 'Logs Module';
  readonly version = '1.0.0';
  readonly dependencies = ['tasks'];
  readonly status = signal<ModuleStatus>(ModuleStatus.UNINITIALIZED);

  initialized = false;
  started = false;
  isReady = false;
  stopped = false;
  disposed = false;

  async init(context: IExecutionContext): Promise<void> {
    this.initialized = true;
    this.status.set(ModuleStatus.INITIALIZED);
    // Check if tasks module is enabled
    const tasksEnabled = context.sharedContext.getState('tasks.enabled');
    if (!tasksEnabled) {
      throw new Error('Tasks module must be enabled');
    }
  }

  async start(): Promise<void> {
    this.started = true;
    this.status.set(ModuleStatus.STARTED);
  }

  async ready(): Promise<void> {
    this.isReady = true;
    this.status.set(ModuleStatus.READY);
  }

  async stop(): Promise<void> {
    this.stopped = true;
    this.status.set(ModuleStatus.STOPPED);
  }

  async dispose(): Promise<void> {
    this.disposed = true;
    this.status.set(ModuleStatus.DISPOSED);
  }
}

describe('Container Lifecycle Integration', () => {
  let container: BlueprintContainer;
  let config: IBlueprintConfig;
  let tasksModule: TasksModule;
  let logsModule: LogsModule;

  beforeEach(() => {
    config = {
      blueprintId: 'test-blueprint',
      name: 'Test Blueprint',
      version: '1.0.0',
      description: 'Integration test blueprint',
      modules: [
        { id: 'tasks', enabled: true },
        { id: 'logs', enabled: true }
      ],
      featureFlags: {
        enableTasks: true,
        enableLogs: true
      },
      theme: {
        primaryColor: '#1890ff',
        layout: 'side'
      },
      permissions: {
        roles: {
          admin: ['*'],
          member: ['blueprint.read']
        }
      }
    };

    tasksModule = new TasksModule();
    logsModule = new LogsModule();

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

  describe('Complete Lifecycle', () => {
    it('should complete full init → load → start → stop → dispose lifecycle', async () => {
      // 1. Initialize container
      await container.initialize();
      expect(container.status()).toBe('ready');

      // 2. Load modules
      await container.loadModule(tasksModule);
      await container.loadModule(logsModule);

      expect(tasksModule.initialized).toBe(true);
      expect(logsModule.initialized).toBe(true);
      expect(container.moduleCount()).toBe(2);

      // 3. Start container
      await container.start();
      expect(container.status()).toBe('running');
      expect(container.isRunning()).toBe(true);

      expect(tasksModule.started).toBe(true);
      expect(tasksModule.isReady).toBe(true);
      expect(logsModule.started).toBe(true);
      expect(logsModule.isReady).toBe(true);

      // 4. Stop container
      await container.stop();
      expect(container.status()).toBe('stopped');
      expect(container.isRunning()).toBe(false);

      expect(tasksModule.stopped).toBe(true);
      expect(logsModule.stopped).toBe(true);

      // 5. Dispose
      await container.dispose();
      expect(container.status()).toBe('uninitialized');
      expect(container.moduleCount()).toBe(0);

      expect(tasksModule.disposed).toBe(true);
      expect(logsModule.disposed).toBe(true);
    });
  });
});
