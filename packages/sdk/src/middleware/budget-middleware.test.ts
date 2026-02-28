import type { MiddlewareContext, MiddlewareResult } from '@prompt-os/shared';
import { describe, expect, it, vi } from 'vitest';
import { TokenBudgetExceededError } from '../errors.js';
import { createBudgetMiddleware } from './budget-middleware.js';

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

describe('createBudgetMiddleware', () => {
  it('passes through when under budget', async () => {
    const next = vi.fn().mockResolvedValue(mockResult);
    const middleware = createBudgetMiddleware({ maxInputTokens: 1000 }, false, 'none');
    const ctx = createContext('Hello');

    await middleware(ctx, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(ctx.metadata.budgetEnforced).toBe(false);
  });

  it('passes through when no maxInputTokens', async () => {
    const next = vi.fn().mockResolvedValue(mockResult);
    const middleware = createBudgetMiddleware({}, false, 'none');
    const ctx = createContext('word '.repeat(500));

    await middleware(ctx, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('throws when over budget without compression', async () => {
    const next = vi.fn().mockResolvedValue(mockResult);
    const middleware = createBudgetMiddleware({ maxInputTokens: 10 }, false, 'none');
    const ctx = createContext('word '.repeat(500));

    await expect(middleware(ctx, next)).rejects.toThrow(TokenBudgetExceededError);
    expect(next).not.toHaveBeenCalled();
  });

  it('compresses and continues when over budget with compression', async () => {
    const next = vi.fn().mockResolvedValue(mockResult);
    const middleware = createBudgetMiddleware({ maxInputTokens: 50 }, true, 'trim');
    const ctx = createContext('word '.repeat(500));

    await middleware(ctx, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(ctx.metadata.budgetEnforced).toBe(true);
    expect(ctx.metadata.compressed).toBe(true);
  });
});
