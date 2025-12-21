# SETC-048: Task Assignment Service

> **任務編號**: SETC-048  
> **模組**: Task Module (任務模組)  
> **優先級**: P1 (Important)  
> **預估工時**: 2 天  
> **依賴**: SETC-047  
> **狀態**: 📋 待開始

---

## 📋 任務概述

### 目標
實作任務指派服務，支援將任務指派給個人或團隊，記錄指派歷史，並整合事件通知機制。

### 範圍
- 任務指派給使用者
- 任務指派給團隊
- 指派變更與歷史記錄
- 工作負載分析
- 指派相關事件發送

---

## 🏗️ 技術實作

### 服務介面定義

```typescript
import { Observable } from 'rxjs';

export interface ITaskAssignmentService {
  // 指派操作
  assignToUser(taskId: string, userId: string, assignedBy: string): Promise<TaskAssignment>;
  assignToTeam(taskId: string, teamId: string, assignedBy: string): Promise<TaskAssignment>;
  reassign(taskId: string, newAssigneeId: string, assignedBy: string, reason?: string): Promise<TaskAssignment>;
  unassign(taskId: string, unassignedBy: string, reason?: string): Promise<void>;
  
  // 批次指派
  assignBatch(assignments: BatchAssignmentRequest[]): Promise<TaskAssignment[]>;
  
  // 查詢
  getAssignmentHistory(taskId: string): Promise<TaskAssignmentHistory[]>;
  getTasksByAssignee(userId: string, blueprintId?: string): Observable<Task[]>;
  getTasksByTeam(teamId: string, blueprintId?: string): Observable<Task[]>;
  
  // 工作負載
  getUserWorkload(userId: string): Promise<UserWorkload>;
  getTeamWorkload(teamId: string): Promise<TeamWorkload>;
  suggestAssignee(taskId: string): Promise<AssigneeSuggestion[]>;
}

export interface TaskAssignment {
  id: string;
  taskId: string;
  assigneeId: string;
  assigneeType: 'user' | 'team';
  assigneeName: string;
  assignedBy: string;
  assignedByName: string;
  assignedAt: Date;
  unassignedAt?: Date;
  reason?: string;
}

export interface TaskAssignmentHistory {
  id: string;
  taskId: string;
  action: 'assigned' | 'reassigned' | 'unassigned';
  previousAssignee?: string;
  newAssignee?: string;
  changedBy: string;
  changedAt: Date;
  reason?: string;
}

export interface BatchAssignmentRequest {
  taskId: string;
  assigneeId: string;
  assigneeType: 'user' | 'team';
}

export interface UserWorkload {
  userId: string;
  userName: string;
  totalTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  completedTasks: number;
  overdueTask: number;
  estimatedHours: number;
  utilizationRate: number; // 0-100%
}

export interface TeamWorkload {
  teamId: string;
  teamName: string;
  members: UserWorkload[];
  totalTasks: number;
  averageUtilization: number;
}

export interface AssigneeSuggestion {
  userId: string;
  userName: string;
  score: number; // 0-100
  reasons: string[];
  currentWorkload: number;
}
```

### 服務實作

