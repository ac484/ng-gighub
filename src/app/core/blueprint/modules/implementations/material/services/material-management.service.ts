/**
 * MaterialManagement Service
 * Sub-module of Material Domain
 */

import { Injectable, signal, inject } from '@angular/core';

import { MaterialRepository } from '../repositories/material.repository';

@Injectable({ providedIn: 'root' })
export class MaterialManagementService {
  private repository = inject(MaterialRepository);

  // Signals
  data = signal<any[]>([]);
  loading = signal(false);
  error = signal<Error | null>(null);

  /**
   * Load data
   */
  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const result = await this.repository.findAll();
      this.data.set(result);
    } catch (err) {
      this.error.set(err as Error);
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Clear state
   */
  clearState(): void {
    this.data.set([]);
    this.error.set(null);
  }
}
