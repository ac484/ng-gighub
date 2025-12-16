# SETC-050: Task Progress Tracking Service

> **任務編號**: SETC-050  
> **模組**: Task Module (任務模組)  
> **優先級**: P1 (Important)  
> **預估工時**: 2 天  
> **依賴**: SETC-048  
> **狀態**: 📋 待開始

---

## 📋 任務概述

### 目標
實作任務進度追蹤服務，支援手動更新進度、基於子任務自動計算進度、進度歷史記錄，並提供進度預警機制。

### 範圍
- 手動進度更新
- 子任務進度自動彙整
- 進度歷史記錄
- 進度預警與通知
- 進度報表與分析

---

## 🏗️ 技術實作

### 服務介面定義

```typescript
import { Observable } from 'rxjs';

export interface ITaskProgressService {
  // 進度更新
  updateProgress(
    taskId: string, 
    progress: number, 
    updatedBy: string,
    notes?: string
  ): Promise<ProgressUpdate>;
  
  // 自動計算
  recalculateProgress(taskId: string): Promise<number>;
  recalculateBlueprintProgress(blueprintId: string): Promise<BlueprintProgress>;
  
  // 查詢
  getProgressHistory(taskId: string): Promise<ProgressHistory[]>;
  watchProgress(taskId: string): Observable<number>;
  
  // 預警
  getOverdueTasks(blueprintId: string): Promise<OverdueTask[]>;
  getAtRiskTasks(blueprintId: string, thresholdDays: number): Promise<AtRiskTask[]>;
  
  // 報表
  getProgressReport(blueprintId: string): Promise<ProgressReport>;
  getProgressTrend(blueprintId: string, days: number): Promise<ProgressTrend[]>;
}

export interface ProgressUpdate {
  id: string;
  taskId: string;
  previousProgress: number;
  newProgress: number;
  delta: number;
  updatedBy: string;
  updatedByName: string;
  notes?: string;
  updatedAt: Date;
}

export interface ProgressHistory {
  id: string;
  taskId: string;
  progress: number;
  updatedBy: string;
  updatedByName: string;
  notes?: string;
  recordedAt: Date;
}

export interface BlueprintProgress {
  blueprintId: string;
  totalTasks: number;
  completedTasks: number;
  overallProgress: number;
  byCategory: Record<string, CategoryProgress>;
  byStatus: Record<string, number>;
  calculatedAt: Date;
}

export interface CategoryProgress {
  category: string;
  totalTasks: number;
  completedTasks: number;
  progress: number;
}

export interface OverdueTask {
  taskId: string;
  taskTitle: string;
  assigneeName?: string;
  dueDate: Date;
  daysOverdue: number;
  progress: number;
}

export interface AtRiskTask {
  taskId: string;
  taskTitle: string;
  assigneeName?: string;
  dueDate: Date;
  daysUntilDue: number;
  progress: number;
  riskLevel: 'low' | 'medium' | 'high';
  estimatedDelay: number;
}

export interface ProgressReport {
  blueprintId: string;
  reportDate: Date;
  summary: BlueprintProgress;
  overdueTasks: OverdueTask[];
  atRiskTasks: AtRiskTask[];
  topPerformers: TaskPerformance[];
  recommendations: string[];
}

export interface ProgressTrend {
  date: Date;
  progress: number;
  completedTasks: number;
  newTasks: number;
}

export interface TaskPerformance {
  taskId: string;
  taskTitle: string;
  assigneeName: string;
  progressRate: number; // 進度變化率
  completionSpeed: number; // 完成速度評分
}
```

### 服務實作

