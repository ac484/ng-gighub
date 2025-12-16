export type FriendStatus = 'pending' | 'accepted' | 'rejected' | 'blocked';

export interface FriendRelation {
  id: string;
  requesterId: string;
  recipientId: string;
  status: FriendStatus;
  createdAt: string; // ISO timestamp
  updatedAt?: string; // ISO timestamp
  // optional context fields (blueprint/organization) can be added later
}

export default FriendRelation;
