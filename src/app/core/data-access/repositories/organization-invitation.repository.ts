import { inject, Injectable } from '@angular/core';
import { Firestore, collection, addDoc } from '@angular/fire/firestore';
import { InvitationStatus } from '../../domain/types';
import { LoggerService } from '../../services';

export interface OrganizationInvitation {
  id?: string;
  organization_id: string;
  email: string;
  invited_by: string;
  status: InvitationStatus;
  created_at?: Date | string;
}

@Injectable({
  providedIn: 'root'
})
export class OrganizationInvitationRepository {
  private readonly firestore = inject(Firestore);
  private readonly logger = inject(LoggerService);
  private readonly collectionRef = collection(this.firestore, 'organization_invitations');

  async create(invitation: OrganizationInvitation): Promise<void> {
    try {
      await addDoc(this.collectionRef, {
        ...invitation,
        created_at: invitation.created_at ?? new Date()
      });
    } catch (error) {
      this.logger.error('[OrganizationInvitationRepository] create failed', error);
    }
  }
}
