/**
 * Task Timeline View Component
 * 任務時間線視圖元件
 *
 * Displays tasks in chronological timeline format
 *
 * @author GigHub Development Team
 * @date 2025-12-12
 */

import { Component, input, computed, inject } from '@angular/core';
import { TaskStore } from '@core/state/stores/task.store';
import { SHARED_IMPORTS } from '@shared';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzTimelineModule } from 'ng-zorro-antd/timeline';

@Component({
  selector: 'app-task-timeline-view',
  standalone: true,
  imports: [SHARED_IMPORTS, NzTimelineModule, NzEmptyModule],
  template: `
    <div class="timeline-container">
      @if (loading()) {
        <nz-spin nzSimple />
      } @else if (error()) {
        <nz-alert nzType="error" [nzMessage]="error()" nzShowIcon />
      } @else {
        <nz-timeline [nzMode]="'left'">
          @for (item of timelineItems(); track item.id) {
            <nz-timeline-item [nzColor]="item.color" [nzLabel]="(item.date | date: 'yyyy-MM-dd') || ''">
              <div class="timeline-content">
                <div class="timeline-header">
                  <h4>{{ item.title }}</h4>
                  <nz-tag [nzColor]="getStatusColor(item.task.status)">
                    {{ getStatusText(item.task.status) }}
                  </nz-tag>
                </div>

                @if (item.description) {
                  <p class="timeline-description">{{ item.description }}</p>
                }

                <div class="timeline-meta">
                  @if (item.task.assigneeName) {
                    <span>
                      <span nz-icon nzType="user" nzTheme="outline"></span>
                      {{ item.task.assigneeName }}
                    </span>
                  }
                  @if (item.task.priority) {
                    <nz-tag [nzColor]="getPriorityColor(item.task.priority)">
                      {{ getPriorityText(item.task.priority) }}
                    </nz-tag>
                  }
                  @if (item.task.progress !== undefined) {
                    <span class="progress-info"> 進度: {{ item.task.progress }}% </span>
                  }
                </div>
              </div>
            </nz-timeline-item>
          }
        </nz-timeline>

        @if (timelineItems().length === 0) {
          <nz-empty nzNotFoundContent="暫無任務" />
        }
      }
    </div>
  `,
  styles: [
    `
      .timeline-container {
        padding: 24px;
        height: 100%;
        overflow-y: auto;
      }

      .timeline-content {
        padding: 12px;
        border-radius: 4px;
      }

      .timeline-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }

      .timeline-header h4 {
        margin: 0;
        font-size: 16px;
        font-weight: 500;
      }

      .timeline-description {
        margin: 8px 0;
        font-size: 14px;
      }

      .timeline-meta {
        display: flex;
        gap: 16px;
        align-items: center;
        font-size: 13px;
        margin-top: 8px;
      }

      .timeline-meta span {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .progress-info {
        font-weight: 500;
      }
    `
  ]
})
export class TaskTimelineViewComponent {
  private taskStore = inject(TaskStore);

  // Inputs
  blueprintId = input.required<string>();

  // Expose store state
  readonly loading = this.taskStore.loading;
  readonly error = this.taskStore.error;

  // Convert tasks to timeline items
  readonly timelineItems = computed(() => {
    const tasks = this.taskStore.tasks();

    // Sort by creation date (newest first)
    const sortedTasks = [...tasks].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return sortedTasks.map(task => ({
      id: task.id!,
      date: new Date(task.createdAt),
      title: task.title,
      description: task.description,
      color: this.getStatusColor(task.status),
      task
    }));
  });

  /**
   * Get status color
   */
  getStatusColor(status: string): string {
    const colorMap: Record<string, string> = {
      pending: 'gray',
      in_progress: 'blue',
      on_hold: 'orange',
      completed: 'green',
      cancelled: 'red'
    };
    return colorMap[status] || 'gray';
  }

  /**
   * Get status text
   */
  getStatusText(status: string): string {
    const textMap: Record<string, string> = {
      pending: '待處理',
      in_progress: '進行中',
      on_hold: '暫停',
      completed: '已完成',
      cancelled: '已取消'
    };
    return textMap[status] || status;
  }

  /**
   * Get priority color
   */
  getPriorityColor(priority: string): string {
    const colorMap: Record<string, string> = {
      critical: 'red',
      high: 'orange',
      medium: 'blue',
      low: 'default'
    };
    return colorMap[priority] || 'default';
  }

  /**
   * Get priority text
   */
  getPriorityText(priority: string): string {
    const textMap: Record<string, string> = {
      critical: '緊急',
      high: '高',
      medium: '中',
      low: '低'
    };
    return textMap[priority] || priority;
  }
}
