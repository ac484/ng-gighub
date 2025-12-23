import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { NotificationPayload } from '../models';
import { NotificationRepository } from '../repositories';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NotificationStore {
  private readonly repository = inject(NotificationRepository);
  private readonly _notifications = signal<NotificationPayload[]>([]);
  private readonly _loading = signal(false);

  readonly notifications = this._notifications.asReadonly();
  readonly loading = this._loading.asReadonly();

  loadingValue(): boolean {
    return this._loading();
  }

  unreadCount(): number {
    return this._notifications().filter(n => !n.read).length;
  }

  unreadTodoCount(): number {
    return this.unreadCount();
  }

  todoNotifications(): NotificationPayload[] {
    return this._notifications();
  }

  groupedNotifications(): Array<{ title: string; list: NotificationPayload[]; emptyText: string }> {
    return [
      {
        title: '通知',
        list: this._notifications(),
        emptyText: '暫無通知'
      }
    ];
  }

  async loadNotifications(userId: string): Promise<void> {
    await this.load(userId);
  }

  async load(userId: string): Promise<void> {
    this._loading.set(true);
    try {
      const items = await firstValueFrom(this.repository.watchByUser(userId));
      this._notifications.set(items ?? []);
    } catch (error) {
      console.error('[NotificationStore] Failed to load notifications', error);
      this._notifications.set([]);
    } finally {
      this._loading.set(false);
    }
  }

  async clearByType(_userId: string, type: string): Promise<void> {
    this._notifications.update(list => list.filter(item => item.type !== type));
  }

  async markAsRead(id: string): Promise<void> {
    await this.repository.markAsRead(id);
    this._notifications.update(list => list.map(item => (item.id === id ? { ...item, read: true } : item)));
  }

  subscribeToRealtimeUpdates(_userId: string, _destroyRef?: DestroyRef): () => void {
    return () => {
      // no-op placeholder
    };
  }

  addNotification(payload: NotificationPayload): void {
    this._notifications.update(list => [...list, payload]);
  }
}
