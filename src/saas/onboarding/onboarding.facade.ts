/**
 * Onboarding facade — entrypoints to start and query onboarding flows.
 */

import type { Result } from '../saas.facade';

export const onboardingFacade = {
  async startFlow(flowId: string): Promise<Result<{ flowId: string; startedAt: string }>> {
    try {
      if (!flowId) return { ok: false, error: 'flowId-required' };
      return { ok: true, value: { flowId, startedAt: new Date().toISOString() } };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  }
};
