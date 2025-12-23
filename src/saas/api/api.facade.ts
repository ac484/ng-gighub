/**
 * API facade: thin, testable entrypoints for API-level operations used by
 * Cloud Functions or local test runners. Keep logic minimal here; use
 * repositories and controllers for implementation.
 */

import type { Result } from '../saas.facade';

export const apiFacade = {
  /**
   * Simple health check used by functions or integration tests.
   */
  async health(): Promise<Result<{ status: 'ok' }>> {
    try {
      return { ok: true, value: { status: 'ok' } };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  }
};
