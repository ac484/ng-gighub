import { Injectable, signal } from '@angular/core';

export type TaskViewId = 'tree-list' | 'tree' | 'gantt' | 'calendar' | 'timeline';

export interface TaskViewOption {
  id: TaskViewId;
  label: string;
  icon: string;
  description: string;
}

@Injectable({ providedIn: 'root' })
export class TaskViewStore {
  private readonly _currentView = signal<TaskViewId>('tree-list');
  private readonly _expandedNodes = signal<Set<string>>(new Set());

  currentView = this._currentView.asReadonly();
  expandedNodes = this._expandedNodes.asReadonly();

  switchView(view: TaskViewId): void {
    this._currentView.set(view);
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
}
