/**
 * Firestore Operations Component
 *
 * Calls functions-firestore Firebase Functions for CRUD operations
 * - createTask: Create new task
 * - updateTask: Update existing task
 * - deleteTask: Delete task
 * - listTasks: List tasks with filters
 *
 * @module ContractModule
 * @see functions-firestore README for API documentation
 */

import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { SHARED_IMPORTS } from '@shared';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';

import {
  CreateTaskRequest,
  UpdateTaskRequest,
  DeleteTaskRequest,
  ListTasksRequest,
  Task,
  FirestoreOperationResponse
} from './types/firebase-functions.types';

@Component({
  selector: 'app-firestore-operations',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS],
  template: `
    <nz-card nzTitle="Firestore 任務操作">
      <nz-space nzDirection="vertical" style="width: 100%;">
        <!-- Create Task Section -->
        <nz-card nzTitle="建立任務" nzSize="small">
          <nz-form-item>
            <nz-form-label>任務標題</nz-form-label>
            <nz-form-control>
              <input nz-input [(ngModel)]="newTask.title" placeholder="輸入任務標題" />
            </nz-form-control>
          </nz-form-item>

          <nz-form-item>
            <nz-form-label>描述</nz-form-label>
            <nz-form-control>
              <textarea nz-input rows="2" [(ngModel)]="newTask.description" placeholder="任務描述"></textarea>
            </nz-form-control>
          </nz-form-item>

          <nz-form-item>
            <nz-form-label>優先級</nz-form-label>
            <nz-form-control>
              <nz-select [(ngModel)]="newTask.priority" style="width: 100px;">
                <nz-option nzValue="low" nzLabel="低" />
                <nz-option nzValue="medium" nzLabel="中" />
                <nz-option nzValue="high" nzLabel="高" />
              </nz-select>
            </nz-form-control>
          </nz-form-item>

          <button nz-button nzType="primary" [nzLoading]="createLoading()" (click)="createTask()">
            <span nz-icon nzType="plus"></span>
            建立
          </button>
        </nz-card>

        <!-- List Tasks Section -->
        <nz-card nzTitle="任務列表" nzSize="small" [nzExtra]="extraTemplate">
          <ng-template #extraTemplate>
            <button nz-button nzSize="small" (click)="loadTasks()">
              <span nz-icon nzType="reload"></span>
              重新載入
            </button>
          </ng-template>

          @if (listLoading()) {
            <nz-spin nzSimple />
          } @else if (tasks().length > 0) {
            <nz-list [nzDataSource]="tasks()" nzBordered>
              <nz-list-item *ngFor="let task of tasks()">
                <nz-list-item-meta [nzTitle]="task.title" [nzDescription]="task.description || '無描述'">
                  <nz-list-item-meta-avatar>
                    <nz-tag [nzColor]="task.priority === 'high' ? 'red' : task.priority === 'medium' ? 'orange' : 'default'">
                      {{ task.priority }}
                    </nz-tag>
                  </nz-list-item-meta-avatar>
                </nz-list-item-meta>

                <nz-tag [nzColor]="task.status === 'completed' ? 'success' : task.status === 'in-progress' ? 'processing' : 'default'">
                  {{ task.status }}
                </nz-tag>

                <div class="list-actions">
                  <button nz-button nzType="link" nzSize="small" (click)="editTask(task)">
                    <span nz-icon nzType="edit"></span>
                  </button>
                  <button nz-button nzType="link" nzSize="small" nzDanger (click)="confirmDelete(task)">
                    <span nz-icon nzType="delete"></span>
                  </button>
                </div>
              </nz-list-item>
            </nz-list>
          } @else {
            <nz-empty nzNotFoundContent="暫無任務" />
          }
        </nz-card>
      </nz-space>

      <!-- Edit Modal -->
      <nz-modal
        [(nzVisible)]="editModalVisible()"
        nzTitle="編輯任務"
        (nzOnOk)="updateTask()"
        (nzOnCancel)="closeEditModal()"
        [nzOkLoading]="updateLoading()"
      >
        @if (editingTask()) {
          <nz-form-item>
            <nz-form-label>任務標題</nz-form-label>
            <nz-form-control>
              <input nz-input [(ngModel)]="editingTask()!.title" />
            </nz-form-control>
          </nz-form-item>

          <nz-form-item>
            <nz-form-label>描述</nz-form-label>
            <nz-form-control>
              <textarea nz-input rows="3" [(ngModel)]="editingTask()!.description"></textarea>
            </nz-form-control>
          </nz-form-item>

          <nz-form-item>
            <nz-form-label>優先級</nz-form-label>
            <nz-form-control>
              <nz-select [(ngModel)]="editingTask()!.priority" style="width: 100%;">
                <nz-option nzValue="low" nzLabel="低" />
                <nz-option nzValue="medium" nzLabel="中" />
                <nz-option nzValue="high" nzLabel="高" />
              </nz-select>
            </nz-form-control>
          </nz-form-item>

          <nz-form-item>
            <nz-form-label>狀態</nz-form-label>
            <nz-form-control>
              <nz-select [(ngModel)]="editingTask()!.status" style="width: 100%;">
                <nz-option nzValue="pending" nzLabel="待處理" />
                <nz-option nzValue="in-progress" nzLabel="進行中" />
                <nz-option nzValue="completed" nzLabel="已完成" />
              </nz-select>
            </nz-form-control>
          </nz-form-item>
        }
      </nz-modal>
    </nz-card>
  `,
  styles: [
    `
      .list-actions {
        display: flex;
        gap: 8px;
      }
    `
  ]
})
export class FirestoreOperationsComponent implements OnInit {
  private functions = inject(Functions);
  private message = inject(NzMessageService);
  private modal = inject(NzModalService);

