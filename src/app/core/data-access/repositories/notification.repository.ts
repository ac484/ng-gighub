import { inject, Injectable } from '@angular/core';
import { Firestore, collection, addDoc } from '@angular/fire/firestore';
import { NotificationPayload } from '../../account/models';
import { LoggerService } from '../../services';

@Injectable({
  providedIn: 'root'
})
export class NotificationRepository {
  private readonly firestore = inject(Firestore);
  private readonly logger = inject(LoggerService);
  private readonly collectionRef = collection(this.firestore, 'notifications');

  async create(payload: NotificationPayload): Promise<void> {
    try {
      await addDoc(this.collectionRef, {
        ...payload,
        datetime: payload.datetime ?? new Date(),
        read: payload.read ?? false
      });
    } catch (error) {
      this.logger.error('[NotificationRepository] create failed', error);
    }
  }
}
