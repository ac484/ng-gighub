# SETC-051: Task Schedule Management Service

> **任務編號**: SETC-051  
> **模組**: Task Module (任務模組)  
> **優先級**: P1 (Important)  
> **預估工時**: 2 天  
> **依賴**: SETC-049  
> **狀態**: 📋 待開始

---

## 📋 任務概述

### 目標
實作任務排程管理服務，支援任務時間規劃、甘特圖視圖、日曆視圖、排程衝突檢查和關鍵路徑分析。

### 範圍
- 任務時間規劃（開始/結束日期）
- 里程碑管理
- 甘特圖資料支援
- 日曆視圖資料支援
- 排程衝突檢查
- 關鍵路徑分析（可選）

---

## 🏗️ 技術實作

### 服務介面定義

```typescript
import { Observable } from 'rxjs';

export interface ITaskScheduleService {
  // 排程設定
  setSchedule(taskId: string, schedule: TaskScheduleInput): Promise<TaskSchedule>;
  updateSchedule(taskId: string, schedule: Partial<TaskScheduleInput>): Promise<TaskSchedule>;
  clearSchedule(taskId: string): Promise<void>;
  
  // 批次排程
  setScheduleBatch(schedules: { taskId: string; schedule: TaskScheduleInput }[]): Promise<TaskSchedule[]>;
  
  // 里程碑
  createMilestone(data: CreateMilestoneInput): Promise<Milestone>;
  updateMilestone(milestoneId: string, data: Partial<Milestone>): Promise<Milestone>;
  deleteMilestone(milestoneId: string): Promise<void>;
  getMilestones(blueprintId: string): Promise<Milestone[]>;
  
  // 視圖資料
  getGanttData(blueprintId: string, options?: GanttOptions): Promise<GanttData>;
  getCalendarData(blueprintId: string, dateRange: DateRange): Promise<CalendarData>;
  getTimelineData(blueprintId: string): Promise<TimelineData>;
  
  // 分析
  checkScheduleConflicts(blueprintId: string): Promise<ScheduleConflict[]>;
  calculateCriticalPath(blueprintId: string): Promise<CriticalPath>;
  estimateProjectCompletion(blueprintId: string): Promise<ProjectEstimate>;
  
  // 即時訂閱
  watchScheduleChanges(blueprintId: string): Observable<ScheduleChange>;
}

export interface TaskScheduleInput {
  plannedStartDate: Date;
  plannedEndDate: Date;
  actualStartDate?: Date;
  actualEndDate?: Date;
  estimatedDuration?: number; // 小時
  dependencies?: TaskDependency[];
  milestoneId?: string;
}

export interface TaskSchedule {
  taskId: string;
  taskTitle: string;
  plannedStartDate: Date;
  plannedEndDate: Date;
  actualStartDate?: Date;
  actualEndDate?: Date;
  plannedDuration: number; // 小時
  actualDuration?: number;
  variance?: number; // 偏差天數
  status: 'not_started' | 'on_schedule' | 'delayed' | 'ahead' | 'completed';
  dependencies: TaskDependency[];
  milestoneId?: string;
}

export interface TaskDependency {
  taskId: string;
  taskTitle: string;
  type: 'finish_to_start' | 'start_to_start' | 'finish_to_finish' | 'start_to_finish';
  lagDays?: number;
}

export interface Milestone {
  id: string;
  blueprintId: string;
  name: string;
  description?: string;
  targetDate: Date;
  actualDate?: Date;
  status: 'pending' | 'achieved' | 'missed' | 'cancelled';
  linkedTaskIds: string[];
  createdBy: string;
  createdAt: Date;
}

export interface CreateMilestoneInput {
  blueprintId: string;
  name: string;
  description?: string;
  targetDate: Date;
  linkedTaskIds?: string[];
  createdBy: string;
}

export interface GanttOptions {
  startDate?: Date;
  endDate?: Date;
  includeCompleted?: boolean;
  groupBy?: 'category' | 'assignee' | 'status';
}

export interface GanttData {
  tasks: GanttTask[];
  milestones: GanttMilestone[];
  dateRange: DateRange;
  totalDays: number;
}

export interface GanttTask {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  progress: number;
  status: string;
  assignee?: string;
  category?: string;
  dependencies: string[];
  parentId?: string;
  level: number;
  isExpanded?: boolean;
  children?: GanttTask[];
}

export interface GanttMilestone {
  id: string;
  name: string;
  date: Date;
  status: string;
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface CalendarData {
  events: CalendarEvent[];
  milestones: CalendarMilestone[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  color: string;
  extendedProps: {
    taskId: string;
    status: string;
    progress: number;
    assignee?: string;
  };
}

export interface CalendarMilestone {
  id: string;
  title: string;
  date: Date;
  color: string;
}

export interface TimelineData {
  items: TimelineItem[];
  groups: TimelineGroup[];
}

export interface TimelineItem {
  id: string;
  group: string;
  title: string;
  start: Date;
  end: Date;
  progress: number;
  status: string;
}

export interface TimelineGroup {
  id: string;
  title: string;
  order: number;
}

export interface ScheduleConflict {
  type: 'overlap' | 'dependency_violation' | 'resource_overload';
  severity: 'warning' | 'error';
  taskIds: string[];
  description: string;
  suggestion?: string;
}

export interface CriticalPath {
  tasks: CriticalPathTask[];
  totalDuration: number;
  projectEndDate: Date;
  slack: number; // 總浮時
}

export interface CriticalPathTask {
  taskId: string;
  taskTitle: string;
  duration: number;
  earliestStart: Date;
  earliestFinish: Date;
  latestStart: Date;
  latestFinish: Date;
  slack: number;
  isCritical: boolean;
}

export interface ProjectEstimate {
  estimatedEndDate: Date;
  confidence: number; // 0-100%
  factors: EstimateFactor[];
  scenarios: ProjectScenario[];
}

export interface EstimateFactor {
  factor: string;
  impact: 'positive' | 'negative' | 'neutral';
  weight: number;
}

export interface ProjectScenario {
  name: 'optimistic' | 'likely' | 'pessimistic';
  endDate: Date;
  probability: number;
}

export interface ScheduleChange {
  type: 'task_scheduled' | 'task_rescheduled' | 'milestone_added' | 'milestone_updated';
  taskId?: string;
  milestoneId?: string;
  changedBy: string;
  timestamp: Date;
}
```

