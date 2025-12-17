import { Injectable, inject, Injector, runInInjectionContext } from '@angular/core';
import {
  Firestore,
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  query,
  where,
  CollectionReference,
  DocumentReference,
  Timestamp
} from '@angular/fire/firestore';
import { PartnerMember, PartnerRole, LoggerService } from '@core';
import { Observable, from, map, catchError, of } from 'rxjs';

/**
 * Partner Member Repository
 * 夥伴成員資料儲存庫
 *
 * Manages partner member data access using Firebase Firestore.
 * Follows Repository pattern to abstract Firestore operations.
 *
 * @module core/repositories
 */
@Injectable({
  providedIn: 'root'
})
export class PartnerMemberRepository {
  private readonly firestore = inject(Firestore);
  private readonly logger = inject(LoggerService);
  private readonly injector = inject(Injector);
  private readonly collectionName = 'partner_members';

  private getCollectionRef(): CollectionReference {
    return collection(this.firestore, this.collectionName);
  }

  private getDocRef(memberId: string): DocumentReference {
    return doc(this.firestore, this.collectionName, memberId);
  }

  private toPartnerMember(data: any, id: string): PartnerMember {
    return {
      id,
      partner_id: data.partner_id,
      user_id: data.user_id,
      role: data.role,
      joined_at: data.joined_at instanceof Timestamp ? data.joined_at.toDate().toISOString() : data.joined_at
    };
  }

  /**
   * Find member by ID
   * 依 ID 尋找成員
   *
   * @param memberId Member ID
   * @returns Observable<PartnerMember | null>
   */
  findById(memberId: string): Observable<PartnerMember | null> {
    return from(getDoc(this.getDocRef(memberId))).pipe(
      map(snapshot => (snapshot.exists() ? this.toPartnerMember(snapshot.data(), snapshot.id) : null)),
      catchError(error => {
        this.logger.error('[PartnerMemberRepository]', 'findById failed', error as Error);
        return of(null);
      })
    );
  }

  /**
   * Find all members by partner
   * 依夥伴尋找所有成員
   *
   * @param partnerId Partner ID
   * @returns Observable<PartnerMember[]>
   */
  findByPartner(partnerId: string): Observable<PartnerMember[]> {
    const q = query(this.getCollectionRef(), where('partner_id', '==', partnerId));

    return from(runInInjectionContext(this.injector, () => getDocs(q))).pipe(
      map(snapshot => {
        const members = snapshot.docs.map(docSnap => this.toPartnerMember(docSnap.data(), docSnap.id));
        // Sort in-memory by joined_at ascending
        return members.sort((a, b) => {
          const dateA = a.joined_at ? new Date(a.joined_at).getTime() : 0;
          const dateB = b.joined_at ? new Date(b.joined_at).getTime() : 0;
          return dateA - dateB;
        });
      }),
      catchError(error => {
        this.logger.error('[PartnerMemberRepository]', 'findByPartner failed', error as Error);
        console.error('[PartnerMemberRepository] findByPartner error details:', {
          code: error?.code,
          message: error?.message,
          partnerId
        });
        return of([]);
      })
    );
  }

  /**
   * Find members by user ID
   * 依使用者 ID 尋找成員記錄
   *
   * @param userId User ID (Firebase Auth UID)
   * @returns Observable<PartnerMember[]>
   */
  findByUser(userId: string): Observable<PartnerMember[]> {
    const q = query(this.getCollectionRef(), where('user_id', '==', userId));

    return from(runInInjectionContext(this.injector, () => getDocs(q))).pipe(
      map(snapshot => snapshot.docs.map(docSnap => this.toPartnerMember(docSnap.data(), docSnap.id))),
      catchError(error => {
        this.logger.error('[PartnerMemberRepository]', 'findByUser failed', error as Error);
        return of([]);
      })
    );
  }

  /**
   * Add a member to a partner
   * 新增成員到夥伴
   *
   * @param partnerId Partner ID
   * @param userId User ID (Firebase Auth UID)
   * @param role Partner role (default: MEMBER)
   * @returns Promise<PartnerMember>
   */
  async addMember(partnerId: string, userId: string, role: PartnerRole = PartnerRole.MEMBER): Promise<PartnerMember> {
    const now = Timestamp.now();
    const docData = {
      partner_id: partnerId,
      user_id: userId,
      role,
      joined_at: now
    };

    try {
      const docRef = await addDoc(this.getCollectionRef(), docData);
      console.log('[PartnerMemberRepository] ✅ Member added with ID:', docRef.id);

      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        console.log('[PartnerMemberRepository] ✅ Member verified in Firestore:', snapshot.id);
        return this.toPartnerMember(snapshot.data(), snapshot.id);
      } else {
        console.error('[PartnerMemberRepository] ❌ Member not found after creation!');
        return this.toPartnerMember(docData, docRef.id);
      }
    } catch (error: any) {
      this.logger.error('[PartnerMemberRepository]', 'addMember failed', error as Error);
      console.error('[PartnerMemberRepository] Error details:', {
        code: error.code,
        message: error.message,
        details: error
      });
      throw error;
    }
  }

  /**
   * Remove a member from a partner
   * 從夥伴移除成員
   *
   * @param memberId Member ID
   * @returns Promise<void>
   */
  async removeMember(memberId: string): Promise<void> {
    try {
      await deleteDoc(this.getDocRef(memberId));
      console.log('[PartnerMemberRepository] ✅ Member removed:', memberId);
    } catch (error: any) {
      this.logger.error('[PartnerMemberRepository]', 'removeMember failed', error as Error);
      throw error;
    }
  }

  /**
   * Update member role
   * 更新成員角色
   *
   * Modern implementation using Firestore updateDoc instead of delete+add pattern.
   * This preserves the member ID and joined_at timestamp while updating the role.
   *
   * @param memberId Member ID
   * @param newRole New partner role
   * @returns Promise<void>
   */
  async updateRole(memberId: string, newRole: PartnerRole): Promise<void> {
    try {
      await updateDoc(this.getDocRef(memberId), { role: newRole });
      console.log('[PartnerMemberRepository] ✅ Member role updated:', memberId, 'to', newRole);
    } catch (error: any) {
      this.logger.error('[PartnerMemberRepository]', 'updateRole failed', error as Error);
      console.error('[PartnerMemberRepository] Error details:', {
        code: error.code,
        message: error.message,
        memberId,
        newRole
      });
      throw error;
    }
  }

  /**
   * Check if user is a member of a partner
   * 檢查使用者是否為夥伴成員
   *
   * @param partnerId Partner ID
   * @param userId User ID
   * @returns Promise<boolean>
   */
  async isMember(partnerId: string, userId: string): Promise<boolean> {
    const q = query(this.getCollectionRef(), where('partner_id', '==', partnerId), where('user_id', '==', userId));

    try {
      const snapshot = await getDocs(q);
      return !snapshot.empty;
    } catch (error: any) {
      this.logger.error('[PartnerMemberRepository]', 'isMember failed', error as Error);
      return false;
    }
  }
}
