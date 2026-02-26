import type { MiddlewareContext, MiddlewareResult } from '@promptos/shared';
import { describe, expect, it, vi } from 'vitest';
import { createCacheMiddleware } from './cache-middleware.js';

function createContext(): MiddlewareContext {
  return {
    provider: 'openai',
    model: 'gpt-4o',
    messages: [{ role: 'user', content: 'Hello' }],
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
  response: { choices: [{ message: { content: 'Hi' } }] },
  metadata: {
    cacheHit: false,
    compressed: false,
    originalTokenCount: 1,
    finalTokenCount: 1,
    budgetEnforced: false,
  },
};

describe('createCacheMiddleware', () => {
  it('calls next on cache miss and stores result', async () => {
    const next = vi.fn().mockResolvedValue(mockResult);
    const middleware = createCacheMiddleware({ enabled: true, ttlMs: 5000 });

    const result = await middleware(createContext(), next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(result.response).toEqual(mockResult.response);
  });

  it('returns cached result on second call', async () => {
    const next = vi.fn().mockResolvedValue(mockResult);
    const middleware = createCacheMiddleware({ enabled: true, ttlMs: 5000 });

    await middleware(createContext(), next);
    const result = await middleware(createContext(), next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(result.metadata.cacheHit).toBe(true);
  });

  it('passes through when disabled', async () => {
    const next = vi.fn().mockResolvedValue(mockResult);
    const middleware = createCacheMiddleware({ enabled: false });

    await middleware(createContext(), next);
    await middleware(createContext(), next);

    expect(next).toHaveBeenCalledTimes(2);
  });

  it('caches different results for different messages', async () => {
    let callCount = 0;
    const next = vi.fn().mockImplementation(async () => ({
      ...mockResult,
      response: { id: ++callCount },
    }));
    const middleware = createCacheMiddleware({ enabled: true });

    const ctx1 = createContext();
    const ctx2 = createContext();
    ctx2.messages = [{ role: 'user', content: 'Different' }];

    await middleware(ctx1, next);
    await middleware(ctx2, next);

    expect(next).toHaveBeenCalledTimes(2);
  });
});
