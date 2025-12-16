import { Injectable, signal, computed, inject, DestroyRef } from '@angular/core';
import { Notification, NotificationGroup, NotificationType } from '@core/models/notification.model';
import { NotificationRepository } from '@core/repositories';
import { LoggerService } from '@core/services/logger/logger.service';
import { formatDistanceToNow } from 'date-fns';
import { NzI18nService } from 'ng-zorro-antd/i18n';

/**
 * Notification Store
 *
 * Manages notification state using Angular Signals
 * Following Occam's Razor: Simple, focused, maintainable
 */
@Injectable({
  providedIn: 'root'
})
export class NotificationStore {
  private readonly repository = inject(NotificationRepository);
  private readonly logger = inject(LoggerService);
  private readonly nzI18n = inject(NzI18nService);

  // Private state
  private _notifications = signal<Notification[]>([]);
  private _loading = signal(false);
  private _error = signal<string | null>(null);

  // Public readonly state
  readonly notifications = this._notifications.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  /**
   * Computed: Grouped notifications for ng-alain notice-icon
   */
  readonly groupedNotifications = computed((): NotificationGroup[] => {
    const groups: NotificationGroup[] = [
      {
        title: '通知',
        list: [],
        emptyText: '你已查看所有通知',
        emptyImage: 'https://gw.alipayobjects.com/zos/rmsportal/wAhyIChODzsoKIOBHcBk.svg',
        clearText: '清空通知'
      },
      {
        title: '消息',
        list: [],
        emptyText: '您已讀完所有消息',
        emptyImage: 'https://gw.alipayobjects.com/zos/rmsportal/sAuJeJzSKbUmHfBQRzmZ.svg',
        clearText: '清空消息'
      },
      {
        title: '待辦',
        list: [],
        emptyText: '你已完成所有待辦',
        emptyImage: 'https://gw.alipayobjects.com/zos/rmsportal/HsIsxMZiWKrNUavQUXqx.svg',
        clearText: '清空待辦'
      }
    ];

    this._notifications().forEach(notification => {
      const group = groups.find(g => g.title === notification.type);
      if (group) {
        // Format datetime for display
        const formattedNotification = {
          ...notification,
          datetime:
            typeof notification.datetime === 'string'
              ? formatDistanceToNow(new Date(notification.datetime), {
                  locale: this.nzI18n.getDateLocale()
                })
              : formatDistanceToNow(notification.datetime, {
                  locale: this.nzI18n.getDateLocale()
                })
        };
        group.list.push(formattedNotification as any);
      }
    });

    return groups;
  });

  /**
   * Computed: Unread notification count
   */
  readonly unreadCount = computed(() => this._notifications().filter(n => !n.read).length);

  /**
   * Computed: Todo notifications (for task.component)
   */
  readonly todoNotifications = computed(() => this._notifications().filter(n => n.type === NotificationType.TODO));

  /**
   * Computed: Unread todo count (for task.component badge)
   */
  readonly unreadTodoCount = computed(() => this.todoNotifications().filter(n => !n.read).length);

  /**
   * Load notifications for current user
   */
  async loadNotifications(userId: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const notifications = await this.repository.findAllByUser(userId);
      this._notifications.set(notifications);
      this.logger.info('[NotificationStore]', `Loaded ${notifications.length} notifications for user: ${userId}`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this._error.set(errorMsg);
      this.logger.error('[NotificationStore]', 'Failed to load notifications', error as Error);
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(id: string): Promise<void> {
    try {
      await this.repository.markAsRead(id);

      // Update local state
      this._notifications.update(notifications => notifications.map(n => (n.id === id ? { ...n, read: true } : n)));

      this.logger.info('[NotificationStore]', `Notification marked as read: ${id}`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this._error.set(errorMsg);
      this.logger.error('[NotificationStore]', 'Failed to mark notification as read', error as Error);
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string): Promise<void> {
    try {
      await this.repository.markAllAsRead(userId);

      // Update local state
      this._notifications.update(notifications => notifications.map(n => ({ ...n, read: true })));

      this.logger.info('[NotificationStore]', 'All notifications marked as read');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this._error.set(errorMsg);
      this.logger.error('[NotificationStore]', 'Failed to mark all as read', error as Error);
    }
  }

  /**
   * Clear notifications by type
   */
  async clearByType(userId: string, type: string): Promise<void> {
    try {
      await this.repository.deleteByType(userId, type);

      // Remove from local state
      this._notifications.update(notifications => notifications.filter(n => n.type !== type));

      this.logger.info('[NotificationStore]', `Cleared notifications of type: ${type}`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this._error.set(errorMsg);
      this.logger.error('[NotificationStore]', 'Failed to clear notifications', error as Error);
      throw error;
    }
  }

  /**
   * Subscribe to realtime updates
   */
  subscribeToRealtimeUpdates(userId: string, destroyRef: DestroyRef): () => void {
    const channel = this.repository.subscribeToChanges(userId, payload => {
      this.logger.info('[NotificationStore]', 'Realtime update received:', payload);
      // Reload notifications on any change
      this.loadNotifications(userId);
    });

    const cleanup = () => {
      if (channel) {
        channel();
        this.logger.info('[NotificationStore]', 'Realtime subscription cleaned up');
      }
    };

    // Auto-cleanup on component destroy
    destroyRef.onDestroy(cleanup);

    return cleanup;
  }

  /**
   * Clear error state
   */
  clearError(): void {
    this._error.set(null);
  }

  /**
   * Reset store
   */
  reset(): void {
    this._notifications.set([]);
    this._loading.set(false);
    this._error.set(null);
  }
}
