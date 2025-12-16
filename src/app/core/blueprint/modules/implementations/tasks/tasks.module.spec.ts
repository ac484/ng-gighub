/**
 * Tasks Module Unit Tests
 *
 * Tests for Tasks Module lifecycle and integration.
 *
 * @author GigHub Development Team
 * @date 2025-12-10
 */

import { TestBed } from '@angular/core/testing';
import type { IExecutionContext } from '@core/blueprint/context/execution-context.interface';
import { ModuleStatus } from '@core/blueprint/modules/module-status.enum';

import { TasksModule } from './tasks.module';
import { TasksRepository } from './tasks.repository';
import { TasksService } from './tasks.service';

describe('TasksModule', () => {
  let module: TasksModule;
  let mockContext: Partial<IExecutionContext>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TasksModule,
        {
          provide: TasksService,
          useValue: {
            loadTasks: jasmine.createSpy('loadTasks'),
            clearState: jasmine.createSpy('clearState')
          }
        },
        {
          provide: TasksRepository,
          useValue: {}
        }
      ]
    });

    module = TestBed.inject(TasksModule);

    mockContext = {
      blueprintId: 'test-blueprint-123',
      eventBus: {
        emit: jasmine.createSpy('emit'),
        on: jasmine.createSpy('on')
      } as any,
      getModule: jasmine.createSpy('getModule')
    };
  });

  describe('Module Metadata', () => {
    it('should have correct id', () => {
      expect(module.id).toBe('tasks');
    });

    it('should have correct name', () => {
      expect(module.name).toBe('任務管理');
    });

    it('should have version', () => {
      expect(module.version).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it('should have description', () => {
      expect(module.description).toBeTruthy();
    });

    it('should have empty dependencies array', () => {
      expect(module.dependencies).toEqual([]);
    });
  });

  describe('Lifecycle: init', () => {
    it('should initialize with UNINITIALIZED status', () => {
      expect(module.status()).toBe(ModuleStatus.UNINITIALIZED);
    });

    it('should transition to INITIALIZED after init', async () => {
      await module.init(mockContext as IExecutionContext);
      expect(module.status()).toBe(ModuleStatus.INITIALIZED);
    });

    it('should store execution context', async () => {
      await module.init(mockContext as IExecutionContext);
      // Context is stored internally (private)
      // We verify by checking that start() works without error
      await expect(module.start()).resolves.not.toThrow();
    });

    it('should throw error if blueprint ID is missing', async () => {
      const invalidContext = { ...mockContext, blueprintId: undefined };
      await expectAsync(module.init(invalidContext as IExecutionContext)).toBeRejected();
    });

    it('should set ERROR status on init failure', async () => {
      const invalidContext = { ...mockContext, blueprintId: undefined };
      try {
        await module.init(invalidContext as IExecutionContext);
      } catch (error) {
        expect(module.status()).toBe(ModuleStatus.ERROR);
      }
    });
  });

  describe('Lifecycle: start', () => {
    beforeEach(async () => {
      await module.init(mockContext as IExecutionContext);
    });

    it('should transition to STARTED after start', async () => {
      await module.start();
      expect(module.status()).toBe(ModuleStatus.STARTED);
    });

    it('should load tasks on start', async () => {
      const tasksService = TestBed.inject(TasksService) as any;
      await module.start();
      expect(tasksService.loadTasks).toHaveBeenCalledWith('test-blueprint-123');
    });

    it('should throw error if not initialized', async () => {
      const uninitializedModule = TestBed.inject(TasksModule);
      await expectAsync(uninitializedModule.start()).toBeRejected();
    });
  });

  describe('Lifecycle: ready', () => {
    beforeEach(async () => {
      await module.init(mockContext as IExecutionContext);
      await module.start();
    });

    it('should transition to RUNNING after ready', async () => {
      await module.ready();
      expect(module.status()).toBe(ModuleStatus.RUNNING);
    });

    it('should emit ready event', async () => {
      await module.ready();
      expect(mockContext.eventBus?.emit).toHaveBeenCalled();
    });
  });

  describe('Lifecycle: stop', () => {
    beforeEach(async () => {
      await module.init(mockContext as IExecutionContext);
      await module.start();
      await module.ready();
    });

    it('should transition to STOPPED after stop', async () => {
      await module.stop();
      expect(module.status()).toBe(ModuleStatus.STOPPED);
    });

    it('should clear service state', async () => {
      const tasksService = TestBed.inject(TasksService) as any;
      await module.stop();
      expect(tasksService.clearState).toHaveBeenCalled();
    });
  });

  describe('Lifecycle: dispose', () => {
    beforeEach(async () => {
      await module.init(mockContext as IExecutionContext);
      await module.start();
      await module.ready();
      await module.stop();
    });

    it('should transition to DISPOSED after dispose', async () => {
      await module.dispose();
      expect(module.status()).toBe(ModuleStatus.DISPOSED);
    });

    it('should clear all state', async () => {
      const tasksService = TestBed.inject(TasksService) as any;
      await module.dispose();
      expect(tasksService.clearState).toHaveBeenCalled();
    });
  });

  describe('Full Lifecycle', () => {
    it('should complete full lifecycle without errors', async () => {
      await module.init(mockContext as IExecutionContext);
      expect(module.status()).toBe(ModuleStatus.INITIALIZED);

      await module.start();
      expect(module.status()).toBe(ModuleStatus.STARTED);

      await module.ready();
      expect(module.status()).toBe(ModuleStatus.RUNNING);

      await module.stop();
      expect(module.status()).toBe(ModuleStatus.STOPPED);

      await module.dispose();
      expect(module.status()).toBe(ModuleStatus.DISPOSED);
    });
  });

  describe('Module Exports', () => {
    it('should export service', () => {
      expect(module.exports.service).toBeDefined();
      expect(typeof module.exports.service).toBe('function');
    });

    it('should export repository', () => {
      expect(module.exports.repository).toBeDefined();
      expect(typeof module.exports.repository).toBe('function');
    });

    it('should export metadata', () => {
      expect(module.exports.metadata).toBeDefined();
      expect(module.exports.metadata.id).toBe('tasks');
    });

    it('should export default config', () => {
      expect(module.exports.defaultConfig).toBeDefined();
      expect(module.exports.defaultConfig.features).toBeDefined();
    });

    it('should export events', () => {
      expect(module.exports.events).toBeDefined();
      expect(module.exports.events.TASK_CREATED).toBeDefined();
    });
  });
});