  // State
  tasks = signal<Task[]>([]);
  createLoading = signal(false);
  listLoading = signal(false);
  updateLoading = signal(false);
  deleteLoading = signal(false);

  // Form data
  newTask: CreateTaskRequest = {
    title: '',
    description: '',
    priority: 'medium',
    status: 'pending'
  };

  // Edit modal
  editModalVisible = signal(false);
  editingTask = signal<Task | null>(null);

  ngOnInit(): void {
    this.loadTasks();
  }

  /**
   * Create new task
   */
  async createTask(): Promise<void> {
    if (!this.newTask.title) {
      this.message.warning('請輸入任務標題');
      return;
    }

    this.createLoading.set(true);

    try {
      const callable = httpsCallable<CreateTaskRequest, FirestoreOperationResponse<Task>>(this.functions, 'createTask');

      const response = await callable(this.newTask);

      if (response.data.success && response.data.data) {
        this.message.success('任務建立成功!');
        this.tasks.update(tasks => [response.data.data!, ...tasks]);

        // Reset form
        this.newTask = {
          title: '',
          description: '',
          priority: 'medium',
          status: 'pending'
        };
      } else {
        this.message.error(response.data.error?.message || '任務建立失敗');
      }
    } catch (error: any) {
      console.error('createTask error:', error);
      this.message.error(error.message || '呼叫函式失敗');
    } finally {
      this.createLoading.set(false);
    }
  }

  /**
   * Load tasks
   */
  async loadTasks(): Promise<void> {
    this.listLoading.set(true);

    try {
      const callable = httpsCallable<ListTasksRequest, FirestoreOperationResponse<Task[]>>(this.functions, 'listTasks');

      const response = await callable({
        limit: 50,
        orderBy: 'createdAt',
        orderDirection: 'desc'
      });

      if (response.data.success && response.data.data) {
        this.tasks.set(response.data.data);
      } else {
        this.message.error(response.data.error?.message || '載入任務失敗');
      }
    } catch (error: any) {
      console.error('listTasks error:', error);
      this.message.error(error.message || '呼叫函式失敗');
    } finally {
      this.listLoading.set(false);
    }
  }

  /**
   * Edit task
   */
  editTask(task: Task): void {
    this.editingTask.set({ ...task });
    this.editModalVisible.set(true);
  }

  /**
   * Close edit modal
   */
  closeEditModal(): void {
    this.editModalVisible.set(false);
    this.editingTask.set(null);
  }

  /**
   * Update task
   */
  async updateTask(): Promise<void> {
    const task = this.editingTask();
    if (!task) return;

    this.updateLoading.set(true);

    try {
      const callable = httpsCallable<UpdateTaskRequest, FirestoreOperationResponse>(this.functions, 'updateTask');

      const response = await callable({
        taskId: task.id,
        updates: {
          title: task.title,
          description: task.description,
          priority: task.priority,
          status: task.status
        }
      });

      if (response.data.success) {
        this.message.success('任務更新成功!');
        this.tasks.update(tasks => tasks.map(t => (t.id === task.id ? task : t)));
        this.closeEditModal();
      } else {
        this.message.error(response.data.error?.message || '任務更新失敗');
      }
    } catch (error: any) {
      console.error('updateTask error:', error);
      this.message.error(error.message || '呼叫函式失敗');
    } finally {
      this.updateLoading.set(false);
    }
  }

  /**
   * Confirm delete task
   */
  confirmDelete(task: Task): void {
    this.modal.confirm({
      nzTitle: '確認刪除',
      nzContent: `確定要刪除任務「${task.title}」嗎?`,
      nzOkText: '刪除',
      nzOkDanger: true,
      nzOnOk: () => this.deleteTask(task.id)
    });
  }

  /**
   * Delete task
   */
  async deleteTask(taskId: string): Promise<void> {
    this.deleteLoading.set(true);

    try {
      const callable = httpsCallable<DeleteTaskRequest, FirestoreOperationResponse>(this.functions, 'deleteTask');

      const response = await callable({
        taskId,
        hardDelete: false
      });

      if (response.data.success) {
        this.message.success('任務刪除成功!');
        this.tasks.update(tasks => tasks.filter(t => t.id !== taskId));
      } else {
        this.message.error(response.data.error?.message || '任務刪除失敗');
      }
    } catch (error: any) {
      console.error('deleteTask error:', error);
      this.message.error(error.message || '呼叫函式失敗');
    } finally {
      this.deleteLoading.set(false);
    }
  }
}