```typescript
import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, interval, switchMap, startWith } from 'rxjs';
import { TaskRepository } from '../repositories/task.repository';
import { IEventBus } from '@core/blueprint/platform/event-bus';
import { 
  ITaskProgressService, 
  ProgressUpdate,
  ProgressHistory,
  BlueprintProgress,
  OverdueTask,
  AtRiskTask,
  ProgressReport,
  ProgressTrend
} from './task-progress.interface';

@Injectable({ providedIn: 'root' })
export class TaskProgressService implements ITaskProgressService {
  private taskRepository = inject(TaskRepository);
  private eventBus = inject(IEventBus);

  // 進度快取
  private _progressCache = signal<Map<string, number>>(new Map());

  /**
   * 更新任務進度
   */
  async updateProgress(
    taskId: string,
    progress: number,
    updatedBy: string,
    notes?: string
  ): Promise<ProgressUpdate> {
    // 驗證進度值
    if (progress < 0 || progress > 100) {
      throw new Error('Progress must be between 0 and 100');
    }

    // 取得任務
    const task = await this.taskRepository.findById(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    const previousProgress = task.progress || 0;
    const delta = progress - previousProgress;

    // 更新任務
    await this.taskRepository.update(taskId, {
      progress,
      updatedAt: new Date()
    });

    // 建立更新記錄
    const update: ProgressUpdate = {
      id: `progress-${Date.now()}`,
      taskId,
      previousProgress,
      newProgress: progress,
      delta,
      updatedBy,
      updatedByName: await this.getUserName(updatedBy),
      notes,
      updatedAt: new Date()
    };

    // 記錄歷史
    await this.recordProgressHistory(update);

    // 更新快取
    const cache = this._progressCache();
    cache.set(taskId, progress);
    this._progressCache.set(new Map(cache));

    // 發送事件
    this.eventBus.emit('task.progress_updated', {
      taskId,
      taskTitle: task.title,
      blueprintId: task.blueprintId,
      previousProgress,
      newProgress: progress,
      delta,
      updatedBy,
      timestamp: new Date()
    });

    // 如果進度達到 100%，可能需要提示提報完成
    if (progress === 100 && task.status === 'in_progress') {
      this.eventBus.emit('task.progress_complete', {
        taskId,
        taskTitle: task.title,
        assignedTo: task.assignedTo,
        timestamp: new Date()
      });
    }

    // 如果有父任務，重新計算父任務進度
    if (task.parentTaskId) {
      await this.recalculateProgress(task.parentTaskId);
    }

    return update;
  }

  /**
   * 重新計算任務進度（基於子任務）
   */
  async recalculateProgress(taskId: string): Promise<number> {
    const subtasks = await this.taskRepository.findSubtasks(taskId);
    
    if (subtasks.length === 0) {
      const task = await this.taskRepository.findById(taskId);
      return task?.progress || 0;
    }

    // 計算子任務加權平均進度
    const totalProgress = subtasks.reduce((sum, t) => sum + (t.progress || 0), 0);
    const averageProgress = Math.round(totalProgress / subtasks.length);

    // 更新父任務進度
    await this.taskRepository.update(taskId, {
      progress: averageProgress,
      updatedAt: new Date()
    });

    return averageProgress;
  }

  /**
   * 重新計算藍圖整體進度
   */
  async recalculateBlueprintProgress(blueprintId: string): Promise<BlueprintProgress> {
    const tasks = await this.taskRepository.findByBlueprint(blueprintId, {
      parentTaskId: null // 只計算頂層任務
    });

    const completedTasks = tasks.filter(t => t.status === 'confirmed');
    const totalProgress = tasks.reduce((sum, t) => sum + (t.progress || 0), 0);
    const overallProgress = tasks.length > 0 
      ? Math.round(totalProgress / tasks.length) 
      : 0;

    // 按分類統計
    const byCategory: Record<string, any> = {};
    const categories = [...new Set(tasks.map(t => t.category || 'other'))];
    
    for (const category of categories) {
      const categoryTasks = tasks.filter(t => (t.category || 'other') === category);
      const categoryCompleted = categoryTasks.filter(t => t.status === 'confirmed');
      const categoryProgress = categoryTasks.reduce((sum, t) => sum + (t.progress || 0), 0);
      
      byCategory[category] = {
        category,
        totalTasks: categoryTasks.length,
        completedTasks: categoryCompleted.length,
        progress: categoryTasks.length > 0 
          ? Math.round(categoryProgress / categoryTasks.length) 
          : 0
      };
    }

    // 按狀態統計
    const byStatus = tasks.reduce((acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      blueprintId,
      totalTasks: tasks.length,
      completedTasks: completedTasks.length,
      overallProgress,
      byCategory,
      byStatus,
      calculatedAt: new Date()
    };
  }

  /**
   * 取得逾期任務
   */
  async getOverdueTasks(blueprintId: string): Promise<OverdueTask[]> {
    const tasks = await this.taskRepository.findByBlueprint(blueprintId);
    const now = new Date();

    return tasks
      .filter(t => 
        t.plannedEndDate && 
        new Date(t.plannedEndDate) < now &&
        !['confirmed', 'cancelled'].includes(t.status)
      )
      .map(t => {
        const dueDate = new Date(t.plannedEndDate!);
        const daysOverdue = Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        
        return {
          taskId: t.id,
          taskTitle: t.title,
          assigneeName: t.assignedTo, // TODO: 轉換為名稱
          dueDate,
          daysOverdue,
          progress: t.progress || 0
        };
      })
      .sort((a, b) => b.daysOverdue - a.daysOverdue);
  }

  /**
   * 取得有風險的任務
   */
  async getAtRiskTasks(
    blueprintId: string, 
    thresholdDays: number = 7
  ): Promise<AtRiskTask[]> {
    const tasks = await this.taskRepository.findByBlueprint(blueprintId);
    const now = new Date();

    return tasks
      .filter(t => {
        if (!t.plannedEndDate) return false;
        if (['confirmed', 'cancelled'].includes(t.status)) return false;
        
        const dueDate = new Date(t.plannedEndDate);
        const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        return daysUntilDue > 0 && daysUntilDue <= thresholdDays;
      })
      .map(t => {
        const dueDate = new Date(t.plannedEndDate!);
        const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const progress = t.progress || 0;
        
        // 計算風險等級
        const expectedProgress = 100 - (daysUntilDue / thresholdDays * 100);
        const progressGap = expectedProgress - progress;
        
        let riskLevel: 'low' | 'medium' | 'high' = 'low';
        if (progressGap > 30) riskLevel = 'high';
        else if (progressGap > 15) riskLevel = 'medium';
        
        // 估計延遲天數
        const estimatedDelay = progressGap > 0 
          ? Math.ceil(progressGap / 10) // 假設每天可完成 10% 進度
          : 0;
        
        return {
          taskId: t.id,
          taskTitle: t.title,
          assigneeName: t.assignedTo,
          dueDate,
          daysUntilDue,
          progress,
          riskLevel,
          estimatedDelay
        };
      })
      .sort((a, b) => {
        const riskOrder = { high: 0, medium: 1, low: 2 };
        return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
      });
  }

  /**
   * 產生進度報表
   */
  async getProgressReport(blueprintId: string): Promise<ProgressReport> {
    const summary = await this.recalculateBlueprintProgress(blueprintId);
    const overdueTasks = await this.getOverdueTasks(blueprintId);
    const atRiskTasks = await this.getAtRiskTasks(blueprintId);

    // 產生建議
    const recommendations: string[] = [];
    
    if (overdueTasks.length > 0) {
      recommendations.push(`有 ${overdueTasks.length} 個任務逾期，請優先處理`);
    }
    
    const highRiskCount = atRiskTasks.filter(t => t.riskLevel === 'high').length;
    if (highRiskCount > 0) {
      recommendations.push(`有 ${highRiskCount} 個高風險任務，建議增派資源`);
    }
    
    if (summary.overallProgress < 50 && summary.totalTasks > 10) {
      recommendations.push('整體進度落後，建議檢視資源分配');
    }

    return {
      blueprintId,
      reportDate: new Date(),
      summary,
      overdueTasks,
      atRiskTasks,
      topPerformers: [], // TODO: 實作
      recommendations
    };
  }

  /**
   * 取得進度趨勢
   */
  async getProgressTrend(
    blueprintId: string, 
    days: number = 30
  ): Promise<ProgressTrend[]> {
    // TODO: 從歷史記錄計算趨勢
    const trends: ProgressTrend[] = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      trends.push({
        date,
        progress: Math.min(100, Math.round((days - i) / days * 100)), // 模擬數據
        completedTasks: Math.floor((days - i) / 3),
        newTasks: i % 7 === 0 ? 2 : 0
      });
    }

    return trends;
  }

  /**
   * 即時監聽進度
   */
  watchProgress(taskId: string): Observable<number> {
    return this.taskRepository.watchById(taskId).pipe(
      switchMap(async (task) => task?.progress || 0)
    );
  }

  // ============ Private Methods ============

  private async recordProgressHistory(update: ProgressUpdate): Promise<void> {
    // TODO: 儲存到 Firestore
    console.log('Recording progress history:', update);
  }

  private async getUserName(userId: string): Promise<string> {
    // TODO: 從 UserService 取得
    return `User ${userId}`;
  }
}
```

