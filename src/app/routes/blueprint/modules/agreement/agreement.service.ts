import { Injectable, inject, signal } from '@angular/core';
import { Functions, httpsCallable, HttpsCallableResult } from '@angular/fire/functions';
import { getDownloadURL, uploadBytes } from '@angular/fire/storage';

import { FirebaseService } from '@core/services/firebase.service';

import { Agreement } from './agreement.model';
import { AgreementRepository } from './agreement.repository';

@Injectable({ providedIn: 'root' })
export class AgreementService {
  private readonly repository = inject(AgreementRepository);
  private readonly firebase = inject(FirebaseService);
  private readonly functions = inject(Functions);

  // ✅ Create callable during injection context
  private readonly processDocumentFromStorage = httpsCallable<
    { gcsUri: string; mimeType: string },
    { success: boolean; result: { [key: string]: unknown } }
  >(this.functions, 'processDocumentFromStorage');

  private readonly _agreements = signal<Agreement[]>([]);
  private readonly _loading = signal(false);
  private readonly _uploading = signal(false);

  readonly agreements = this._agreements.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly uploading = this._uploading.asReadonly();

  async loadByBlueprint(blueprintId: string): Promise<void> {
    if (!blueprintId) return;
    this._loading.set(true);
    try {
      const data = await this.repository.findByBlueprintId(blueprintId);
      this._agreements.set(data);
    } finally {
      this._loading.set(false);
    }
  }

  async createAgreement(blueprintId: string): Promise<Agreement> {
    const created = await this.repository.createAgreement({ blueprintId });
    this._agreements.update(items => [created, ...items]);
    return created;
  }

  async uploadAttachment(blueprintId: string, agreementId: string, file: File): Promise<string> {
    this._uploading.set(true);
    try {
      const path = `agreements/${agreementId}/${file.name}`;
      const storageRef = this.firebase.storageRef(path);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await this.repository.saveAttachmentUrl(agreementId, url, path);
      this._agreements.update(items =>
        items.map(a => (a.id === agreementId ? { ...a, attachmentUrl: url, attachmentPath: path } : a))
      );
      return url;
    } finally {
      this._uploading.set(false);
    }
  }

  async parseAttachment(agreement: Agreement): Promise<void> {
    if (!agreement.attachmentUrl || !agreement.attachmentPath) {
      throw new Error('缺少附件，無法解析');
    }

    const storageRef = this.firebase.storageRef(agreement.attachmentPath);
    const bucket: string | undefined = (storageRef as any).bucket;
    const gcsUri = bucket ? `gs://${bucket}/${agreement.attachmentPath}` : null;

    if (!gcsUri) {
      throw new Error('無法取得檔案路徑');
    }

    // ✅ Use pre-created callable (already in injection context)
    const result = await this.processDocumentFromStorage({ gcsUri, mimeType: 'application/pdf' });
    
    const jsonString = JSON.stringify(result.data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const parsedPath = `agreements/${agreement.id}/parsed.json`;
    const parsedRef = this.firebase.storageRef(parsedPath);
    await uploadBytes(parsedRef, blob);
    const parsedUrl = await getDownloadURL(parsedRef);
    await this.repository.saveParsedJsonUrl(agreement.id, parsedUrl);

    this._agreements.update(items =>
      items.map(item => (item.id === agreement.id ? { ...item, parsedJsonUrl: parsedUrl } : item))
    );
  }

  async updateTitle(agreementId: string, title: string): Promise<void> {
    await this.repository.updateAgreement(agreementId, { title });
    this._agreements.update(items => items.map(a => (a.id === agreementId ? { ...a, title } : a)));
  }

  async deleteAgreement(agreementId: string): Promise<void> {
    await this.repository.deleteAgreement(agreementId);
    this._agreements.update(items => items.filter(a => a.id !== agreementId));
  }
}
