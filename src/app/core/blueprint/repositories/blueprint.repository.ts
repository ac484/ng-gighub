import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
   limit,
   query,
  updateDoc,
  where,
  Timestamp,
  CollectionReference,
  DocumentReference,
  QueryConstraint
} from '@angular/fire/firestore';
import { Blueprint, BlueprintQueryOptions, BlueprintStatus, CreateBlueprintRequest, OwnerType, LoggerService } from '@core';
import { Observable, catchError, from, map, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BlueprintRepository {
  private readonly firestore = inject(Firestore);
  private readonly logger = inject(LoggerService);
  private readonly collectionName = 'blueprints';

  private getCollectionRef(): CollectionReference {
    return collection(this.firestore, this.collectionName);
  }

  private getDocRef(id: string): DocumentReference {
    return doc(this.firestore, this.collectionName, id);
  }

  private toBlueprint(data: any, id: string): Blueprint {
    return {
      id,
      name: data.name,
      slug: data.slug,
      description: data.description,
      coverUrl: data.coverUrl,
      ownerId: data.ownerId,
      ownerType: data.ownerType,
      isPublic: data.isPublic,
      status: data.status,
      enabledModules: data.enabledModules || [],
      metadata: data.metadata || {},
      createdBy: data.createdBy,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
      deletedAt: data.deletedAt ? (data.deletedAt instanceof Timestamp ? data.deletedAt.toDate() : data.deletedAt) : null
    };
  }

  findById(id: string): Observable<Blueprint | null> {
    return from(getDoc(this.getDocRef(id))).pipe(
      map(snapshot => (snapshot.exists() ? this.toBlueprint(snapshot.data(), snapshot.id) : null)),
      catchError(error => {
        this.logger.error('[BlueprintRepository]', 'findById failed', error as Error);
        return of(null);
      })
    );
  }

  findByOwner(ownerType: OwnerType, ownerId: string, options?: { limit?: number }): Observable<Blueprint[]> {
    // Note: Removed orderBy to avoid requiring a composite Firestore index
    // Sorting can be done in-memory
    const constraints: QueryConstraint[] = [
      where('ownerType', '==', ownerType),
      where('ownerId', '==', ownerId),
      where('deletedAt', '==', null)
    ];

    if (options?.limit) {
      constraints.push(limit(options.limit));
    }

    const q = query(this.getCollectionRef(), ...constraints);

    return from(getDocs(q)).pipe(
      map(snapshot => {
        const blueprints = snapshot.docs.map(docSnap => this.toBlueprint(docSnap.data(), docSnap.id));
        // Sort in-memory by createdAt descending
        return blueprints.sort((a, b) => {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return dateB - dateA;
        });
      }),
      catchError(error => {
        this.logger.error('[BlueprintRepository]', 'findByOwner failed', error as Error);
        console.error('[BlueprintRepository] findByOwner error details:', {
          code: error?.code,
          message: error?.message,
          ownerType,
          ownerId
        });
        return of([]);
      })
    );
  }

  findWithOptions(options: BlueprintQueryOptions): Observable<Blueprint[]> {
    const constraints: QueryConstraint[] = [];

    if (options.ownerId) constraints.push(where('ownerId', '==', options.ownerId));
    if (options.ownerType) constraints.push(where('ownerType', '==', options.ownerType));
    if (options.status) constraints.push(where('status', '==', options.status));
    if (options.isPublic !== undefined) constraints.push(where('isPublic', '==', options.isPublic));
    if (!options.includeDeleted) constraints.push(where('deletedAt', '==', null));

    // Note: Removed orderBy to avoid requiring a composite Firestore index
    // Sorting can be done in-memory

    const q = query(this.getCollectionRef(), ...constraints);

    return from(getDocs(q)).pipe(
      map(snapshot => {
        const blueprints = snapshot.docs.map(docSnap => this.toBlueprint(docSnap.data(), docSnap.id));
        // Sort in-memory by createdAt descending
        return blueprints.sort((a, b) => {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return dateB - dateA;
        });
      }),
      catchError(error => {
        this.logger.error('[BlueprintRepository]', 'findWithOptions failed', error as Error);
        console.error('[BlueprintRepository] findWithOptions error details:', {
          code: error?.code,
          message: error?.message,
          options
        });
        return of([]);
      })
    );
  }

  async create(payload: CreateBlueprintRequest): Promise<Blueprint> {
    const now = Timestamp.now();
    const docData = {
      ...payload,
      isPublic: payload.isPublic ?? false,
      enabledModules: payload.enabledModules ?? [],
      metadata: payload.metadata ?? {},
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      status: BlueprintStatus.ACTIVE
    };

    try {
      // 1. 建立文件 (Create document)
      const docRef = await addDoc(this.getCollectionRef(), docData);
      console.log('[BlueprintRepository] ✅ Document created with ID:', docRef.id);

      // 2. 讀取剛建立的文件以確認持久化成功 (Read back to confirm persistence)
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        console.log('[BlueprintRepository] ✅ Document verified in Firestore:', snapshot.id);
        return this.toBlueprint(snapshot.data(), snapshot.id);
      } else {
        console.error('[BlueprintRepository] ❌ Document not found after creation!');
        // 返回本地建立的資料作為後備 (Return locally created data as fallback)
        return this.toBlueprint(docData, docRef.id);
      }
    } catch (error: any) {
      this.logger.error('[BlueprintRepository]', 'create failed', error as Error);
      console.error('[BlueprintRepository] Error details:', {
        code: error.code,
        message: error.message,
        details: error
      });
      throw error;
    }
  }

  async update(id: string, data: Partial<Blueprint>): Promise<void> {
    const docData = {
      ...data,
      updatedAt: Timestamp.now()
    };

    delete (docData as any).id;

    try {
      await updateDoc(this.getDocRef(id), docData);
    } catch (error: any) {
      this.logger.error('[BlueprintRepository]', 'update failed', error as Error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await updateDoc(this.getDocRef(id), {
        deletedAt: Timestamp.now(),
        status: BlueprintStatus.ARCHIVED,
        updatedAt: Timestamp.now()
      });
    } catch (error: any) {
      this.logger.error('[BlueprintRepository]', 'soft delete failed', error as Error);
      throw error;
    }
  }

  async hardDelete(id: string): Promise<void> {
    try {
      await deleteDoc(this.getDocRef(id));
    } catch (error: any) {
      this.logger.error('[BlueprintRepository]', 'hard delete failed', error as Error);
      throw error;
    }
  }
}
