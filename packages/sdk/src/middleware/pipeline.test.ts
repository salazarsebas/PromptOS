import type { Middleware, MiddlewareContext, MiddlewareResult } from '@promptos/shared';
import { describe, expect, it } from 'vitest';
import { compose } from './pipeline.js';

function createContext(overrides: Partial<MiddlewareContext> = {}): MiddlewareContext {
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
    ...overrides,
  };
}

const terminalResult: MiddlewareResult = {
  response: { choices: [{ message: { content: 'Hi' } }] },
  metadata: {
    cacheHit: false,
    compressed: false,
    originalTokenCount: 1,
    finalTokenCount: 1,
    budgetEnforced: false,
  },
};

describe('compose', () => {
  it('executes middlewares in order', async () => {
    const order: number[] = [];

    const mw1: Middleware = async (ctx, next) => {
      order.push(1);
      const result = await next(ctx);
      order.push(4);
      return result;
    };

    const mw2: Middleware = async (ctx, next) => {
      order.push(2);
      const result = await next(ctx);
      order.push(3);
      return result;
    };

    const terminal: Middleware = async (_ctx) => {
      order.push(99);
      return terminalResult;
    };

    const pipeline = compose([mw1, mw2, terminal]);
    await pipeline(createContext());

    expect(order).toEqual([1, 2, 99, 3, 4]);
  });

  it('allows early return (cache hit pattern)', async () => {
    const cachedResult: MiddlewareResult = {
      response: { cached: true },
      metadata: { ...terminalResult.metadata, cacheHit: true },
    };

    const cacheMiddleware: Middleware = async () => cachedResult;

    const shouldNotRun: Middleware = async (_ctx, _next) => {
      throw new Error('Should not be called');
    };

    const pipeline = compose([cacheMiddleware, shouldNotRun]);
    const result = await pipeline(createContext());

    expect(result.response).toEqual({ cached: true });
    expect(result.metadata.cacheHit).toBe(true);
  });

  it('passes modified context downstream', async () => {
    const modifier: Middleware = async (ctx, next) => {
      ctx.messages = [{ role: 'user', content: 'Modified' }];
      return next(ctx);
    };

    const terminal: Middleware = async (ctx) => ({
      response: { content: ctx.messages[0]?.content },
      metadata: terminalResult.metadata,
    });

    const pipeline = compose([modifier, terminal]);
    const result = await pipeline(createContext());

    expect((result.response as { content: string }).content).toBe('Modified');
  });

  it('rejects if next() called multiple times', async () => {
    const badMiddleware: Middleware = async (ctx, next) => {
      await next(ctx);
      return next(ctx);
    };

    const terminal: Middleware = async () => terminalResult;

    const pipeline = compose([badMiddleware, terminal]);
    await expect(pipeline(createContext())).rejects.toThrow('next() called multiple times');
  });
});
