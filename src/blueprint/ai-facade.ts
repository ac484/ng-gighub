// AI Facade - lightweight TypeScript skeleton for blueprint-level AI calls
// Purpose: provide a single-place interface for calling backend AI functions
// - All concrete calls MUST go through backend Firebase Functions (callable functions)
// - Frontend must not embed keys or call external AI endpoints directly
// - Follow project conventions: use `inject()` for DI and Result pattern for return values

import { inject } from '@angular/core';

// Minimal Result type used across the project (replace with project's Result if exists)
export type Result<T, E = unknown> = { ok: true; value: T } | { ok: false; error: E };

export interface AICallOptions {
  workspaceId?: string;
  userId?: string;
  redact?: boolean; // whether facade should attempt client-side redaction hints
}

export type AIFacade = {
  // call a text generation model, returns redacted summary and metadata
  generateText: (prompt: string, opts?: AICallOptions) => Promise<Result<{ text: string; model: string; costEstimate?: number }>>;
  // request OCR/Document extraction via functions-ai-document
  extractDocument: (gcsUri: string, opts?: AICallOptions) => Promise<Result<{ summary: string; entities?: Record<string, any> }>>;
};

// NOTE: This file contains a facade skeleton only. Concrete implementations should live
// in backend callable functions and adapters in `ai-facade/adapters/`.

export const createAIFacade = (): AIFacade => {
  // Example: adapters should be injected here. Keep frontend thin — only validation/context.
  // Replace the below stubs with calls to a thin adapter that calls callable functions.

  async function generateText(prompt: string, opts: AICallOptions = {}) {
    if (!prompt || prompt.trim().length === 0) {
      return { ok: false, error: new Error('empty prompt') } as const;
    }

    // Client-side hints: minimal validation and redaction note. Do NOT perform final redaction here.
    const safePrompt = prompt;

    try {
      // TODO: call adapter.callGenerate({ prompt: safePrompt, context: opts })
      // This placeholder demonstrates the return shape expected from backend
      const response = {
        text: '<<generated text (redacted) >>',
        model: 'example-model-v1',
        costEstimate: 0.001
      };

      return { ok: true, value: response } as const;
    } catch (err) {
      return { ok: false, error: err } as const;
    }
  }

  async function extractDocument(gcsUri: string, opts: AICallOptions = {}) {
    if (!gcsUri) return { ok: false, error: new Error('missing uri') } as const;
    try {
      // TODO: call adapter.callExtractDocument({ gcsUri, context: opts })
      const response = { summary: 'extracted summary', entities: {} };
      return { ok: true, value: response } as const;
    } catch (err) {
      return { ok: false, error: err } as const;
    }
  }

  return {
    generateText,
    extractDocument
  };
};

// export a default instance for simple uses; prefer creating per-request instances in services
export const aiFacade = createAIFacade();

// Implementation notes:
// - Implement adapters in `src/blueprint/ai-facade/adapters/` that wrap callable functions.
// - Backend functions must enforce model pinning, redaction, quota, audit, and cost accounting.
// - Treat all AI outputs as untrusted input: validate and sanitize before storing or acting on them.
