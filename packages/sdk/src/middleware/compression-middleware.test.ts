import type { MiddlewareContext, MiddlewareResult } from '@promptos/shared';
import { describe, expect, it, vi } from 'vitest';
import { createCompressionMiddleware } from './compression-middleware.js';

function createContext(content = 'Hello'): MiddlewareContext {
  return {
    provider: 'openai',
    model: 'gpt-4o',
    messages: [{ role: 'user', content }],
    originalRequest: {},
    metadata: {
      cacheHit: false,
      compressed: false,
      originalTokenCount: 0,
      finalTokenCount: 0,
      budgetEnforced: false,
    },
  };
}

const mockResult: MiddlewareResult = {
  response: { ok: true },
  metadata: {
    cacheHit: false,
    compressed: false,
    originalTokenCount: 0,
    finalTokenCount: 0,
    budgetEnforced: false,
  },
};

describe('createCompressionMiddleware', () => {
  it('passes through when disabled', async () => {
    const next = vi.fn().mockResolvedValue(mockResult);
    const middleware = createCompressionMiddleware({ enabled: false }, 50);
    const ctx = createContext('word '.repeat(500));

    await middleware(ctx, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(ctx.metadata.compressed).toBe(false);
  });

  it('passes through when no maxTokens', async () => {
    const next = vi.fn().mockResolvedValue(mockResult);
    const middleware = createCompressionMiddleware({ enabled: true });
    const ctx = createContext('word '.repeat(500));

    await middleware(ctx, next);
    expect(ctx.metadata.compressed).toBe(false);
  });

  it('compresses long messages', async () => {
    const next = vi.fn().mockResolvedValue(mockResult);
    const middleware = createCompressionMiddleware({ enabled: true, strategy: 'trim' }, 50);
    const ctx = createContext('word '.repeat(500));

    await middleware(ctx, next);
    expect(ctx.metadata.compressed).toBe(true);
    expect(ctx.metadata.finalTokenCount).toBeLessThanOrEqual(50);
    expect(ctx.metadata.originalTokenCount).toBeGreaterThan(50);
  });

  it('does not compress short messages', async () => {
    const next = vi.fn().mockResolvedValue(mockResult);
    const middleware = createCompressionMiddleware({ enabled: true, strategy: 'trim' }, 1000);
    const ctx = createContext('Hello');

    await middleware(ctx, next);
    expect(ctx.metadata.compressed).toBe(false);
  });
});
