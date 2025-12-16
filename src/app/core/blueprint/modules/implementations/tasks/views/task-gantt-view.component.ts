/**
 * Task Gantt View Component
 * 任務甘特圖視圖元件
 *
 * Displays tasks in Gantt chart format with enhanced features:
 * - Multiple zoom levels (day/week/month)
 * - Task dependencies visualization
 * - Milestone markers
 * - Progress indicators
 *
 * @author GigHub Development Team
 * @date 2025-12-12
 */

import { CdkDrag, CdkDragEnd } from '@angular/cdk/drag-drop';
import { Component, input, computed, inject, signal, WritableSignal, DestroyRef } from '@angular/core';
import { GanttTask } from '@core/domain/types/task/task-view.types';
import { Task } from '@core/domain/types/task/task.types';
import { TaskStore } from '@core/state/stores/task.store';
import { SHARED_IMPORTS } from '@shared';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzMessageService } from 'ng-zorro-antd/message';

/** Zoom level enum */
enum ZoomLevel {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month'
}

@Component({
  selector: 'app-task-gantt-view',
  standalone: true,
  imports: [SHARED_IMPORTS, NzEmptyModule, CdkDrag],
  template: `
    <div class="gantt-container">
      @if (loading()) {
        <nz-spin nzSimple />
      } @else if (error()) {
        <nz-alert nzType="error" [nzMessage]="error()" nzShowIcon />
      } @else {
        <div class="gantt-header">
          <div class="header-row">
            <h3>甘特圖視圖</h3>
            <nz-space>
              <nz-radio-group *nzSpaceItem [(ngModel)]="zoomLevel" aria-label="選擇甘特圖時間視圖">
                <label nz-radio-button [nzValue]="'day'" aria-label="切換到日視圖顯示60天範圍">日視圖</label>
                <label nz-radio-button [nzValue]="'week'" aria-label="切換到週視圖顯示24週範圍">週視圖</label>
                <label nz-radio-button [nzValue]="'month'" aria-label="切換到月視圖顯示12個月範圍">月視圖</label>
              </nz-radio-group>
              <nz-tag *nzSpaceItem> 共 {{ ganttTasks().length }} 個任務 </nz-tag>
            </nz-space>
          </div>
        </div>

        @if (ganttTasks().length === 0) {
          <nz-empty nzNotFoundContent="暫無任務" nzNotFoundImage="simple" />
        } @else {
          <div class="gantt-chart">
            <div class="gantt-timeline">
              <div class="timeline-header">
                <div class="task-names-header">任務名稱</div>
                <div class="timeline-dates">
                  @for (period of timelinePeriods(); track period.label) {
                    <div class="date-cell" [style.flex]="period.flex || 1">
                      {{ period.label }}
                    </div>
                  }
                </div>
              </div>
            </div>

            <div class="gantt-tasks">
              @for (ganttTask of ganttTasks(); track ganttTask.id) {
                <div class="gantt-row" [class.milestone]="ganttTask.milestone" [class.no-dates]="ganttTask.hasNoDates">
                  <div class="task-name">
                    <div class="task-info">
                      @if (ganttTask.hasNoDates) {
                        <span nz-icon nzType="clock-circle" nzTheme="outline" class="no-dates-icon"></span>
                      } @else if (ganttTask.milestone) {
                        <span nz-icon nzType="flag" nzTheme="fill" class="milestone-icon"></span>
                      }
                      <span class="task-title">{{ ganttTask.name }}</span>
                      <nz-tag [nzColor]="getPriorityColor(ganttTask)" nzSize="small"> {{ ganttTask.progress }}% </nz-tag>
                    </div>
                  </div>
                  <div class="task-timeline">
                    @if (ganttTask.hasNoDates) {
                      <!-- Special display for tasks without dates -->
                      <div class="task-bar-no-dates" [title]="'未設定日期 - ' + ganttTask.name">
                        <span class="no-dates-label">
                          <span nz-icon nzType="clock-circle" nzTheme="outline"></span>
                          未設定日期
                        </span>
                      </div>
                    } @else {
                      <!-- Dependencies lines -->
                      @for (depId of ganttTask.dependencies || []; track depId) {
                        <div
                          class="dependency-line"
                          [style.left.%]="getDependencyLinePosition(ganttTask, depId)"
                          [style.width.%]="getDependencyLineWidth(ganttTask, depId)"
                        >
                        </div>
                      }

                      <!-- Task bar -->
                      @if (ganttTask.milestone) {
                        <div
                          class="milestone-marker"
                          [style.left.%]="getTaskPosition(ganttTask)"
                          [title]="ganttTask.name"
                          [attr.aria-label]="'里程碑: ' + ganttTask.name"
                          role="img"
                        >
                          <span nz-icon nzType="flag" nzTheme="fill"></span>
                        </div>
                      } @else {
                        <div
                          cdkDrag
                          cdkDragLockAxis="x"
                          cdkDragBoundary=".task-timeline"
                          (cdkDragEnded)="onTaskDragEnd($event, ganttTask)"
                          class="task-bar"
                          [class.has-dependencies]="ganttTask.dependencies && ganttTask.dependencies.length > 0"
                          [class.dragging]="isDragging()"
                          [style.left.%]="getTaskPosition(ganttTask)"
                          [style.width.%]="getTaskWidth(ganttTask)"
                          [title]="getTaskTooltip(ganttTask)"
                          [attr.aria-label]="'可拖曳調整任務時間: ' + ganttTask.name"
                        >
                          <div class="task-bar-progress" [style.width.%]="ganttTask.progress"></div>
                          <span class="task-bar-label">
                            @if (zoomLevel === 'day') {
                              {{ ganttTask.start | date: 'M/d' }} - {{ ganttTask.end | date: 'M/d' }}
                            } @else if (zoomLevel === 'week') {
                              {{ ganttTask.start | date: 'M/d' }}
                            } @else {
                              {{ getDurationDays(ganttTask) }}d
                            }
                          </span>
                        </div>
                      }
                    }
                  </div>
                </div>
              }
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [
    `
      .gantt-container {
        height: 100%;
        overflow: auto;
        padding: 16px;
      }

      .gantt-header {
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 1px solid;
      }

      .header-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .gantt-header h3 {
        margin: 0;
      }

      .gantt-chart {
        border-radius: 4px;
        overflow: hidden;
      }

      .gantt-timeline {
        border-bottom: 2px solid;
      }

      .timeline-header {
        display: flex;
      }

      .task-names-header {
        width: 200px;
        padding: 12px;
        font-weight: 600;
        border-right: 1px solid;
      }

      .timeline-dates {
        flex: 1;
        display: flex;
      }

      .date-cell {
        flex: 1;
        padding: 12px 4px;
        text-align: center;
        border-right: 1px solid;
        font-size: 11px;
        font-weight: 500;
      }

      .gantt-tasks {
        max-height: 600px;
        overflow-y: auto;
      }

      .gantt-row {
        display: flex;
        border-bottom: 1px solid;
        min-height: 40px;
      }

      .gantt-row.no-dates {
        border-left: 3px solid;
      }

      .task-name {
        width: 200px;
        padding: 8px 12px;
        border-right: 1px solid;
        display: flex;
        align-items: center;
      }

      .task-info {
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
      }

      .task-title {
        flex: 1;
        font-size: 13px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .task-bar-no-dates {
        position: relative;
        height: 24px;
        border: 2px dashed;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
        padding: 0 12px;
        width: fit-content;
        min-width: 120px;
        cursor: help;
      }

      .no-dates-label {
        display: flex;
        align-items: center;
        gap: 4px;
        white-space: nowrap;
      }

      .no-dates-label [nz-icon] {
        font-size: 12px;
      }

      .task-timeline {
        flex: 1;
        position: relative;
        padding: 8px 4px;
      }

      .task-bar {
        position: absolute;
        height: 24px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        font-weight: 500;
        overflow: hidden;
        cursor: move;
        transition: all 0.2s;
        user-select: none;
      }

      .task-bar.dragging {
        opacity: 0.8;
        cursor: grabbing;
        z-index: 1000;
      }

      .task-bar:not(.dragging):hover {
        transform: translateY(-2px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      }

      .task-bar.has-dependencies {
        border: 2px solid;
      }

      .task-bar-progress {
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        border-right: 2px solid;
      }

      .task-bar-label {
        position: relative;
        z-index: 1;
        padding: 0 8px;
      }

      .milestone-marker {
        position: absolute;
        top: 50%;
        transform: translate(-50%, -50%);
        font-size: 20px;
        cursor: pointer;
        z-index: 10;
      }

      .milestone-marker:hover {
        transform: translate(-50%, -50%) scale(1.2);
      }

      .dependency-line {
        position: absolute;
        top: 50%;
        height: 2px;
        opacity: 0.5;
        z-index: 1;
      }

      .dependency-line::after {
        content: '';
        position: absolute;
        right: 0;
        top: -3px;
        width: 0;
        height: 0;
        border-left: 6px solid;
        border-top: 4px solid transparent;
        border-bottom: 4px solid transparent;
      }
    `
  ]
})
export class TaskGanttViewComponent {
  private taskStore = inject(TaskStore);
  private message = inject(NzMessageService);
  private destroyRef = inject(DestroyRef);

  // Inputs
  blueprintId = input.required<string>();

  // Dragging state
  private _isDragging = signal(false);
  readonly isDragging = this._isDragging.asReadonly();

  // Zoom level - using writable signal
  private _zoomLevel: WritableSignal<ZoomLevel> = signal(ZoomLevel.MONTH);

  // Getter/setter for ngModel compatibility
  get zoomLevel(): ZoomLevel {
    return this._zoomLevel();
  }

  set zoomLevel(value: ZoomLevel) {
    this._zoomLevel.set(value);
  }

  // Expose store state
  readonly loading = this.taskStore.loading;
  readonly error = this.taskStore.error;

  // Timeline periods based on zoom level
  readonly timelinePeriods = computed(() => {
    const zoom = this._zoomLevel();
    const today = new Date();
    const periods: Array<{ label: string; flex?: number }> = [];

    switch (zoom) {
      case ZoomLevel.DAY:
        // Show 60 days (2 months)
        for (let i = -15; i < 45; i++) {
          const date = new Date(today);
          date.setDate(today.getDate() + i);
          periods.push({
            label: date.toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' })
          });
        }
        break;

      case ZoomLevel.WEEK:
        // Show 24 weeks (6 months)
        for (let i = -8; i < 16; i++) {
          const date = new Date(today);
          date.setDate(today.getDate() + i * 7);
          periods.push({ label: `W${this.getWeekNumber(date)}` });
        }
        break;

      case ZoomLevel.MONTH:
        // Show 12 months (1 year)
        for (let i = -3; i < 9; i++) {
          const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
          periods.push({
            label: date.toLocaleDateString('zh-TW', { year: 'numeric', month: 'short' })
          });
        }
        break;
    }

    return periods;
  });

  // Convert tasks to gantt format
  readonly ganttTasks = computed(() => {
    const tasks = this.taskStore.tasks();

    return tasks.map(task => {
      const hasStartDate = !!task.startDate;
      const hasDueDate = !!task.dueDate;
      const hasDates = hasStartDate || hasDueDate;

      // Use actual dates or defaults for tasks without dates
      const start = hasStartDate ? new Date(task.startDate!) : new Date();
      const end = hasDueDate ? new Date(task.dueDate!) : hasStartDate ? new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000) : new Date();

      // Milestone: same start/end date or explicitly marked
      const isMilestone = hasDates && (task.metadata?.['milestone'] === true || start.getTime() === end.getTime());

      return {
        id: task.id!,
        name: task.title,
        start,
        end,
        progress: task.progress ?? 0,
        dependencies: task.dependencies || [],
        milestone: isMilestone,
        hasNoDates: !hasDates,
        task
      };
    });
  });

  // Task lookup map for better performance (O(1) lookup instead of O(n))
  readonly ganttTaskMap = computed(() => {
    const map = new Map<string, GanttTask & { task: Task }>();
    this.ganttTasks().forEach(task => map.set(task.id, task));
    return map;
  });

  // Timeline start and end dates based on zoom
  private timelineStart = computed(() => {
    const today = new Date();
    const zoom = this._zoomLevel();
    const start = new Date(today);

    switch (zoom) {
      case ZoomLevel.DAY:
        start.setDate(today.getDate() - 15);
        break;
      case ZoomLevel.WEEK:
        start.setDate(today.getDate() - 56); // 8 weeks
        break;
      case ZoomLevel.MONTH:
        return new Date(today.getFullYear(), today.getMonth() - 3, 1);
    }

    return start;
  });

  private timelineEnd = computed(() => {
    const today = new Date();
    const zoom = this._zoomLevel();
    const end = new Date(today);

    switch (zoom) {
      case ZoomLevel.DAY:
        end.setDate(today.getDate() + 45);
        break;
      case ZoomLevel.WEEK:
        end.setDate(today.getDate() + 112); // 16 weeks
        break;
      case ZoomLevel.MONTH:
        return new Date(today.getFullYear(), today.getMonth() + 9, 0);
    }

    return end;
  });

  /**
   * Calculate task position on timeline (left offset %)
   */
  getTaskPosition(ganttTask: GanttTask): number {
    const start = this.timelineStart().getTime();
    const end = this.timelineEnd().getTime();
    const taskStart = ganttTask.start.getTime();

    const position = ((taskStart - start) / (end - start)) * 100;
    return Math.max(0, Math.min(100, position));
  }

  /**
   * Calculate task width on timeline (%)
   */
  getTaskWidth(ganttTask: GanttTask): number {
    if (ganttTask.milestone) {
      return 0; // Milestones have no width
    }

    const start = this.timelineStart().getTime();
    const end = this.timelineEnd().getTime();
    const taskStart = ganttTask.start.getTime();
    const taskEnd = ganttTask.end.getTime();

    const width = ((taskEnd - taskStart) / (end - start)) * 100;
    return Math.max(1, Math.min(100, width));
  }

  /**
   * Get dependency line position (using task map for O(1) lookup)
   */
  getDependencyLinePosition(task: GanttTask, depId: string): number {
    const depTask = this.ganttTaskMap().get(depId);
    if (!depTask) return 0;

    return this.getTaskPosition(depTask);
  }

  /**
   * Get dependency line width (using task map for O(1) lookup)
   */
  getDependencyLineWidth(task: GanttTask, depId: string): number {
    const depTask = this.ganttTaskMap().get(depId);
    if (!depTask) return 0;

    const depEnd = this.getTaskPosition(depTask) + this.getTaskWidth(depTask);
    const taskStart = this.getTaskPosition(task);

    // Ensure non-negative width (handles invalid dependency order)
    return Math.max(0, taskStart - depEnd);
  }

  /**
   * Get task tooltip
   */
  getTaskTooltip(ganttTask: GanttTask): string {
    const duration = this.getDurationDays(ganttTask);
    return `${ganttTask.name}\n開始: ${ganttTask.start.toLocaleDateString('zh-TW')}\n結束: ${ganttTask.end.toLocaleDateString('zh-TW')}\n持續: ${duration} 天\n進度: ${ganttTask.progress}%`;
  }

  /**
   * Get duration in days
   */
  getDurationDays(ganttTask: GanttTask): number {
    const diff = ganttTask.end.getTime() - ganttTask.start.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  /**
   * Get week number
   */
  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }

  /**
   * Get priority color (currently returns default, can be customized via theme)
   */
  getPriorityColor(ganttTask: GanttTask & { task?: Task }): string {
    // Currently returns default color
    // Can be extended to check ganttTask.task.priority if needed
    return 'default';
  }

  /**
   * Handle task drag end - calculate new dates and update task
   * Following Occam's Razor: Simple pixel-to-date calculation
   */
  async onTaskDragEnd(event: CdkDragEnd, ganttTask: GanttTask & { task: Task }): Promise<void> {
    this._isDragging.set(false);

    // Get drag distance in pixels
    const dragDistance = event.distance.x;

    // Get timeline container width
    const timelineElement = event.source.element.nativeElement.closest('.task-timeline');
    if (!timelineElement) return;

    const timelineWidth = timelineElement.clientWidth;
    if (timelineWidth === 0) return;

    // Calculate percentage moved
    const percentageMoved = (dragDistance / timelineWidth) * 100;

    // Calculate time range
    const start = this.timelineStart().getTime();
    const end = this.timelineEnd().getTime();
    const totalDuration = end - start;

    // Calculate new start date
    const timeOffset = (totalDuration * percentageMoved) / 100;
    const currentStart = ganttTask.start.getTime();
    const newStartTime = currentStart + timeOffset;

    // Calculate task duration to maintain it
    const taskDuration = ganttTask.end.getTime() - ganttTask.start.getTime();
    const newEndTime = newStartTime + taskDuration;

    // Create new dates
    const newStartDate = new Date(newStartTime);
    const newEndDate = new Date(newEndTime);

    // Boundary checking: Ensure dates are within timeline range
    const timelineStartTime = this.timelineStart().getTime();
    const timelineEndTime = this.timelineEnd().getTime();

    if (newStartTime < timelineStartTime || newEndTime > timelineEndTime) {
      this.message.warning('任務日期超出時間軸範圍，請調整視圖範圍或手動編輯');
      // Reset position
      event.source._dragRef.reset();
      return;
    }

    // Minimum duration check (1 day)
    const minDuration = 24 * 60 * 60 * 1000; // 1 day in milliseconds
    if (taskDuration < minDuration) {
      this.message.warning('任務持續時間至少需要 1 天');
      event.source._dragRef.reset();
      return;
    }

    try {
      // Update task in store
      await this.taskStore.updateTask(
        this.blueprintId(),
        ganttTask.id,
        {
          startDate: newStartDate,
          dueDate: newEndDate
        },
        ganttTask.task.creatorId // Use current user as actor
      );

      this.message.success(`已更新任務時間：${newStartDate.toLocaleDateString('zh-TW')} - ${newEndDate.toLocaleDateString('zh-TW')}`);
    } catch (error) {
      console.error('Failed to update task dates:', error);
      this.message.error('更新任務時間失敗');
      // Reset position on error
      event.source._dragRef.reset();
    }
  }
}
