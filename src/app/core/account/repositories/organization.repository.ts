import { inject, Injectable } from '@angular/core';
import { Firestore, addDoc, collection, collectionData, doc, docData, query, updateDoc, where } from '@angular/fire/firestore';
import { Observable, catchError, map, of } from 'rxjs';
import { Organization } from '../models';
import { LoggerService } from '../../services';

@Injectable({
  providedIn: 'root'
})
export class OrganizationRepository {
  private readonly firestore = inject(Firestore);
  private readonly logger = inject(LoggerService);
  private readonly collectionRef = collection(this.firestore, 'organizations');

  findById(id: string): Observable<Organization | null> {
    if (!id) return of(null);

    return docData(doc(this.collectionRef, id)).pipe(
      map(data => (data ? ({ ...(data as Organization), id } as Organization) : null)),
      catchError(error => {
        this.logger.error('[OrganizationRepository] findById failed', error);
        return of(null);
      })
    );
  }

  findByCreator(userId: string): Observable<Organization[]> {
    if (!userId) return of([]);
    const q = query(this.collectionRef, where('creator_id', '==', userId));
    return collectionData(q, { idField: 'id' }).pipe(
      map(items => items as Organization[]),
      catchError(error => {
        this.logger.error('[OrganizationRepository] findByCreator failed', error);
        return of<Organization[]>([]);
      })
    );
  }

  async create(payload: Omit<Organization, 'id'>): Promise<Organization> {
    const created_at = payload.created_at ?? new Date().toISOString();
    const docRef = await addDoc(this.collectionRef, { ...payload, created_at });
    return { ...payload, id: docRef.id, created_at };
  }

  async update(id: string, changes: Partial<Organization>): Promise<void> {
    await updateDoc(doc(this.collectionRef, id), changes);
  }
}
