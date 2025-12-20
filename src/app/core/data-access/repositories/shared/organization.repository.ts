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
import { Organization, LoggerService, OrganizationRole } from '@core';
import { Observable, from, map, catchError, of } from 'rxjs';

import { OrganizationMemberRepository } from './organization-member.repository';

@Injectable({
  providedIn: 'root'
})
export class OrganizationRepository {
  private readonly firestore = inject(Firestore);
  private readonly logger = inject(LoggerService);
  private readonly memberRepository = inject(OrganizationMemberRepository);
  private readonly injector = inject(Injector);
  private readonly collectionName = 'organizations';

  private getCollectionRef(): CollectionReference {
    return collection(this.firestore, this.collectionName);
  }

  private getDocRef(organizationId: string): DocumentReference {
    return doc(this.firestore, this.collectionName, organizationId);
  }

  private toOrganization(data: any, id: string): Organization {
    return {
      id,
      name: data.name,
      description: data.description || null,
      logo_url: data.logo_url || null,
      is_discoverable: data.is_discoverable !== undefined ? data.is_discoverable : true, // Default to true
      created_by: data.created_by,
      created_at: data.created_at instanceof Timestamp ? data.created_at.toDate().toISOString() : data.created_at
    };
  }

  findById(organizationId: string): Observable<Organization | null> {
    return from(getDoc(this.getDocRef(organizationId))).pipe(
      map(snapshot => (snapshot.exists() ? this.toOrganization(snapshot.data(), snapshot.id) : null)),
      catchError(error => {
        this.logger.error('[OrganizationRepository]', 'findById failed', error as Error);
        return of(null);
      })
    );
  }

  findByCreator(creatorId: string): Observable<Organization[]> {
    // Note: Removed orderBy to avoid requiring a composite Firestore index
    // Sorting can be done in-memory if needed
    const q = query(this.getCollectionRef(), where('created_by', '==', creatorId));

    return from(runInInjectionContext(this.injector, () => getDocs(q))).pipe(
      map(snapshot => {
        const orgs = snapshot.docs.map(docSnap => this.toOrganization(docSnap.data(), docSnap.id));
        // Sort in-memory by created_at descending
        return orgs.sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA;
        });
      }),
      catchError(error => {
        this.logger.error('[OrganizationRepository]', 'findByCreator failed', error as Error);
        console.error('[OrganizationRepository] findByCreator error details:', {
          code: error?.code,
          message: error?.message,
          creatorId
        });
        return of([]);
      })
    );
  }

  async create(organization: Omit<Organization, 'id' | 'created_at'>): Promise<Organization> {
    const now = Timestamp.now();
    const docData = {
      ...organization,
      is_discoverable: organization.is_discoverable !== undefined ? organization.is_discoverable : true, // Default to true
      created_at: now
    };

    try {
      // 1. 建立文件 (Create document)
      const docRef = await addDoc(this.getCollectionRef(), docData);
      console.log('[OrganizationRepository] ✅ Document created with ID:', docRef.id);

      // 2. 讀取剛建立的文件以確認持久化成功 (Read back to confirm persistence)
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        console.log('[OrganizationRepository] ✅ Document verified in Firestore:', snapshot.id);
        const createdOrg = this.toOrganization(snapshot.data(), snapshot.id);

        // 3. 自動添加建立者為擁有者 (Occam's Razor: automatic owner assignment)
        try {
          await this.memberRepository.addMember(createdOrg.id, createdOrg.created_by, OrganizationRole.OWNER);
          console.log('[OrganizationRepository] ✅ Creator added as OWNER:', createdOrg.created_by);
        } catch (memberError) {
          // 不要因為成員添加失敗而讓整個組織建立失敗 (Don't fail org creation if member add fails)
          this.logger.error('[OrganizationRepository]', 'Failed to add creator as owner', memberError as Error);
        }

        return createdOrg;
      } else {
        console.error('[OrganizationRepository] ❌ Document not found after creation!');
        // 返回本地建立的資料作為後備 (Return locally created data as fallback)
        return this.toOrganization(docData, docRef.id);
      }
    } catch (error: any) {
      this.logger.error('[OrganizationRepository]', 'create failed', error as Error);
      console.error('[OrganizationRepository] Error details:', {
        code: error.code,
        message: error.message,
        details: error
      });
      throw error;
    }
  }

  async update(organizationId: string, data: Partial<Organization>): Promise<void> {
    const docData = { ...data };
    delete (docData as any).id;
    delete (docData as any).created_by;
    delete (docData as any).created_at;

    try {
      await updateDoc(this.getDocRef(organizationId), docData);
    } catch (error: any) {
      this.logger.error('[OrganizationRepository]', 'update failed', error as Error);
      throw error;
    }
  }

  async delete(organizationId: string): Promise<void> {
    try {
      await deleteDoc(this.getDocRef(organizationId));
    } catch (error: any) {
      this.logger.error('[OrganizationRepository]', 'delete failed', error as Error);
      throw error;
    }
  }
}
