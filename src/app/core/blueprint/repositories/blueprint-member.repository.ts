import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  CollectionReference,
  DocumentReference,
  Timestamp
} from '@angular/fire/firestore';
import { BlueprintMember } from '@core';
import { Observable, from, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BlueprintMemberRepository {
  private readonly firestore = inject(Firestore);

  private getMembersCollectionRef(blueprintId: string): CollectionReference {
    return collection(this.firestore, 'blueprints', blueprintId, 'members');
  }

  private getMemberDocRef(blueprintId: string, memberId: string): DocumentReference {
    return doc(this.firestore, 'blueprints', blueprintId, 'members', memberId);
  }

  private toMember(data: any, id: string): BlueprintMember {
    return {
      id,
      ...data,
      grantedAt: data.grantedAt instanceof Timestamp ? data.grantedAt.toDate() : data.grantedAt
    };
  }

  findByBlueprint(blueprintId: string): Observable<BlueprintMember[]> {
    return from(getDocs(this.getMembersCollectionRef(blueprintId))).pipe(
      map(snapshot => snapshot.docs.map(docSnap => this.toMember(docSnap.data(), docSnap.id)))
    );
  }

  async addMember(blueprintId: string, member: Omit<BlueprintMember, 'id' | 'grantedAt'>): Promise<BlueprintMember> {
    const docRef = await addDoc(this.getMembersCollectionRef(blueprintId), {
      ...member,
      grantedAt: Timestamp.now()
    });
    const docSnap = await getDoc(docRef);
    return this.toMember(docSnap.data(), docRef.id);
  }

  async updateMember(blueprintId: string, memberId: string, data: Partial<BlueprintMember>): Promise<void> {
    await updateDoc(this.getMemberDocRef(blueprintId, memberId), data);
  }

  async removeMember(blueprintId: string, memberId: string): Promise<void> {
    await deleteDoc(this.getMemberDocRef(blueprintId, memberId));
  }
}
