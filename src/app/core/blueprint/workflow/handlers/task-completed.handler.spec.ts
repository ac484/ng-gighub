/**
 * Task Completed Handler - Unit Tests
 *
 * SETC-020: 任務完成自動建立施工日誌
 *
 * @author GigHub Development Team
 * @date 2025-12-16
 */

import { TestBed } from '@angular/core/testing';
import { LoggerService } from '@core';
import { TasksRepository } from '@core/blueprint/modules/implementations/tasks/tasks.repository';
import { ConstructionLogStore } from '@core/state/stores/construction-log.store';
import { of } from 'rxjs';

import { TaskCompletedHandler, TaskCompletedEventData } from './task-completed.handler';
import { EnhancedEventBusService } from '../../events/enhanced-event-bus.service';
import type { EnhancedBlueprintEvent } from '../../events/models/blueprint-event.model';
import { SystemEventType } from '../../events/types/system-event-type.enum';
import type { WorkflowContext } from '../models/workflow-context.model';

describe('TaskCompletedHandler', () => {
  let handler: TaskCompletedHandler;
  let mockLoggerService: jasmine.SpyObj<LoggerService>;
  let mockLogStore: jasmine.SpyObj<ConstructionLogStore>;
  let mockTaskRepository: jasmine.SpyObj<TasksRepository>;
  let mockEventBus: jasmine.SpyObj<EnhancedEventBusService>;

  const mockTask = {
    id: 'task-123',
    blueprintId: 'blueprint-123',
    title: '測試任務',
    description: '這是一個測試任務',
    status: 'completed',
    priority: 'medium',
    creatorId: 'user-1',
    estimatedHours: 8,
    actualHours: 10,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockLog = {
    id: 'log-456',
    blueprintId: 'blueprint-123',
    title: '施工完成: 測試任務',
    description: '這是一個測試任務',
    date: new Date(),
    creatorId: 'user-1',
    photos: [],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const createMockEvent = (data: Partial<TaskCompletedEventData> = {}): EnhancedBlueprintEvent<TaskCompletedEventData> => ({
    type: SystemEventType.TASK_COMPLETED,
    blueprintId: 'blueprint-123',
    timestamp: new Date(),
    actor: {
      userId: 'user-1',
      userName: 'Test User',
      role: 'admin'
    },
    data: {
      taskId: 'task-123',
      completedBy: 'user-1',
      completedAt: new Date(),
      ...data
    }
  });

  const createMockContext = (): WorkflowContext => ({
    workflowId: 'wf-123',
    blueprintId: 'blueprint-123',
    initiator: {
      userId: 'user-1',
      userName: 'Test User',
      role: 'admin'
    },
    startTime: new Date(),
    currentStep: 0,
    totalSteps: 1,
    data: new Map()
  });

  beforeEach(async () => {
    mockLoggerService = jasmine.createSpyObj('LoggerService', ['info', 'warn', 'error']);
    mockLogStore = jasmine.createSpyObj('ConstructionLogStore', ['createLog', 'deleteLog']);
    mockTaskRepository = jasmine.createSpyObj('TasksRepository', ['findById']);
    mockEventBus = jasmine.createSpyObj('EnhancedEventBusService', ['emit']);

    await TestBed.configureTestingModule({
      providers: [
        TaskCompletedHandler,
        { provide: LoggerService, useValue: mockLoggerService },
        { provide: ConstructionLogStore, useValue: mockLogStore },
        { provide: TasksRepository, useValue: mockTaskRepository },
        { provide: EnhancedEventBusService, useValue: mockEventBus }
      ]
    }).compileComponents();

    handler = TestBed.inject(TaskCompletedHandler);
  });

  describe('execute', () => {
    it('should create a log when task is completed', async () => {
      // Arrange
      const event = createMockEvent();
      const context = createMockContext();

      mockTaskRepository.findById.and.returnValue(of(mockTask as any));
      mockLogStore.createLog.and.returnValue(Promise.resolve(mockLog as any));

      // Act
      const result = await handler.execute(event, context);

      // Assert
      expect(result.success).toBe(true);
      expect(result.stepId).toBe('task-completed-handler');
      expect(result.data).toEqual(
        jasmine.objectContaining({
          logId: 'log-456',
          taskId: 'task-123'
        })
      );
      expect(mockLogStore.createLog).toHaveBeenCalled();
      expect(mockEventBus.emit).toHaveBeenCalledWith(
        SystemEventType.LOG_CREATED,
        jasmine.objectContaining({
          logId: 'log-456',
          taskId: 'task-123',
          autoCreated: true
        }),
        jasmine.any(Object),
        jasmine.any(Object)
      );
    });

    it('should store log data in context', async () => {
      // Arrange
      const event = createMockEvent();
      const context = createMockContext();

      mockTaskRepository.findById.and.returnValue(of(mockTask as any));
      mockLogStore.createLog.and.returnValue(Promise.resolve(mockLog as any));

      // Act
      await handler.execute(event, context);

      // Assert
      expect(context.data.get('logId')).toBe('log-456');
      expect(context.data.get('taskId')).toBe('task-123');
      expect(context.data.get('autoCreated')).toBe(true);
    });

    it('should fail when task is not found', async () => {
      // Arrange
      const event = createMockEvent();
      const context = createMockContext();

      mockTaskRepository.findById.and.returnValue(of(null));

      // Act
      const result = await handler.execute(event, context);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('not found');
    });

    it('should fail when log creation fails', async () => {
      // Arrange
      const event = createMockEvent();
      const context = createMockContext();

      mockTaskRepository.findById.and.returnValue(of(mockTask as any));
      mockLogStore.createLog.and.returnValue(Promise.reject(new Error('Database error')));

      // Act
      const result = await handler.execute(event, context);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Database error');
    });

    it('should continue workflow even on failure', async () => {
      // Arrange
      const event = createMockEvent();
      const context = createMockContext();

      mockTaskRepository.findById.and.returnValue(of(null));

      // Act
      const result = await handler.execute(event, context);

      // Assert
      expect(result.continueWorkflow).toBe(true);
    });
  });

  describe('validate', () => {
    it('should return true for valid event', () => {
      // Arrange
      const event = createMockEvent();

      // Act
      const result = handler.validate(event);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when taskId is missing', () => {
      // Arrange
      const event = createMockEvent({ taskId: '' });
      event.data!.taskId = '';

      // Act
      const result = handler.validate(event);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when blueprintId is missing', () => {
      // Arrange
      const event = createMockEvent();
      event.blueprintId = '';

      // Act
      const result = handler.validate(event);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when actor is missing', () => {
      // Arrange
      const event = createMockEvent();
      event.actor = { userId: '', userName: '', role: '' };

      // Act
      const result = handler.validate(event);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false for wrong event type', () => {
      // Arrange
      const event = createMockEvent();
      event.type = SystemEventType.TASK_CREATED;

      // Act
      const result = handler.validate(event);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('rollback', () => {
    it('should delete log on rollback', async () => {
      // Arrange
      const context = createMockContext();
      context.data.set('logId', 'log-456');

      mockLogStore.deleteLog.and.returnValue(Promise.resolve());

      // Act
      await handler.rollback(context);

      // Assert
      expect(mockLogStore.deleteLog).toHaveBeenCalledWith('blueprint-123', 'log-456');
    });

    it('should not throw when log deletion fails', async () => {
      // Arrange
      const context = createMockContext();
      context.data.set('logId', 'log-456');

      mockLogStore.deleteLog.and.returnValue(Promise.reject(new Error('Delete failed')));

      // Act & Assert
      await expectAsync(handler.rollback(context)).toBeResolved();
    });

    it('should do nothing when logId is not set', async () => {
      // Arrange
      const context = createMockContext();

      // Act
      await handler.rollback(context);

      // Assert
      expect(mockLogStore.deleteLog).not.toHaveBeenCalled();
    });
  });

  describe('handler metadata', () => {
    it('should have correct id', () => {
      expect(handler.id).toBe('task-completed-handler');
    });

    it('should have correct name', () => {
      expect(handler.name).toBe('任務完成自動建立日誌');
    });

    it('should have options defined', () => {
      expect(handler.options).toBeDefined();
      expect(handler.options?.priority).toBe(10);
      expect(handler.options?.retryable).toBe(true);
      expect(handler.options?.critical).toBe(false);
    });
  });
});
