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
import { Team, LoggerService } from '@core';
import { Observable, from, map, catchError, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TeamRepository {
  private readonly firestore = inject(Firestore);
  private readonly logger = inject(LoggerService);
  private readonly injector = inject(Injector);
  private readonly collectionName = 'teams';

  private getCollectionRef(): CollectionReference {
    return collection(this.firestore, this.collectionName);
  }

  private getDocRef(teamId: string): DocumentReference {
    return doc(this.firestore, this.collectionName, teamId);
  }

  private toTeam(data: any, id: string): Team {
    return {
      id,
      organization_id: data.organization_id,
      name: data.name,
      description: data.description || null,
      created_at: data.created_at instanceof Timestamp ? data.created_at.toDate().toISOString() : data.created_at
    };
  }

  findById(teamId: string): Observable<Team | null> {
    return from(getDoc(this.getDocRef(teamId))).pipe(
      map(snapshot => (snapshot.exists() ? this.toTeam(snapshot.data(), snapshot.id) : null)),
      catchError(error => {
        this.logger.error('[TeamRepository]', 'findById failed', error as Error);
        return of(null);
      })
    );
  }

  findByOrganization(organizationId: string): Observable<Team[]> {
    // Note: Removed orderBy to avoid requiring a composite Firestore index
    // Sorting can be done in-memory if needed
    const q = query(this.getCollectionRef(), where('organization_id', '==', organizationId));

    return from(runInInjectionContext(this.injector, () => getDocs(q))).pipe(
      map(snapshot => {
        const teams = snapshot.docs.map(docSnap => this.toTeam(docSnap.data(), docSnap.id));
        // Sort in-memory by created_at descending
        return teams.sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA;
        });
      }),
      catchError(error => {
        this.logger.error('[TeamRepository]', 'findByOrganization failed', error as Error);
        console.error('[TeamRepository] findByOrganization error details:', {
          code: error?.code,
          message: error?.message,
          organizationId
        });
        return of([]);
      })
    );
  }

  async create(team: Omit<Team, 'id' | 'created_at'>): Promise<Team> {
    const now = Timestamp.now();
    const docData = {
      ...team,
      created_at: now
    };

    try {
      // 1. 建立文件 (Create document)
      const docRef = await addDoc(this.getCollectionRef(), docData);
      console.log('[TeamRepository] ✅ Document created with ID:', docRef.id);

      // 2. 讀取剛建立的文件以確認持久化成功 (Read back to confirm persistence)
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        console.log('[TeamRepository] ✅ Document verified in Firestore:', snapshot.id);
        return this.toTeam(snapshot.data(), snapshot.id);
      } else {
        console.error('[TeamRepository] ❌ Document not found after creation!');
        // 返回本地建立的資料作為後備 (Return locally created data as fallback)
        return this.toTeam(docData, docRef.id);
      }
    } catch (error: any) {
      this.logger.error('[TeamRepository]', 'create failed', error as Error);
      console.error('[TeamRepository] Error details:', {
        code: error.code,
        message: error.message,
        details: error
      });
      throw error;
    }
  }

  async update(teamId: string, data: Partial<Team>): Promise<void> {
    const docData = { ...data };
    delete (docData as any).id;
    delete (docData as any).organization_id;
    delete (docData as any).created_at;

    try {
      await updateDoc(this.getDocRef(teamId), docData);
    } catch (error: any) {
      this.logger.error('[TeamRepository]', 'update failed', error as Error);
      throw error;
    }
  }

  async delete(teamId: string): Promise<void> {
    try {
      await deleteDoc(this.getDocRef(teamId));
    } catch (error: any) {
      this.logger.error('[TeamRepository]', 'delete failed', error as Error);
      throw error;
    }
  }
}
