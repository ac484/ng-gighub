import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  addDoc,
  collection,
  doc,
  getDocs,
  deleteDoc,
  query,
  where,
  CollectionReference,
  Timestamp
} from '@angular/fire/firestore';
import { OrganizationMember, OrganizationRole, LoggerService } from '@core';
import { Observable, from, map, catchError, of } from 'rxjs';

/**
 * Organization Member Repository
 * 組織成員 Repository - 處理組織成員數據的 CRUD 操作
 *
 * Follows Occam's Razor: Simple Firestore operations without unnecessary complexity
 */
@Injectable({
  providedIn: 'root'
})
export class OrganizationMemberRepository {
  private readonly firestore = inject(Firestore);
  private readonly logger = inject(LoggerService);
  private readonly collectionName = 'organization_members';

  private getCollectionRef(): CollectionReference {
    return collection(this.firestore, this.collectionName);
  }

  private toOrganizationMember(data: any, id: string): OrganizationMember {
    return {
      id,
      organization_id: data.organization_id,
      user_id: data.user_id,
      role: data.role as OrganizationRole,
      joined_at: data.joined_at instanceof Timestamp ? data.joined_at.toDate().toISOString() : data.joined_at
    };
  }

  /**
   * Find all members of an organization
   * 查找組織的所有成員
   */
  findByOrganization(organizationId: string): Observable<OrganizationMember[]> {
    const q = query(this.getCollectionRef(), where('organization_id', '==', organizationId));

    return from(getDocs(q)).pipe(
      map(snapshot => {
        const members = snapshot.docs.map(docSnap => this.toOrganizationMember(docSnap.data(), docSnap.id));

        // Sort by role (OWNER > ADMIN > MEMBER) then by joined date
        return members.sort((a, b) => {
          const roleOrder = { owner: 0, admin: 1, member: 2 };
          const roleA = roleOrder[a.role] ?? 999;
          const roleB = roleOrder[b.role] ?? 999;

          if (roleA !== roleB) return roleA - roleB;

          // Same role, sort by joined date (newest first)
          const dateA = a.joined_at ? new Date(a.joined_at).getTime() : 0;
          const dateB = b.joined_at ? new Date(b.joined_at).getTime() : 0;
          return dateB - dateA;
        });
      }),
      catchError(error => {
        this.logger.error('[OrganizationMemberRepository]', 'findByOrganization failed', error as Error);
        return of([]);
      })
    );
  }

  /**
   * Add a member to an organization
   * 添加成員到組織
   */
  async addMember(organizationId: string, userId: string, role: OrganizationRole = OrganizationRole.MEMBER): Promise<OrganizationMember> {
    const now = Timestamp.now();
    const docData = {
      organization_id: organizationId,
      user_id: userId,
      role,
      joined_at: now
    };

    try {
      const docRef = await addDoc(this.getCollectionRef(), docData);
      this.logger.info('[OrganizationMemberRepository]', `Member added: ${userId} to org ${organizationId} as ${role}`);

      return this.toOrganizationMember(docData, docRef.id);
    } catch (error: any) {
      this.logger.error('[OrganizationMemberRepository]', 'addMember failed', error as Error);
      throw error;
    }
  }

  /**
   * Remove a member from an organization
   * 從組織移除成員
   */
  async removeMember(memberId: string): Promise<void> {
    try {
      const docRef = doc(this.firestore, this.collectionName, memberId);
      await deleteDoc(docRef);
      this.logger.info('[OrganizationMemberRepository]', `Member removed: ${memberId}`);
    } catch (error: any) {
      this.logger.error('[OrganizationMemberRepository]', 'removeMember failed', error as Error);
      throw error;
    }
  }
}
