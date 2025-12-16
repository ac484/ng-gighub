/**
 * Log Created Handler - Unit Tests
 *
 * SETC-021: 日誌建立自動建立 QC 待驗
 *
 * @author GigHub Development Team
 * @date 2025-12-16
 */

import { TestBed } from '@angular/core/testing';
import { LoggerService } from '@core';
import { QaRepository } from '@core/blueprint/modules/implementations/qa';
import { LogFirestoreRepository } from '@core/data-access/repositories/log-firestore.repository';

import { LogCreatedHandler, LogCreatedEventData } from './log-created.handler';
import { EnhancedEventBusService } from '../../events/enhanced-event-bus.service';
import type { EnhancedBlueprintEvent } from '../../events/models/blueprint-event.model';
import { SystemEventType } from '../../events/types/system-event-type.enum';
import type { WorkflowContext } from '../models/workflow-context.model';

describe('LogCreatedHandler', () => {
  let handler: LogCreatedHandler;
  let mockLoggerService: jasmine.SpyObj<LoggerService>;
  let mockLogRepository: jasmine.SpyObj<LogFirestoreRepository>;
  let mockQaRepository: jasmine.SpyObj<QaRepository>;
  let mockEventBus: jasmine.SpyObj<EnhancedEventBusService>;

  const mockLog = {
    id: 'log-123',
    blueprintId: 'blueprint-123',
    title: '測試日誌',
    description: '這是一個測試日誌',
    date: new Date(),
    workHours: 8,
    workers: 5,
    weather: '晴天',
    creatorId: 'user-1',
    photos: [],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockQcRecord = {
    id: 'qc-456',
    blueprintId: 'blueprint-123',
    title: 'QC 待驗: 測試日誌',
    description: '來自施工日誌的品質檢驗待辦',
    severity: 'medium',
    status: 'open',
    createdBy: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const createMockEvent = (data: Partial<LogCreatedEventData> = {}): EnhancedBlueprintEvent<LogCreatedEventData> => ({
    type: SystemEventType.LOG_CREATED,
    blueprintId: 'blueprint-123',
    timestamp: new Date(),
    actor: {
      userId: 'user-1',
      userName: 'Test User',
      role: 'admin'
    },
    data: {
      logId: 'log-123',
      blueprintId: 'blueprint-123',
      taskId: 'task-123',
      autoCreated: true,
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
    mockLogRepository = jasmine.createSpyObj('LogFirestoreRepository', ['findById']);
    mockQaRepository = jasmine.createSpyObj('QaRepository', ['create', 'delete']);
    mockEventBus = jasmine.createSpyObj('EnhancedEventBusService', ['emit']);

    await TestBed.configureTestingModule({
      providers: [
        LogCreatedHandler,
        { provide: LoggerService, useValue: mockLoggerService },
        { provide: LogFirestoreRepository, useValue: mockLogRepository },
        { provide: QaRepository, useValue: mockQaRepository },
        { provide: EnhancedEventBusService, useValue: mockEventBus }
      ]
    }).compileComponents();

    handler = TestBed.inject(LogCreatedHandler);
  });

  describe('execute', () => {
    it('should create a QC record when log is created', async () => {
      // Arrange
      const event = createMockEvent();
      const context = createMockContext();

      mockLogRepository.findById.and.returnValue(Promise.resolve(mockLog as any));
      mockQaRepository.create.and.returnValue(Promise.resolve(mockQcRecord as any));

      // Act
      const result = await handler.execute(event, context);

      // Assert
      expect(result.success).toBe(true);
      expect(result.stepId).toBe('log-created-handler');
      expect(result.data).toEqual(
        jasmine.objectContaining({
          qcRecordId: 'qc-456',
          logId: 'log-123'
        })
      );
      expect(mockQaRepository.create).toHaveBeenCalled();
      expect(mockEventBus.emit).toHaveBeenCalledWith(
        SystemEventType.QC_INSPECTION_CREATED,
        jasmine.objectContaining({
          inspectionId: 'qc-456',
          logId: 'log-123',
          autoCreated: true
        }),
        jasmine.any(Object),
        jasmine.any(Object)
      );
    });

    it('should store QC record data in context', async () => {
      // Arrange
      const event = createMockEvent();
      const context = createMockContext();

      mockLogRepository.findById.and.returnValue(Promise.resolve(mockLog as any));
      mockQaRepository.create.and.returnValue(Promise.resolve(mockQcRecord as any));

      // Act
      await handler.execute(event, context);

      // Assert
      expect(context.data.get('qcRecordId')).toBe('qc-456');
      expect(context.data.get('logId')).toBe('log-123');
      expect(context.data.get('inspectorId')).toBe('system-inspector');
    });

    it('should fail when log is not found', async () => {
      // Arrange
      const event = createMockEvent();
      const context = createMockContext();

      mockLogRepository.findById.and.returnValue(Promise.resolve(null));

      // Act
      const result = await handler.execute(event, context);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('not found');
    });

    it('should fail when QC record creation fails', async () => {
      // Arrange
      const event = createMockEvent();
      const context = createMockContext();

      mockLogRepository.findById.and.returnValue(Promise.resolve(mockLog as any));
      mockQaRepository.create.and.returnValue(Promise.reject(new Error('Database error')));

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

      mockLogRepository.findById.and.returnValue(Promise.resolve(null));

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

    it('should return false when logId is missing', () => {
      // Arrange
      const event = createMockEvent({ logId: '' });
      event.data!.logId = '';

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
      event.type = SystemEventType.TASK_COMPLETED;

      // Act
      const result = handler.validate(event);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('rollback', () => {
    it('should delete QC record on rollback', async () => {
      // Arrange
      const context = createMockContext();
      context.data.set('qcRecordId', 'qc-456');

      mockQaRepository.delete.and.returnValue(Promise.resolve());

      // Act
      await handler.rollback(context);

      // Assert
      expect(mockQaRepository.delete).toHaveBeenCalledWith('blueprint-123', 'qc-456');
    });

    it('should not throw when QC record deletion fails', async () => {
      // Arrange
      const context = createMockContext();
      context.data.set('qcRecordId', 'qc-456');

      mockQaRepository.delete.and.returnValue(Promise.reject(new Error('Delete failed')));

      // Act & Assert
      await expectAsync(handler.rollback(context)).toBeResolved();
    });

    it('should do nothing when qcRecordId is not set', async () => {
      // Arrange
      const context = createMockContext();

      // Act
      await handler.rollback(context);

      // Assert
      expect(mockQaRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('handler metadata', () => {
    it('should have correct id', () => {
      expect(handler.id).toBe('log-created-handler');
    });

    it('should have correct name', () => {
      expect(handler.name).toBe('日誌建立自動建立 QC 待驗');
    });

    it('should have options defined', () => {
      expect(handler.options).toBeDefined();
      expect(handler.options?.priority).toBe(9);
      expect(handler.options?.retryable).toBe(true);
      expect(handler.options?.critical).toBe(false);
    });
  });

  describe('calculateInspectionDate', () => {
    it('should return next business day', async () => {
      // This is tested indirectly through execute
      const event = createMockEvent();
      const context = createMockContext();

      mockLogRepository.findById.and.returnValue(Promise.resolve(mockLog as any));
      mockQaRepository.create.and.returnValue(Promise.resolve(mockQcRecord as any));

      const result = await handler.execute(event, context);

      expect(result.success).toBe(true);
      expect(result.data?.scheduledDate).toBeDefined();
    });
  });
});
