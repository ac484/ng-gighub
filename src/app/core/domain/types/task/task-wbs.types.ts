import { Task } from './task.types';

/**
 * 任務依賴關係
 */
export interface TaskDependency {
  taskId: string;
  type: 'finish-to-start' | 'start-to-start' | 'finish-to-finish' | 'start-to-finish';
  lag?: number;
}

/**
 * 擴展任務模型，加入 WBS 與進度欄位
 */
export interface TaskWithWBS extends Task {
  parentId?: string | null;
  level?: number;
  orderIndex?: number;
  wbsCode?: string;
  path?: string[];

  progress?: number;
  plannedStartDate?: Date;
  plannedEndDate?: Date;
  actualStartDate?: Date;
  actualEndDate?: Date;
  estimatedHours?: number;
  actualHours?: number;

  dependencies?: string[];
  dependencyDetails?: TaskDependency[];
  blockedBy?: string[];
}
