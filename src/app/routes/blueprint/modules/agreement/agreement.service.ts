import { Injectable, inject, signal } from '@angular/core';
import { Agreement } from './agreement.model';
import { AgreementRepository } from './agreement.repository';

@Injectable({ providedIn: 'root' })
export class AgreementService {
  private readonly repository = inject(AgreementRepository);

  private readonly _agreements = signal<Agreement[]>([]);
  private readonly _loading = signal(false);

  readonly agreements = this._agreements.asReadonly();
  readonly loading = this._loading.asReadonly();

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
}
