/**
 * Workflow Models - Simple workflow management
 *
 * @module WorkflowModels
 * @author GigHub Development Team
 * @date 2025-12-13
 */

export enum WorkflowStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  REJECTED = 'rejected'
}

export interface WorkflowInstance {
  id: string;
  blueprintId: string;
  workflowName: string;
  description?: string;
  status: WorkflowStatus;
  currentStep: number;
  totalSteps: number;
  assigneeId?: string;
  metadata?: Record<string, unknown>;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateWorkflowData {
  blueprintId: string;
  workflowName: string;
  description?: string;
  totalSteps: number;
  assigneeId?: string;
  createdBy: string;
}

export interface UpdateWorkflowData {
  status?: WorkflowStatus;
  currentStep?: number;
  assigneeId?: string;
  metadata?: Record<string, unknown>;
}

export interface WorkflowQueryOptions {
  status?: WorkflowStatus;
  assigneeId?: string;
  limit?: number;
}
