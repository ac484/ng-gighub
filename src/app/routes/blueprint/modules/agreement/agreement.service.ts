import { Injectable, inject, signal } from '@angular/core';
import { Agreement } from './agreement.model';
import { AgreementRepository } from './agreement.repository';
import { FirebaseService } from '@core/services/firebase.service';
import { getDownloadURL, uploadBytes } from '@angular/fire/storage';

@Injectable({ providedIn: 'root' })
export class AgreementService {
  private readonly repository = inject(AgreementRepository);
  private readonly firebase = inject(FirebaseService);

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

  async createAgreement(blueprintId: string): Promise<void> {
    const created = await this.repository.createAgreement({ blueprintId });
    this._agreements.update(items => [created, ...items]);
  }

  async uploadAttachment(blueprintId: string, agreementId: string, file: File): Promise<string> {
    this._uploading.set(true);
    try {
      const path = `agreements/${agreementId}/${file.name}`;
      const storageRef = this.firebase.storageRef(path);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await this.repository.saveAttachmentUrl(agreementId, url);
      this._agreements.update(items => items.map(a => (a.id === agreementId ? { ...a, attachmentUrl: url } : a)));
      return url;
    } finally {
      this._uploading.set(false);
    }
  }
}
