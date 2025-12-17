import { Injectable, inject, Injector, runInInjectionContext } from '@angular/core';
import {
  Firestore,
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  CollectionReference,
  DocumentReference,
  Timestamp
} from '@angular/fire/firestore';
import { Partner, LoggerService } from '@core';
import { Observable, from, map, catchError, of } from 'rxjs';

/**
 * Partner Repository
 * 夥伴資料儲存庫
 *
 * Manages external partner data access using Firebase Firestore.
 * Follows Repository pattern to abstract Firestore operations.
 *
 * @module core/repositories
 */
@Injectable({
  providedIn: 'root'
})
export class PartnerRepository {
  private readonly firestore = inject(Firestore);
  private readonly logger = inject(LoggerService);
  private readonly injector = inject(Injector);
  private readonly collectionName = 'partners';

  private getCollectionRef(): CollectionReference {
    return collection(this.firestore, this.collectionName);
  }

  private getDocRef(partnerId: string): DocumentReference {
    return doc(this.firestore, this.collectionName, partnerId);
  }

  private toPartner(data: any, id: string): Partner {
    return {
      id,
      organization_id: data.organization_id,
      name: data.name,
      type: data.type,
      company_name: data.company_name || null,
      contact_email: data.contact_email || null,
      contact_phone: data.contact_phone || null,
      description: data.description || null,
      created_at: data.created_at instanceof Timestamp ? data.created_at.toDate().toISOString() : data.created_at
    };
  }

  /**
   * Find partner by ID
   * 依 ID 尋找夥伴
   *
   * @param partnerId Partner ID
   * @returns Observable<Partner | null>
   */
  findById(partnerId: string): Observable<Partner | null> {
    return from(getDoc(this.getDocRef(partnerId))).pipe(
      map(snapshot => (snapshot.exists() ? this.toPartner(snapshot.data(), snapshot.id) : null)),
      catchError(error => {
        this.logger.error('[PartnerRepository]', 'findById failed', error as Error);
        return of(null);
      })
    );
  }

  /**
   * Find all partners by organization
   * 依組織尋找所有夥伴
   *
   * @param organizationId Organization ID
   * @returns Observable<Partner[]>
   */
  findByOrganization(organizationId: string): Observable<Partner[]> {
    const q = query(this.getCollectionRef(), where('organization_id', '==', organizationId));

    return from(runInInjectionContext(this.injector, () => getDocs(q))).pipe(
      map(snapshot => {
        const partners = snapshot.docs.map(docSnap => this.toPartner(docSnap.data(), docSnap.id));
        // Sort in-memory by created_at descending
        return partners.sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA;
        });
      }),
      catchError(error => {
        this.logger.error('[PartnerRepository]', 'findByOrganization failed', error as Error);
        console.error('[PartnerRepository] findByOrganization error details:', {
          code: error?.code,
          message: error?.message,
          organizationId
        });
        return of([]);
      })
    );
  }

  /**
   * Create a new partner
   * 建立新夥伴
   *
   * @param partner Partner data without id and created_at
   * @returns Promise<Partner>
   */
  async create(partner: Omit<Partner, 'id' | 'created_at'>): Promise<Partner> {
    const now = Timestamp.now();
    const docData = {
      ...partner,
      created_at: now
    };

    try {
      // Create document
      const docRef = await addDoc(this.getCollectionRef(), docData);
      console.log('[PartnerRepository] ✅ Document created with ID:', docRef.id);

      // Read back to confirm persistence
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        console.log('[PartnerRepository] ✅ Document verified in Firestore:', snapshot.id);
        return this.toPartner(snapshot.data(), snapshot.id);
      } else {
        console.error('[PartnerRepository] ❌ Document not found after creation!');
        // Return locally created data as fallback
        return this.toPartner(docData, docRef.id);
      }
    } catch (error: any) {
      this.logger.error('[PartnerRepository]', 'create failed', error as Error);
      console.error('[PartnerRepository] Error details:', {
        code: error.code,
        message: error.message,
        details: error
      });
      throw error;
    }
  }

  /**
   * Update an existing partner
   * 更新現有夥伴
   *
   * @param partnerId Partner ID
   * @param data Partial partner data
   * @returns Promise<void>
   */
  async update(partnerId: string, data: Partial<Partner>): Promise<void> {
    const docData = { ...data };
    delete (docData as any).id;
    delete (docData as any).organization_id;
    delete (docData as any).created_at;

    try {
      await updateDoc(this.getDocRef(partnerId), docData);
    } catch (error: any) {
      this.logger.error('[PartnerRepository]', 'update failed', error as Error);
      throw error;
    }
  }

  /**
   * Delete a partner
   * 刪除夥伴
   *
   * @param partnerId Partner ID
   * @returns Promise<void>
   */
  async delete(partnerId: string): Promise<void> {
    try {
      await deleteDoc(this.getDocRef(partnerId));
    } catch (error: any) {
      this.logger.error('[PartnerRepository]', 'delete failed', error as Error);
      throw error;
    }
  }
}