---

## 📊 進度視覺化元件

### 進度條元件

```typescript
import { Component, input, computed } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';

@Component({
  selector: 'app-task-progress-bar',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <div class="progress-container">
      <nz-progress 
        [nzPercent]="progress()" 
        [nzStatus]="progressStatus()"
        [nzStrokeColor]="strokeColor()"
        nzSize="small"
      />
      @if (showLabel()) {
        <span class="progress-label">{{ progress() }}%</span>
      }
    </div>
  `,
  styles: [`
    .progress-container {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .progress-label {
      min-width: 40px;
      text-align: right;
      font-size: 12px;
      color: rgba(0, 0, 0, 0.45);
    }
  `]
})
export class TaskProgressBarComponent {
  progress = input.required<number>();
  showLabel = input(true);
  
  progressStatus = computed(() => {
    const p = this.progress();
    if (p === 100) return 'success';
    if (p >= 80) return 'active';
    return 'normal';
  });
  
  strokeColor = computed(() => {
    const p = this.progress();
    if (p === 100) return '#52c41a';
    if (p >= 80) return '#1890ff';
    if (p >= 50) return '#faad14';
    return '#ff4d4f';
  });
}
```

---

## ✅ 交付物

- [ ] `task-progress.service.ts` - 進度追蹤服務實作
- [ ] `task-progress.interface.ts` - 介面定義
- [ ] `task-progress-bar.component.ts` - 進度條元件
- [ ] `task-progress.service.spec.ts` - 單元測試
- [ ] 更新 `index.ts` 匯出

---

## 🎯 驗收標準

1. ✅ 手動進度更新正確
2. ✅ 子任務進度自動彙整
3. ✅ 進度歷史完整記錄
4. ✅ 預警機制正常運作
5. ✅ 報表數據正確
6. ✅ 單元測試覆蓋率 >80%

---

**文件版本**: 1.0.0  
**建立日期**: 2025-12-15  
**最後更新**: 2025-12-15
