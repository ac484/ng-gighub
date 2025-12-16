import { Injectable } from '@angular/core';
import { query, where, DocumentData, Timestamp } from '@angular/fire/firestore';
import { FriendRelation, FriendStatus } from '@core/domain/models/friend.model';

import { FirestoreBaseRepository } from '../../base/firestore-base.repository';

@Injectable({ providedIn: 'root' })
export class FriendRepository extends FirestoreBaseRepository<FriendRelation> {
  protected collectionName = 'friends';

  protected toEntity(data: DocumentData, id: string): FriendRelation {
    const created = data['created_at'];
    const updated = data['updated_at'];

    const toISO = (val: any) => {
      if (!val) return new Date().toISOString();
      if (val.toDate) return val.toDate().toISOString();
      return new Date(val).toISOString();
    };

    return {
      id,
      requesterId: data['requester_id'] || data['requesterId'],
      recipientId: data['recipient_id'] || data['recipientId'],
      status: data['status'] as FriendStatus,
      createdAt: toISO(created),
      updatedAt: updated ? toISO(updated) : undefined
    };
  }

  async createRelation(payload: Partial<FriendRelation>): Promise<FriendRelation> {
    return this.executeWithRetry(async () => {
      return this.createDocument(payload as Partial<FriendRelation>);
    });
  }

  async findByUser(userId: string): Promise<FriendRelation[]> {
    return this.executeWithRetry(async () => {
      const q1 = query(this.collectionRef, where('requester_id', '==', userId), where('deleted_at', '==', null));
      const q2 = query(this.collectionRef, where('recipient_id', '==', userId), where('deleted_at', '==', null));

      const r1 = await this.queryDocuments(q1);
      const r2 = await this.queryDocuments(q2);

      // Merge unique by id
      const map = new Map<string, FriendRelation>();
      for (const r of [...r1, ...r2]) map.set(r.id, r);
      return Array.from(map.values());
    });
  }

  async updateStatus(id: string, status: FriendStatus): Promise<void> {
    return this.executeWithRetry(async () => {
      await this.updateDocument(id, { status, updated_at: Timestamp.now() } as any);
    });
  }

  async removeRelation(id: string): Promise<void> {
    return this.executeWithRetry(async () => {
      // hard delete
      await this.deleteDocument(id, true);
    });
  }
}

export default FriendRepository;
