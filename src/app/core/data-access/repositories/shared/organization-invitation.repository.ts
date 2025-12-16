import { Injectable, inject } from '@angular/core';
import { Firestore, addDoc, collection, getDocs, query, where, CollectionReference, Timestamp } from '@angular/fire/firestore';
import { LoggerService } from '@core/services/logger/logger.service';
import { CreateOrganizationInvitationRequest, InvitationStatus, OrganizationInvitation } from '@core/types/account.types';
import { Observable, from, map, catchError, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OrganizationInvitationRepository {
  private readonly firestore = inject(Firestore);
  private readonly logger = inject(LoggerService);
  private readonly collectionName = 'organization_invitations';

  private getCollectionRef(): CollectionReference {
    return collection(this.firestore, this.collectionName);
  }

  private toInvitation(data: any, id: string): OrganizationInvitation {
    return {
      id,
      organization_id: data.organization_id,
      email: data.email,
      invited_by: data.invited_by,
      status: (data.status as InvitationStatus) ?? InvitationStatus.PENDING,
      created_at: data.created_at instanceof Timestamp ? data.created_at.toDate().toISOString() : data.created_at
    };
  }

  /**
   * 建立組織邀請
   */
  async create(data: CreateOrganizationInvitationRequest): Promise<OrganizationInvitation> {
    const now = Timestamp.now();
    const normalizedEmail = data.email.trim().toLowerCase();
    const payload = {
      ...data,
      email: normalizedEmail,
      status: data.status ?? InvitationStatus.PENDING,
      created_at: now
    };

    try {
      const docRef = await addDoc(this.getCollectionRef(), payload);
      this.logger.info('[OrganizationInvitationRepository]', `Invitation created for ${data.email} to org ${data.organization_id}`);
      return this.toInvitation(payload, docRef.id);
    } catch (error: any) {
      this.logger.error('[OrganizationInvitationRepository]', 'create failed', error as Error);
      throw error;
    }
  }

  /**
   * 取得組織的邀請列表
   */
  findByOrganization(organizationId: string): Observable<OrganizationInvitation[]> {
    const q = query(this.getCollectionRef(), where('organization_id', '==', organizationId));

    return from(getDocs(q)).pipe(
      map(snapshot => snapshot.docs.map(docSnap => this.toInvitation(docSnap.data(), docSnap.id))),
      catchError(error => {
        this.logger.error('[OrganizationInvitationRepository]', 'findByOrganization failed', error as Error);
        return of([]);
      })
    );
  }
}