### 服務實作

```typescript
import { Injectable, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { TaskRepository } from '../repositories/task.repository';
import { IEventBus } from '@core/blueprint/platform/event-bus';
import { 
  ITaskScheduleService,
  TaskSchedule,
  TaskScheduleInput,
  Milestone,
  GanttData,
  GanttOptions,
  CalendarData,
  DateRange,
  ScheduleConflict,
  CriticalPath,
  ProjectEstimate
} from './task-schedule.interface';

@Injectable({ providedIn: 'root' })
export class TaskScheduleService implements ITaskScheduleService {
  private taskRepository = inject(TaskRepository);
  private eventBus = inject(IEventBus);

  // 里程碑快取
  private _milestones = signal<Map<string, Milestone[]>>(new Map());

  /**
   * 設定任務排程
   */
  async setSchedule(
    taskId: string, 
    schedule: TaskScheduleInput
  ): Promise<TaskSchedule> {
    const task = await this.taskRepository.findById(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    // 驗證日期
    if (schedule.plannedEndDate < schedule.plannedStartDate) {
      throw new Error('End date must be after start date');
    }

    // 更新任務
    await this.taskRepository.update(taskId, {
      plannedStartDate: schedule.plannedStartDate,
      plannedEndDate: schedule.plannedEndDate,
      actualStartDate: schedule.actualStartDate,
      actualEndDate: schedule.actualEndDate
    });

    // 計算排程資訊
    const plannedDuration = this.calculateDuration(
      schedule.plannedStartDate, 
      schedule.plannedEndDate
    );

    const taskSchedule: TaskSchedule = {
      taskId,
      taskTitle: task.title,
      plannedStartDate: schedule.plannedStartDate,
      plannedEndDate: schedule.plannedEndDate,
      actualStartDate: schedule.actualStartDate,
      actualEndDate: schedule.actualEndDate,
      plannedDuration,
      actualDuration: schedule.actualStartDate && schedule.actualEndDate
        ? this.calculateDuration(schedule.actualStartDate, schedule.actualEndDate)
        : undefined,
      variance: this.calculateVariance(schedule),
      status: this.calculateScheduleStatus(schedule, task.progress || 0),
      dependencies: schedule.dependencies || [],
      milestoneId: schedule.milestoneId
    };

    // 發送事件
    this.eventBus.emit('task.scheduled', {
      taskId,
      taskTitle: task.title,
      schedule: taskSchedule,
      timestamp: new Date()
    });

    return taskSchedule;
  }

  /**
   * 取得甘特圖資料
   */
  async getGanttData(
    blueprintId: string, 
    options?: GanttOptions
  ): Promise<GanttData> {
    let tasks = await this.taskRepository.findByBlueprint(blueprintId);

    // 篩選
    if (!options?.includeCompleted) {
      tasks = tasks.filter(t => t.status !== 'confirmed');
    }

    // 日期範圍
    const startDate = options?.startDate || this.getEarliestDate(tasks);
    const endDate = options?.endDate || this.getLatestDate(tasks);

    // 轉換為甘特圖格式
    const ganttTasks = this.buildGanttTasks(tasks, options?.groupBy);

    // 取得里程碑
    const milestones = await this.getMilestones(blueprintId);
    const ganttMilestones = milestones.map(m => ({
      id: m.id,
      name: m.name,
      date: m.targetDate,
      status: m.status
    }));

    const totalDays = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      tasks: ganttTasks,
      milestones: ganttMilestones,
      dateRange: { start: startDate, end: endDate },
      totalDays
    };
  }

  /**
   * 取得日曆資料
   */
  async getCalendarData(
    blueprintId: string, 
    dateRange: DateRange
  ): Promise<CalendarData> {
    const tasks = await this.taskRepository.findByBlueprint(blueprintId);

    // 篩選日期範圍內的任務
    const filteredTasks = tasks.filter(t => {
      if (!t.plannedStartDate || !t.plannedEndDate) return false;
      const start = new Date(t.plannedStartDate);
      const end = new Date(t.plannedEndDate);
      return start <= dateRange.end && end >= dateRange.start;
    });

    // 轉換為日曆事件
    const events = filteredTasks.map(t => ({
      id: t.id,
      title: t.title,
      start: new Date(t.plannedStartDate!),
      end: new Date(t.plannedEndDate!),
      allDay: true,
      color: this.getStatusColor(t.status),
      extendedProps: {
        taskId: t.id,
        status: t.status,
        progress: t.progress || 0,
        assignee: t.assignedTo
      }
    }));

    // 取得里程碑
    const milestones = await this.getMilestones(blueprintId);
    const calendarMilestones = milestones
      .filter(m => m.targetDate >= dateRange.start && m.targetDate <= dateRange.end)
      .map(m => ({
        id: m.id,
        title: `🎯 ${m.name}`,
        date: m.targetDate,
        color: this.getMilestoneColor(m.status)
      }));

    return {
      events,
      milestones: calendarMilestones
    };
  }

  /**
   * 建立里程碑
   */
  async createMilestone(data: CreateMilestoneInput): Promise<Milestone> {
    const milestone: Milestone = {
      id: `milestone-${Date.now()}`,
      blueprintId: data.blueprintId,
      name: data.name,
      description: data.description,
      targetDate: data.targetDate,
      status: 'pending',
      linkedTaskIds: data.linkedTaskIds || [],
      createdBy: data.createdBy,
      createdAt: new Date()
    };

    // 儲存里程碑
    // TODO: 儲存到 Firestore

    // 更新快取
    const cache = this._milestones();
    const blueprintMilestones = cache.get(data.blueprintId) || [];
    blueprintMilestones.push(milestone);
    cache.set(data.blueprintId, blueprintMilestones);
    this._milestones.set(new Map(cache));

    // 發送事件
    this.eventBus.emit('milestone.created', {
      milestoneId: milestone.id,
      blueprintId: data.blueprintId,
      name: milestone.name,
      targetDate: milestone.targetDate,
      timestamp: new Date()
    });

    return milestone;
  }

  /**
   * 取得里程碑
   */
  async getMilestones(blueprintId: string): Promise<Milestone[]> {
    const cache = this._milestones();
    return cache.get(blueprintId) || [];
  }

  /**
   * 檢查排程衝突
   */
  async checkScheduleConflicts(blueprintId: string): Promise<ScheduleConflict[]> {
    const tasks = await this.taskRepository.findByBlueprint(blueprintId);
    const conflicts: ScheduleConflict[] = [];

    // 檢查相同指派人的任務重疊
    const assigneeTasks = new Map<string, typeof tasks>();
    for (const task of tasks) {
      if (task.assignedTo && task.plannedStartDate && task.plannedEndDate) {
        const existing = assigneeTasks.get(task.assignedTo) || [];
        existing.push(task);
        assigneeTasks.set(task.assignedTo, existing);
      }
    }

    for (const [assignee, assignedTasks] of assigneeTasks) {
      for (let i = 0; i < assignedTasks.length; i++) {
        for (let j = i + 1; j < assignedTasks.length; j++) {
          const task1 = assignedTasks[i];
          const task2 = assignedTasks[j];
          
          if (this.datesOverlap(
            new Date(task1.plannedStartDate!),
            new Date(task1.plannedEndDate!),
            new Date(task2.plannedStartDate!),
            new Date(task2.plannedEndDate!)
          )) {
            conflicts.push({
              type: 'overlap',
              severity: 'warning',
              taskIds: [task1.id, task2.id],
              description: `任務 "${task1.title}" 與 "${task2.title}" 排程重疊`,
              suggestion: '建議調整其中一個任務的排程'
            });
          }
        }
      }
    }

    return conflicts;
  }

  /**
   * 估算專案完成時間
   */
  async estimateProjectCompletion(blueprintId: string): Promise<ProjectEstimate> {
    const tasks = await this.taskRepository.findByBlueprint(blueprintId);
    const incompleteTasks = tasks.filter(t => 
      !['confirmed', 'cancelled'].includes(t.status)
    );

    // 計算平均完成速度
    const completedTasks = tasks.filter(t => t.status === 'confirmed');
    const avgDaysPerTask = completedTasks.length > 0
      ? completedTasks.reduce((sum, t) => {
          if (t.actualStartDate && t.actualEndDate) {
            return sum + this.calculateDuration(
              new Date(t.actualStartDate), 
              new Date(t.actualEndDate)
            );
          }
          return sum;
        }, 0) / completedTasks.length
      : 5; // 預設 5 天

    const remainingDays = incompleteTasks.length * avgDaysPerTask;
    const today = new Date();
    
    const likelyEndDate = new Date(today);
    likelyEndDate.setDate(today.getDate() + remainingDays);

    const optimisticEndDate = new Date(today);
    optimisticEndDate.setDate(today.getDate() + remainingDays * 0.7);

    const pessimisticEndDate = new Date(today);
    pessimisticEndDate.setDate(today.getDate() + remainingDays * 1.5);

    return {
      estimatedEndDate: likelyEndDate,
      confidence: 70,
      factors: [
        {
          factor: '歷史完成速度',
          impact: avgDaysPerTask < 5 ? 'positive' : 'neutral',
          weight: 0.4
        },
        {
          factor: '剩餘任務數量',
          impact: incompleteTasks.length > 20 ? 'negative' : 'neutral',
          weight: 0.3
        }
      ],
      scenarios: [
        { name: 'optimistic', endDate: optimisticEndDate, probability: 0.2 },
        { name: 'likely', endDate: likelyEndDate, probability: 0.6 },
        { name: 'pessimistic', endDate: pessimisticEndDate, probability: 0.2 }
      ]
    };
  }

  // ============ Private Methods ============

  private calculateDuration(start: Date, end: Date): number {
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }

  private calculateVariance(schedule: TaskScheduleInput): number | undefined {
    if (!schedule.actualEndDate) return undefined;
    return this.calculateDuration(schedule.plannedEndDate, schedule.actualEndDate);
  }

  private calculateScheduleStatus(
    schedule: TaskScheduleInput, 
    progress: number
  ): TaskSchedule['status'] {
    if (progress === 100) return 'completed';
    if (!schedule.actualStartDate) return 'not_started';
    
    const today = new Date();
    const plannedEnd = new Date(schedule.plannedEndDate);
    
    if (today > plannedEnd && progress < 100) return 'delayed';
    
    // 簡單估算是否領先
    const totalDays = this.calculateDuration(schedule.plannedStartDate, schedule.plannedEndDate);
    const elapsedDays = this.calculateDuration(schedule.plannedStartDate, today);
    const expectedProgress = (elapsedDays / totalDays) * 100;
    
    if (progress > expectedProgress + 10) return 'ahead';
    if (progress < expectedProgress - 10) return 'delayed';
    
    return 'on_schedule';
  }

  private buildGanttTasks(tasks: any[], groupBy?: string): any[] {
    // 建立階層結構
    const taskMap = new Map(tasks.map(t => [t.id, { ...t, level: 0, children: [] }]));
    const rootTasks: any[] = [];

    for (const task of taskMap.values()) {
      if (task.parentTaskId && taskMap.has(task.parentTaskId)) {
        const parent = taskMap.get(task.parentTaskId);
        task.level = parent.level + 1;
        parent.children.push(task);
      } else {
        rootTasks.push(task);
      }
    }

    // 轉換為甘特圖格式
    return this.flattenGanttTasks(rootTasks);
  }

  private flattenGanttTasks(tasks: any[], result: any[] = []): any[] {
    for (const task of tasks) {
      result.push({
        id: task.id,
        title: task.title,
        startDate: task.plannedStartDate || new Date(),
        endDate: task.plannedEndDate || new Date(),
        progress: task.progress || 0,
        status: task.status,
        assignee: task.assignedTo,
        category: task.category,
        dependencies: [],
        parentId: task.parentTaskId,
        level: task.level,
        isExpanded: true
      });
      
      if (task.children?.length > 0) {
        this.flattenGanttTasks(task.children, result);
      }
    }
    return result;
  }

  private getEarliestDate(tasks: any[]): Date {
    const dates = tasks
      .filter(t => t.plannedStartDate)
      .map(t => new Date(t.plannedStartDate));
    return dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : new Date();
  }

  private getLatestDate(tasks: any[]): Date {
    const dates = tasks
      .filter(t => t.plannedEndDate)
      .map(t => new Date(t.plannedEndDate));
    return dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : new Date();
  }

  private datesOverlap(start1: Date, end1: Date, start2: Date, end2: Date): boolean {
    return start1 < end2 && start2 < end1;
  }

  private getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      draft: '#d9d9d9',
      pending: '#faad14',
      assigned: '#1890ff',
      in_progress: '#1890ff',
      submitted: '#722ed1',
      confirmed: '#52c41a',
      cancelled: '#ff4d4f'
    };
    return colors[status] || '#d9d9d9';
  }

  private getMilestoneColor(status: string): string {
    const colors: Record<string, string> = {
      pending: '#faad14',
      achieved: '#52c41a',
      missed: '#ff4d4f',
      cancelled: '#d9d9d9'
    };
    return colors[status] || '#faad14';
  }
}
```

---

## ✅ 交付物

- [ ] `task-schedule.service.ts` - 排程管理服務實作
- [ ] `task-schedule.interface.ts` - 介面定義
- [ ] `task-schedule.service.spec.ts` - 單元測試
- [ ] 更新 `index.ts` 匯出

---

## 🎯 驗收標準

1. ✅ 任務排程設定正確
2. ✅ 甘特圖資料格式正確
3. ✅ 日曆視圖資料正確
4. ✅ 里程碑管理功能完整
5. ✅ 排程衝突檢測正確
6. ✅ 單元測試覆蓋率 >80%

---

**文件版本**: 1.0.0  
**建立日期**: 2025-12-15  
**最後更新**: 2025-12-15
