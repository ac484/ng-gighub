import { Injectable, inject } from '@angular/core';
import { EventBus } from '@core/blueprint/events/event-bus';
import { FriendRepository } from '@core/data-access/repositories/shared/friend.repository';
import { FriendRelation } from '@core/domain/models/friend.model';
import { FirebaseService } from '@core/services/firebase.service';

@Injectable({ providedIn: 'root' })
export class FriendService {
  private repo = inject(FriendRepository);
  private eventBus = inject(EventBus);
  private firebase = inject(FirebaseService);

  async sendRequest(requesterId: string, recipientId: string): Promise<FriendRelation> {
    try {
      const now = new Date().toISOString();
      const rel = await this.repo.createRelation({ requesterId, recipientId, status: 'pending', createdAt: now });
      this.eventBus.emit({ type: 'user.friend.requested', timestamp: now, actor: requesterId, data: rel });
      return rel;
    } catch (e) {
      throw e;
    }
  }

  async acceptRequest(id: string, actorId: string): Promise<void> {
    try {
      await this.repo.updateStatus(id, 'accepted');
      const now = new Date().toISOString();
      this.eventBus.emit({ type: 'user.friend.accepted', timestamp: now, actor: actorId, data: { id } });
    } catch (e) {
      throw e;
    }
  }

  async rejectRequest(id: string, actorId: string): Promise<void> {
    try {
      await this.repo.updateStatus(id, 'rejected');
      const now = new Date().toISOString();
      this.eventBus.emit({ type: 'user.friend.rejected', timestamp: now, actor: actorId, data: { id } });
    } catch (e) {
      throw e;
    }
  }

  async removeFriend(id: string, actorId: string): Promise<void> {
    try {
      await this.repo.removeRelation(id);
      const now = new Date().toISOString();
      this.eventBus.emit({ type: 'user.friend.removed', timestamp: now, actor: actorId, data: { id } });
    } catch (e) {
      throw e;
    }
  }

  async listForCurrentUser(): Promise<FriendRelation[]> {
    const uid = this.firebase.getCurrentUserId();
    if (!uid) return [];
    return this.repo.findByUser(uid);
  }
}

export default FriendService;
