/**
 * GroupMessage Service
 * Sub-module of Communication Domain
 */

import { Injectable, signal, inject } from '@angular/core';

import { CommunicationRepository } from '../repositories/communication.repository';

@Injectable({ providedIn: 'root' })
export class GroupMessageService {
  private repository = inject(CommunicationRepository);

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
