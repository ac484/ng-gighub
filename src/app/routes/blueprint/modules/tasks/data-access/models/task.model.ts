import { AssigneeType, Task, TaskPriority, TaskStatus } from '@core/types/task/task.types';

export interface TaskDependency {
  taskId: string;
  type: 'finish-to-start' | 'start-to-start' | 'finish-to-finish' | 'start-to-finish';
  lag?: number;
}

/**
 * WBS 專用任務模型
 * 使用現有 Task 定義並擴充視圖/結構欄位
 */
export interface TaskWithWBS extends Task {
  parentId?: string | null;
  level?: number;
  orderIndex?: number;
  wbsCode?: string;
  path?: string[];

  plannedStartDate?: Date;
  plannedEndDate?: Date;
  actualStartDate?: Date;
  actualEndDate?: Date;
  estimatedHours?: number;
  actualHours?: number;
  estimatedBudget?: number;
  actualBudget?: number;
  progress?: number;

  dependencies?: TaskDependency[];
  blockedBy?: string[];
}

export interface TaskTreeNode {
  task: TaskWithWBS;
  children: TaskTreeNode[];
  expanded: boolean;
  level: number;
}

export const TASK_STATUS_MAP = {
  PENDING: 'pending' as const,
  IN_PROGRESS: 'in-progress' as const,
  ON_HOLD: 'on-hold' as const,
  COMPLETED: 'completed' as const,
  CANCELLED: 'archived' as const
} satisfies Record<keyof typeof TaskStatus, string>;

export const TASK_PRIORITY_MAP = {
  LOW: 'low' as const,
  MEDIUM: 'medium' as const,
  HIGH: 'high' as const,
  CRITICAL: 'urgent' as const
} satisfies Record<keyof typeof TaskPriority, string>;

export type TaskAssigneeType = AssigneeType;
