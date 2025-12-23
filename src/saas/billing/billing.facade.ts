/**
 * Billing facade — expose tiny surface for billing operations.
 * Real billing operations should be implemented via secure Cloud Functions
 * or backend services. Frontend should not contain secret keys.
 */

import type { Result } from '../saas.facade';

export const billingFacade = {
  async getPlans(): Promise<Result<Array<{ id: string; name: string; priceCents: number }>>> {
    try {
      return { ok: true, value: [{ id: 'free', name: 'Free', priceCents: 0 }] };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  }
};