```typescript
import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, from, map, switchMap } from 'rxjs';
import { TaskRepository } from '../repositories/task.repository';
import { IEventBus } from '@core/blueprint/platform/event-bus';
import { ITaskAssignmentService, TaskAssignment, UserWorkload } from './task-assignment.interface';

@Injectable({ providedIn: 'root' })
export class TaskAssignmentService implements ITaskAssignmentService {
  private taskRepository = inject(TaskRepository);
  private eventBus = inject(IEventBus);
  
  // 內部狀態
  private _assignmentHistory = signal<Map<string, TaskAssignmentHistory[]>>(new Map());

  /**
   * 指派任務給使用者
   */
  async assignToUser(
    taskId: string, 
    userId: string, 
    assignedBy: string
  ): Promise<TaskAssignment> {
    // 取得任務
    const task = await this.taskRepository.findById(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }
    
    // 取得使用者資訊 (從 UserService)
    const userName = await this.getUserName(userId);
    const assignedByName = await this.getUserName(assignedBy);
    
    // 記錄舊指派人
    const previousAssignee = task.assignedTo;
    
    // 更新任務
    await this.taskRepository.update(taskId, {
      assignedTo: userId,
      assignedTeam: undefined,
      assignedBy,
      assignedAt: new Date(),
      status: task.status === 'draft' || task.status === 'pending' 
        ? 'assigned' 
        : task.status
    });
    
    // 建立指派記錄
    const assignment: TaskAssignment = {
      id: `assign-${Date.now()}`,
      taskId,
      assigneeId: userId,
      assigneeType: 'user',
      assigneeName: userName,
      assignedBy,
      assignedByName,
      assignedAt: new Date()
    };
    
    // 記錄歷史
    await this.recordAssignmentHistory(taskId, {
      action: previousAssignee ? 'reassigned' : 'assigned',
      previousAssignee,
      newAssignee: userId,
      changedBy: assignedBy,
      changedAt: new Date()
    });
    
    // 發送事件
    this.eventBus.emit(previousAssignee ? 'task.reassigned' : 'task.assigned', {
      taskId,
      taskTitle: task.title,
      assigneeId: userId,
      assigneeName: userName,
      assignedBy,
      assignedByName,
      previousAssignee,
      timestamp: new Date()
    });
    
    return assignment;
  }

  /**
   * 指派任務給團隊
   */
  async assignToTeam(
    taskId: string, 
    teamId: string, 
    assignedBy: string
  ): Promise<TaskAssignment> {
    const task = await this.taskRepository.findById(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }
    
    const teamName = await this.getTeamName(teamId);
    const assignedByName = await this.getUserName(assignedBy);
    const previousAssignee = task.assignedTeam || task.assignedTo;
    
    await this.taskRepository.update(taskId, {
      assignedTeam: teamId,
      assignedTo: undefined,
      assignedBy,
      assignedAt: new Date(),
      status: task.status === 'draft' || task.status === 'pending' 
        ? 'assigned' 
        : task.status
    });
    
    const assignment: TaskAssignment = {
      id: `assign-${Date.now()}`,
      taskId,
      assigneeId: teamId,
      assigneeType: 'team',
      assigneeName: teamName,
      assignedBy,
      assignedByName,
      assignedAt: new Date()
    };
    
    await this.recordAssignmentHistory(taskId, {
      action: previousAssignee ? 'reassigned' : 'assigned',
      previousAssignee,
      newAssignee: teamId,
      changedBy: assignedBy,
      changedAt: new Date()
    });
    
    this.eventBus.emit('task.assigned', {
      taskId,
      taskTitle: task.title,
      assigneeId: teamId,
      assigneeType: 'team',
      assigneeName: teamName,
      assignedBy,
      timestamp: new Date()
    });
    
    return assignment;
  }

  /**
   * 重新指派任務
   */
  async reassign(
    taskId: string, 
    newAssigneeId: string, 
    assignedBy: string,
    reason?: string
  ): Promise<TaskAssignment> {
    const task = await this.taskRepository.findById(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }
    
    const previousAssignee = task.assignedTo || task.assignedTeam;
    const assignment = await this.assignToUser(taskId, newAssigneeId, assignedBy);
    
    // 更新歷史記錄的原因
    if (reason) {
      await this.updateAssignmentReason(taskId, reason);
    }
    
    return assignment;
  }

  /**
   * 取消指派
   */
  async unassign(
    taskId: string, 
    unassignedBy: string, 
    reason?: string
  ): Promise<void> {
    const task = await this.taskRepository.findById(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }
    
    const previousAssignee = task.assignedTo || task.assignedTeam;
    
    await this.taskRepository.update(taskId, {
      assignedTo: undefined,
      assignedTeam: undefined,
      status: 'pending'
    });
    
    await this.recordAssignmentHistory(taskId, {
      action: 'unassigned',
      previousAssignee,
      changedBy: unassignedBy,
      changedAt: new Date(),
      reason
    });
    
    this.eventBus.emit('task.unassigned', {
      taskId,
      taskTitle: task.title,
      previousAssignee,
      unassignedBy,
      reason,
      timestamp: new Date()
    });
  }

  /**
   * 取得使用者工作負載
   */
  async getUserWorkload(userId: string): Promise<UserWorkload> {
    const tasks = await this.taskRepository.findByAssignee(userId);
    const userName = await this.getUserName(userId);
    
    const inProgressTasks = tasks.filter(t => 
      ['assigned', 'in_progress'].includes(t.status)
    );
    const pendingTasks = tasks.filter(t => t.status === 'pending');
    const completedTasks = tasks.filter(t => t.status === 'confirmed');
    const overdueTasks = tasks.filter(t => 
      t.plannedEndDate && 
      new Date(t.plannedEndDate) < new Date() &&
      !['confirmed', 'cancelled'].includes(t.status)
    );
    
    // 估算工時 (假設每個任務 8 小時)
    const estimatedHours = inProgressTasks.length * 8 + pendingTasks.length * 8;
    
    // 計算使用率 (基於標準工作週 40 小時)
    const utilizationRate = Math.min(100, (estimatedHours / 40) * 100);
    
    return {
      userId,
      userName,
      totalTasks: tasks.length,
      inProgressTasks: inProgressTasks.length,
      pendingTasks: pendingTasks.length,
      completedTasks: completedTasks.length,
      overdueTask: overdueTasks.length,
      estimatedHours,
      utilizationRate: Math.round(utilizationRate)
    };
  }

  /**
   * 建議指派人選
   */
  async suggestAssignee(taskId: string): Promise<AssigneeSuggestion[]> {
    const task = await this.taskRepository.findById(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }
    
    // 取得藍圖成員
    const members = await this.getBlueprintMembers(task.blueprintId);
    
    const suggestions: AssigneeSuggestion[] = [];
    
    for (const member of members) {
      const workload = await this.getUserWorkload(member.userId);
      const score = this.calculateAssigneeScore(task, workload);
      
      suggestions.push({
        userId: member.userId,
        userName: member.userName,
        score,
        reasons: this.getAssignmentReasons(score, workload),
        currentWorkload: workload.utilizationRate
      });
    }
    
    // 按分數排序
    return suggestions.sort((a, b) => b.score - a.score);
  }

  // ============ Private Methods ============

  private calculateAssigneeScore(task: Task, workload: UserWorkload): number {
    let score = 100;
    
    // 工作負載扣分
    score -= workload.utilizationRate * 0.5;
    
    // 逾期任務扣分
    score -= workload.overdueTask * 10;
    
    // 確保分數在 0-100 之間
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private getAssignmentReasons(score: number, workload: UserWorkload): string[] {
    const reasons: string[] = [];
    
    if (workload.utilizationRate < 50) {
      reasons.push('工作負載較輕');
    }
    if (workload.overdueTask === 0) {
      reasons.push('無逾期任務');
    }
    if (workload.completedTasks > 5) {
      reasons.push('完成任務數量多');
    }
    
    return reasons;
  }

  private async recordAssignmentHistory(
    taskId: string, 
    record: Omit<TaskAssignmentHistory, 'id' | 'taskId'>
  ): Promise<void> {
    // TODO: 儲存到 Firestore
    const history = this._assignmentHistory();
    const taskHistory = history.get(taskId) || [];
    taskHistory.push({
      id: `history-${Date.now()}`,
      taskId,
      ...record
    });
    history.set(taskId, taskHistory);
    this._assignmentHistory.set(new Map(history));
  }

  private async getUserName(userId: string): Promise<string> {
    // TODO: 從 UserService 取得
    return `User ${userId}`;
  }

  private async getTeamName(teamId: string): Promise<string> {
    // TODO: 從 TeamService 取得
    return `Team ${teamId}`;
  }

  private async getBlueprintMembers(blueprintId: string): Promise<{ userId: string; userName: string }[]> {
    // TODO: 從 BlueprintService 取得
    return [];
  }

  private async updateAssignmentReason(taskId: string, reason: string): Promise<void> {
    const history = this._assignmentHistory();
    const taskHistory = history.get(taskId);
    if (taskHistory && taskHistory.length > 0) {
      taskHistory[taskHistory.length - 1].reason = reason;
      this._assignmentHistory.set(new Map(history));
    }
  }
}
```

