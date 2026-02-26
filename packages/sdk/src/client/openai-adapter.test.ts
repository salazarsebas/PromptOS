import type { MiddlewareContext, MiddlewareResult } from '@promptos/shared';
import { describe, expect, it, vi } from 'vitest';
import { createOpenAIAdapter, createOpenAITerminalMiddleware } from './openai-adapter.js';

function createMockOpenAIClient() {
  return {
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          id: 'chatcmpl-123',
          choices: [{ message: { role: 'assistant', content: 'Hello!' } }],
        }),
      },
    },
  };
}

function createMockPipeline(): import('@promptos/shared').MiddlewareNext {
  return vi.fn().mockImplementation(
    async (ctx: MiddlewareContext): Promise<MiddlewareResult> => ({
      response: { choices: [{ message: { content: 'pipeline response' } }] },
      metadata: ctx.metadata,
    }),
  );
}

describe('createOpenAIAdapter', () => {
  it('creates a proxy that intercepts chat.completions.create', async () => {
    const pipeline = createMockPipeline();
    const client = createMockOpenAIClient();
    const proxy = createOpenAIAdapter(client, pipeline) as typeof client;

    const result = await proxy.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: 'Hello' }],
    });

    expect(pipeline).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ choices: [{ message: { content: 'pipeline response' } }] });
  });

  it('passes model to pipeline context', async () => {
    const pipeline = createMockPipeline();
    const client = createMockOpenAIClient();
    const proxy = createOpenAIAdapter(client, pipeline) as typeof client;

    await proxy.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'Hi' }],
    });

    const calledCtx = (pipeline as ReturnType<typeof vi.fn>).mock
      .calls[0]?.[0] as MiddlewareContext;
    expect(calledCtx.model).toBe('gpt-4o-mini');
    expect(calledCtx.provider).toBe('openai');
  });

  it('bypasses pipeline for streaming requests', async () => {
    const pipeline = createMockPipeline();
    const client = createMockOpenAIClient();
    const proxy = createOpenAIAdapter(client, pipeline) as typeof client;

    const result = await proxy.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: 'Hi' }],
      stream: true,
    });

    expect(pipeline).not.toHaveBeenCalled();
    expect(result).toHaveProperty('id', 'chatcmpl-123');
  });
});

describe('createOpenAITerminalMiddleware', () => {
  it('creates a middleware that calls the client', async () => {
    const client = createMockOpenAIClient();
    const middleware = createOpenAITerminalMiddleware(client);

    const ctx: MiddlewareContext = {
      provider: 'openai',
      model: 'gpt-4o',
      messages: [{ role: 'user', content: 'Hello' }],
      originalRequest: { model: 'gpt-4o' },
      metadata: {
        cacheHit: false,
        compressed: false,
        originalTokenCount: 1,
        finalTokenCount: 1,
        budgetEnforced: false,
      },
    };

    const result = await middleware(ctx, vi.fn());
    expect(result.response).toHaveProperty('id', 'chatcmpl-123');
    expect(client.chat.completions.create).toHaveBeenCalledTimes(1);
  });
});
