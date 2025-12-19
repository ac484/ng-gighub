import { Injectable, inject } from '@angular/core';
import { collection, doc, DocumentData, Firestore, getDocs, orderBy, query, setDoc, Timestamp, where } from '@angular/fire/firestore';
import { LoggerService } from '@core/services/logger';

import { Agreement, AgreementDocument } from './agreement.model';

@Injectable({ providedIn: 'root' })
export class AgreementRepository {
  private readonly firestore = inject(Firestore);
  private readonly logger = inject(LoggerService);
  private readonly collectionPath = 'agreements';
  private readonly collectionRef = collection(this.firestore, this.collectionPath);

  async findByBlueprintId(blueprintId: string): Promise<Agreement[]> {
    try {
      const q = query(this.collectionRef, where('blueprintId', '==', blueprintId), orderBy('effectiveDate', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => this.toEntity(doc.data(), doc.id));
    } catch (error) {
      this.logger.error('[AgreementRepository]', 'Failed to load agreements', error as Error, { blueprintId });
      return [];
    }
  }


  async saveAttachmentUrl(agreementId: string, attachmentUrl: string): Promise<void> {
    try {
      const ref = doc(this.firestore, `${this.collectionPath}/${agreementId}`);
      await setDoc(ref, { attachmentUrl }, { merge: true });
    } catch (error) {
      this.logger.error('[AgreementRepository]', 'Failed to save attachment URL', error as Error, { agreementId });
      throw error;
    }
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
      value: doc.value
    };
  }
}