---

## 🔄 事件整合

### 發送的事件

```typescript
// 任務指派事件
interface TaskAssignedEvent {
  taskId: string;
  taskTitle: string;
  assigneeId: string;
  assigneeType: 'user' | 'team';
  assigneeName: string;
  assignedBy: string;
  assignedByName: string;
  timestamp: Date;
}

// 任務重新指派事件
interface TaskReassignedEvent {
  taskId: string;
  taskTitle: string;
  previousAssignee: string;
  newAssignee: string;
  newAssigneeName: string;
  assignedBy: string;
  reason?: string;
  timestamp: Date;
}

// 任務取消指派事件
interface TaskUnassignedEvent {
  taskId: string;
  taskTitle: string;
  previousAssignee: string;
  unassignedBy: string;
  reason?: string;
  timestamp: Date;
}
```

---

## ✅ 交付物

- [ ] `task-assignment.service.ts` - 指派服務實作
- [ ] `task-assignment.interface.ts` - 介面定義
- [ ] `task-assignment.service.spec.ts` - 單元測試
- [ ] 更新 `index.ts` 匯出

---

## 🎯 驗收標準

1. ✅ 支援指派給個人和團隊
2. ✅ 記錄完整指派歷史
3. ✅ 工作負載計算正確
4. ✅ 指派建議功能運作
5. ✅ 事件正確發送
6. ✅ 單元測試覆蓋率 >80%

---

**文件版本**: 1.0.0  
**建立日期**: 2025-12-15  
**最後更新**: 2025-12-15
