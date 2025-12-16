import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
  where,
  CollectionReference,
  Timestamp
} from '@angular/fire/firestore';
import { Notification, CreateNotificationData, UpdateNotificationData, NotificationType } from '@core/models/notification.model';
import { LoggerService } from '@core/services/logger/logger.service';

@Injectable({
  providedIn: 'root'
})
export class NotificationRepository {
  private readonly firestore = inject(Firestore);
  private readonly logger = inject(LoggerService);
  private readonly collectionName = 'notifications';

  private getCollectionRef(): CollectionReference {
    return collection(this.firestore, this.collectionName);
  }

  private toNotification(data: any, id: string): Notification {
    const datetime =
      data.datetime instanceof Timestamp ? data.datetime.toDate() : typeof data.datetime === 'string' ? data.datetime : new Date();

    return {
      id,
      userId: data.userId,
      type: (data.type as NotificationType) ?? NotificationType.NOTICE,
      title: data.title,
      description: data.description,
      avatar: data.avatar,
      datetime,
      read: !!data.read,
      extra: data.extra,
      status: data.status,
      link: data.link,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date()
    };
  }

  async findAllByUser(userId: string): Promise<Notification[]> {
    const q = query(this.getCollectionRef(), where('userId', '==', userId));

    try {
      const snapshot = await getDocs(q);
      return snapshot.docs.map(docSnap => this.toNotification(docSnap.data(), docSnap.id));
    } catch (error: any) {
      this.logger.error('[NotificationRepository]', 'findAllByUser failed', error as Error);
      return [];
    }
  }

  async findById(id: string): Promise<Notification | null> {
    try {
      const snapshot = await getDoc(doc(this.firestore, this.collectionName, id));
      return snapshot.exists() ? this.toNotification(snapshot.data(), snapshot.id) : null;
    } catch (error: any) {
      this.logger.error('[NotificationRepository]', 'findById failed', error as Error);
      return null;
    }
  }

  async create(data: CreateNotificationData): Promise<Notification> {
    const now = Timestamp.now();
    const payload = {
      ...data,
      read: data.read ?? false,
      datetime: data.datetime ?? now,
      createdAt: now,
      updatedAt: now
    };

    try {
      const docRef = await addDoc(this.getCollectionRef(), payload);
      this.logger.info('[NotificationRepository]', `Notification created for user ${data.userId}`);
      return this.toNotification(payload, docRef.id);
    } catch (error: any) {
      this.logger.error('[NotificationRepository]', 'create failed', error as Error);
      throw error;
    }
  }

  async update(id: string, data: UpdateNotificationData): Promise<void> {
    try {
      const docRef = doc(this.firestore, this.collectionName, id);
      await updateDoc(docRef, { ...data, updatedAt: Timestamp.now() } as any);
    } catch (error: any) {
      this.logger.error('[NotificationRepository]', 'update failed', error as Error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await deleteDoc(doc(this.firestore, this.collectionName, id));
    } catch (error: any) {
      this.logger.error('[NotificationRepository]', 'delete failed', error as Error);
      throw error;
    }
  }

  async markAsRead(id: string): Promise<void> {
    await this.update(id, { read: true });
  }

  async markAllAsRead(userId: string): Promise<void> {
    try {
      const q = query(this.getCollectionRef(), where('userId', '==', userId));
      const snapshot = await getDocs(q);

      await Promise.all(snapshot.docs.map(docSnap => this.update(docSnap.id, { read: true })));
    } catch (error: any) {
      this.logger.error('[NotificationRepository]', 'markAllAsRead failed', error as Error);
      throw error;
    }
  }

  async deleteByType(userId: string, type: string): Promise<void> {
    try {
      const q = query(this.getCollectionRef(), where('userId', '==', userId), where('type', '==', type));
      const snapshot = await getDocs(q);

      await Promise.all(snapshot.docs.map(docSnap => deleteDoc(docSnap.ref)));
    } catch (error: any) {
      this.logger.error('[NotificationRepository]', 'deleteByType failed', error as Error);
      throw error;
    }
  }

  subscribeToRealtimeUpdates(userId: string, callback: (notification: Notification) => void): () => void {
    const q = query(this.getCollectionRef(), where('userId', '==', userId));
    const unsubscribe = onSnapshot(q, snapshot => {
      snapshot.docChanges().forEach(change => {
        callback(this.toNotification(change.doc.data(), change.doc.id));
      });
    });

    return unsubscribe;
  }

  subscribeToChanges(userId: string, callback: (payload: any) => void): () => void {
    return this.subscribeToRealtimeUpdates(userId, callback);
  }
}
