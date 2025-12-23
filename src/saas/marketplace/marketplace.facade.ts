/**
 * Marketplace facade — exposes a small surface area for marketplace features
 * (plugins, registry, sandbox). Implementation belongs to submodules.
 */

import type { Result } from '../saas.facade';

export const marketplaceFacade = {
  async listPlugins(): Promise<Result<Array<{ id: string; name: string }>>> {
    try {
      // Placeholder: real data comes from registry repository or functions.
      return { ok: true, value: [{ id: 'example', name: 'Example Plugin' }] };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  },

  async getPlugin(id: string): Promise<Result<{ id: string; name: string } | null>> {
    try {
      if (!id) return { ok: false, error: 'id-required' };
      return { ok: true, value: { id, name: `Plugin ${id}` } };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  }
};
