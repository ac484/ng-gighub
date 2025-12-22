import { Injectable, signal } from '@angular/core';

import { TaskWithWBS } from '../data-access/models/task.model';

type TaskViewId = 'tree-list';

export interface TaskFilters {
  status?: string[];
  assigneeId?: string;
}

export interface TaskSortConfig {
  key: keyof TaskWithWBS;
  order: 'ascend' | 'descend';
}

@Injectable({ providedIn: 'root' })
export class TaskViewStore {
  private readonly _currentView = signal<TaskViewId>('tree-list');
  private readonly _expandedNodes = signal<Set<string>>(new Set());
  private readonly _filters = signal<TaskFilters>({});
  private readonly _sortConfig = signal<TaskSortConfig | null>(null);

  readonly currentView = this._currentView.asReadonly();
  readonly expandedNodes = this._expandedNodes.asReadonly();
  readonly filters = this._filters.asReadonly();
  readonly sortConfig = this._sortConfig.asReadonly();

  switchView(viewId: TaskViewId): void {
    this._currentView.set(viewId);
  }

  toggleNode(nodeId: string): void {
    this._expandedNodes.update(nodes => {
      const next = new Set(nodes);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }

  expandAll(nodeIds: string[]): void {
    this._expandedNodes.set(new Set(nodeIds));
  }

  collapseAll(): void {
    this._expandedNodes.set(new Set());
  }

  setFilters(filters: TaskFilters): void {
    this._filters.set(filters);
  }

  setSortConfig(config: TaskSortConfig | null): void {
    this._sortConfig.set(config);
  }
}
