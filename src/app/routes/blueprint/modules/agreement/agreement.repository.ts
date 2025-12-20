import { Injectable, inject } from '@angular/core';
import { collection, doc, addDoc, deleteDoc, DocumentData, Firestore, getDocs, query, setDoc, Timestamp, where } from '@angular/fire/firestore';
import { LoggerService } from '@core/services/logger';

import { Agreement, AgreementDocument } from './agreement.model';

@Injectable({ providedIn: 'root' })
export class AgreementRepository {
  private readonly firestore = inject(Firestore);
  private readonly logger = inject(LoggerService);
  private readonly collectionPath = 'agreements';
  private readonly collectionRef = collection(this.firestore, this.collectionPath);


    async createAgreement(payload: Partial<Agreement> & { blueprintId: string }): Promise<Agreement> {
    const now = new Date();
    const data: AgreementDocument = {
      blueprintId: payload.blueprintId,
      title: payload.title || '新協議',
      counterparty: payload.counterparty || '',
      status: (payload.status as Agreement['status']) || 'draft',
      effectiveDate: payload.effectiveDate || now
    } as AgreementDocument;

    if (payload.value !== undefined && payload.value !== null) {
      (data as any).value = payload.value;
    }
    if ((payload as any).attachmentUrl) {
      (data as any).attachmentUrl = (payload as any).attachmentUrl;
    }
    if ((payload as any).attachmentPath) {
      (data as any).attachmentPath = (payload as any).attachmentPath;
    }
    if ((payload as any).parsedJsonUrl) {
      (data as any).parsedJsonUrl = (payload as any).parsedJsonUrl;
    }

    const docRef = await addDoc(this.collectionRef, data as any);
    return this.toEntity(data as DocumentData, docRef.id);
  }

  async findByBlueprintId(blueprintId: string): Promise<Agreement[]> {
    try {
      const q = query(this.collectionRef, where('blueprintId', '==', blueprintId));
      const snapshot = await getDocs(q);
      const items = snapshot.docs.map(doc => this.toEntity(doc.data(), doc.id));
      return items.sort((a, b) => b.effectiveDate.getTime() - a.effectiveDate.getTime());
    } catch (error) {
      this.logger.error('[AgreementRepository]', 'Failed to load agreements', error as Error, { blueprintId });
      return [];
    }
  }


  async updateAgreement(agreementId: string, payload: Partial<Agreement>): Promise<void> {
    const ref = doc(this.firestore, `${this.collectionPath}/${agreementId}`);
    await setDoc(ref, payload, { merge: true });
  }

  async saveAttachmentUrl(agreementId: string, attachmentUrl: string, attachmentPath?: string): Promise<void> {
    try {
      const ref = doc(this.firestore, `${this.collectionPath}/${agreementId}`);
      await setDoc(ref, { attachmentUrl, attachmentPath }, { merge: true });
    } catch (error) {
      this.logger.error('[AgreementRepository]', 'Failed to save attachment URL', error as Error, { agreementId });
      throw error;
    }
  }

  async saveParsedJsonUrl(agreementId: string, parsedJsonUrl: string): Promise<void> {
    const ref = doc(this.firestore, `${this.collectionPath}/${agreementId}`);
    await setDoc(ref, { parsedJsonUrl }, { merge: true });
  }

  async deleteAgreement(agreementId: string): Promise<void> {
    const ref = doc(this.firestore, `${this.collectionPath}/${agreementId}`);
    await deleteDoc(ref);
  }

  private toEntity(data: DocumentData, id: string): Agreement {
    const doc = data as AgreementDocument;
    const effectiveDateRaw = doc.effectiveDate ?? new Date();
    const effectiveDate = effectiveDateRaw instanceof Timestamp ? effectiveDateRaw.toDate() : new Date(effectiveDateRaw);

    return {
      id,
      blueprintId: doc.blueprintId,
      title: doc.title,
      counterparty: doc.counterparty,
      status: (doc.status as Agreement['status']) ?? 'draft',
      effectiveDate,
      value: doc.value,
      attachmentUrl: (doc as any).attachmentUrl,
      attachmentPath: (doc as any).attachmentPath,
      parsedJsonUrl: (doc as any).parsedJsonUrl
    };
  }
}
