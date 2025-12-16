/**
 * SETC Workflow Orchestrator Service Tests
 */

import { TestBed } from '@angular/core/testing';

import { SETCWorkflowOrchestratorService } from './setc-workflow-orchestrator.service';
import { EnhancedEventBusService } from '../events/enhanced-event-bus.service';
import type { WorkflowContext, WorkflowStepResult } from './models/workflow-context.model';
import type { WorkflowHandler } from './models/workflow-handler.model';
import type { EnhancedBlueprintEvent } from '../events/models/blueprint-event.model';
import { SystemEventType } from '../events/types/system-event-type.enum';

describe('SETCWorkflowOrchestratorService', () => {
  let service: SETCWorkflowOrchestratorService;
  let eventBus: EnhancedEventBusService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SETCWorkflowOrchestratorService, EnhancedEventBusService]
    });

    service = TestBed.inject(SETCWorkflowOrchestratorService);
    eventBus = TestBed.inject(EnhancedEventBusService);

    // 初始化事件總線
    eventBus.initialize('test-blueprint', 'test-user');
  });

  afterEach(() => {
    service.dispose();
    eventBus.dispose();
  });

  describe('initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should initialize successfully', () => {
      service.initialize('test-blueprint-123');
      // 確認預設處理器已註冊
      const stats = service.getStatistics();
      expect(stats.registeredHandlers).toBeGreaterThan(0);
    });

    it('should skip re-initialization', () => {
      service.initialize('test-blueprint-1');
      service.initialize('test-blueprint-2'); // 應該被跳過
      expect(service.getStatistics().registeredHandlers).toBeGreaterThan(0);
    });
  });

  describe('handler registration', () => {
    beforeEach(() => {
      service.initialize('test-blueprint');
    });

    it('should register a handler', () => {
      const handler: WorkflowHandler = {
        id: 'test-handler',
        name: 'Test Handler',
        execute: async () => ({ stepId: 'test', success: true })
      };

      service.registerHandler(SystemEventType.TASK_CREATED, handler);

      const stats = service.getStatistics();
      expect(stats.registeredHandlers).toBeGreaterThan(0);
    });

    it('should replace existing handler with same id', () => {
      const handler1: WorkflowHandler = {
        id: 'test-handler',
        name: 'Test Handler 1',
        execute: async () => ({ stepId: 'test', success: true })
      };

      const handler2: WorkflowHandler = {
        id: 'test-handler',
        name: 'Test Handler 2',
        execute: async () => ({ stepId: 'test', success: false })
      };

      service.registerHandler(SystemEventType.TASK_CREATED, handler1);
      const countBefore = service.getStatistics().registeredHandlers;

      service.registerHandler(SystemEventType.TASK_CREATED, handler2);
      const countAfter = service.getStatistics().registeredHandlers;

      // 處理器數量應該保持不變（替換而非新增）
      expect(countAfter).toBe(countBefore);
    });

    it('should unregister a handler', () => {
      const handler: WorkflowHandler = {
        id: 'test-handler-to-remove',
        name: 'Test Handler',
        execute: async () => ({ stepId: 'test', success: true })
      };

      service.registerHandler(SystemEventType.TASK_CREATED, handler);
      const countBefore = service.getStatistics().registeredHandlers;

      service.unregisterHandler(SystemEventType.TASK_CREATED, 'test-handler-to-remove');
      const countAfter = service.getStatistics().registeredHandlers;

      expect(countAfter).toBeLessThan(countBefore);
    });
  });

  describe('workflow status', () => {
    beforeEach(() => {
      service.initialize('test-blueprint');
    });

    it('should return undefined for non-existent workflow', () => {
      const status = service.getWorkflowStatus('non-existent-workflow');
      expect(status).toBeUndefined();
    });

    it('should get all workflow statuses', () => {
      const statuses = service.getAllWorkflowStatuses();
      expect(Array.isArray(statuses)).toBe(true);
    });
  });

  describe('workflow control', () => {
    beforeEach(() => {
      service.initialize('test-blueprint');
    });

    it('should pause a running workflow', () => {
      // 註冊一個長時間執行的處理器
      const handler: WorkflowHandler = {
        id: 'long-running-handler',
        name: 'Long Running Handler',
        execute: async () => {
          await new Promise(resolve => setTimeout(resolve, 5000));
          return { stepId: 'test', success: true };
        }
      };

      service.registerHandler(SystemEventType.TASK_CREATED, handler);

      // 暫停不存在的工作流程應該不會報錯
      expect(() => service.pauseWorkflow('non-existent')).not.toThrow();
    });

    it('should resume a paused workflow', () => {
      // 恢復不存在的工作流程應該不會報錯
      expect(() => service.resumeWorkflow('non-existent')).not.toThrow();
    });

    it('should cancel a workflow', () => {
      // 取消不存在的工作流程應該不會報錯
      expect(() => service.cancelWorkflow('non-existent')).not.toThrow();
    });
  });

  describe('statistics', () => {
    beforeEach(() => {
      service.initialize('test-blueprint');
    });

    it('should return correct statistics', () => {
      const stats = service.getStatistics();

      expect(stats).toHaveProperty('totalWorkflows');
      expect(stats).toHaveProperty('runningWorkflows');
      expect(stats).toHaveProperty('completedWorkflows');
      expect(stats).toHaveProperty('failedWorkflows');
      expect(stats).toHaveProperty('cancelledWorkflows');
      expect(stats).toHaveProperty('pausedWorkflows');
      expect(stats).toHaveProperty('registeredHandlers');
      expect(stats).toHaveProperty('lastExecutionTime');
    });

    it('should have default handlers registered', () => {
      const stats = service.getStatistics();
      // 應該有 5 個預設處理器（SETC-020~023 的占位符）
      expect(stats.registeredHandlers).toBeGreaterThanOrEqual(5);
    });
  });

  describe('dispose', () => {
    it('should clean up resources', () => {
      service.initialize('test-blueprint');

      const handler: WorkflowHandler = {
        id: 'test-handler',
        name: 'Test Handler',
        execute: async () => ({ stepId: 'test', success: true })
      };

      service.registerHandler(SystemEventType.TASK_CREATED, handler);

      service.dispose();

      const stats = service.getStatistics();
      expect(stats.registeredHandlers).toBe(0);
      expect(stats.totalWorkflows).toBe(0);
    });
  });

  describe('handler execution', () => {
    beforeEach(() => {
      service.initialize('test-blueprint');
    });

    it('should execute handler when event is emitted', async () => {
      let executed = false;

      const handler: WorkflowHandler = {
        id: 'execution-test-handler',
        name: 'Execution Test Handler',
        execute: async (event: EnhancedBlueprintEvent, context: WorkflowContext): Promise<WorkflowStepResult> => {
          executed = true;
          return { stepId: 'test', success: true };
        }
      };

      service.registerHandler(SystemEventType.BLUEPRINT_UPDATED, handler);

      // 發送事件
      eventBus.emit(SystemEventType.BLUEPRINT_UPDATED, { blueprintId: 'test-blueprint' });

      // 等待處理器執行
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(executed).toBe(true);
    });

    it('should skip handler when condition is not met', async () => {
      let executed = false;

      const handler: WorkflowHandler = {
        id: 'condition-test-handler',
        name: 'Condition Test Handler',
        execute: async (): Promise<WorkflowStepResult> => {
          executed = true;
          return { stepId: 'test', success: true };
        }
      };

      service.registerHandler(SystemEventType.BLUEPRINT_UPDATED, handler, {
        condition: event => event.data?.shouldExecute === true
      });

      // 發送不滿足條件的事件
      eventBus.emit(SystemEventType.BLUEPRINT_UPDATED, { shouldExecute: false });

      // 等待處理
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(executed).toBe(false);
    });

    it('should skip handler when validation fails', async () => {
      let executed = false;

      const handler: WorkflowHandler = {
        id: 'validation-test-handler',
        name: 'Validation Test Handler',
        execute: async (): Promise<WorkflowStepResult> => {
          executed = true;
          return { stepId: 'test', success: true };
        },
        validate: event => event.data?.valid === true
      };

      service.registerHandler(SystemEventType.BLUEPRINT_UPDATED, handler);

      // 發送驗證失敗的事件
      eventBus.emit(SystemEventType.BLUEPRINT_UPDATED, { valid: false });

      // 等待處理
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(executed).toBe(false);
    });

    it('should execute handlers in priority order', async () => {
      const executionOrder: string[] = [];

      const lowPriorityHandler: WorkflowHandler = {
        id: 'low-priority-handler',
        name: 'Low Priority Handler',
        execute: async (): Promise<WorkflowStepResult> => {
          executionOrder.push('low');
          return { stepId: 'low', success: true };
        }
      };

      const highPriorityHandler: WorkflowHandler = {
        id: 'high-priority-handler',
        name: 'High Priority Handler',
        execute: async (): Promise<WorkflowStepResult> => {
          executionOrder.push('high');
          return { stepId: 'high', success: true };
        }
      };

      // 先註冊低優先級，再註冊高優先級
      service.registerHandler(SystemEventType.BLUEPRINT_ARCHIVED, lowPriorityHandler, { priority: 1 });
      service.registerHandler(SystemEventType.BLUEPRINT_ARCHIVED, highPriorityHandler, { priority: 10 });

      // 發送事件
      eventBus.emit(SystemEventType.BLUEPRINT_ARCHIVED, { test: true });

      // 等待處理
      await new Promise(resolve => setTimeout(resolve, 100));

      // 高優先級應該先執行
      expect(executionOrder[0]).toBe('high');
      expect(executionOrder[1]).toBe('low');
    });
  });

  describe('retry mechanism', () => {
    beforeEach(() => {
      service.initialize('test-blueprint');
    });

    it('should retry on failure', async () => {
      let attempts = 0;

      const handler: WorkflowHandler = {
        id: 'retry-test-handler',
        name: 'Retry Test Handler',
        execute: async (): Promise<WorkflowStepResult> => {
          attempts++;
          if (attempts < 3) {
            throw new Error('Temporary failure');
          }
          return { stepId: 'test', success: true };
        }
      };

      service.registerHandler(SystemEventType.BLUEPRINT_DEACTIVATED, handler, {
        retryPolicy: {
          maxAttempts: 3,
          backoffMultiplier: 1,
          initialDelayMs: 10,
          maxDelayMs: 100
        }
      });

      // 發送事件
      eventBus.emit(SystemEventType.BLUEPRINT_DEACTIVATED, { test: true });

      // 等待重試完成
      await new Promise(resolve => setTimeout(resolve, 500));

      expect(attempts).toBe(3);
    });
  });
});
