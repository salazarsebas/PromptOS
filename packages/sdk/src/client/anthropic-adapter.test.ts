import type { MiddlewareContext, MiddlewareResult } from '@promptos/shared';
import { describe, expect, it, vi } from 'vitest';
import { createAnthropicAdapter, createAnthropicTerminalMiddleware } from './anthropic-adapter.js';

function createMockAnthropicClient() {
  return {
    messages: {
      create: vi.fn().mockResolvedValue({
        id: 'msg-123',
        content: [{ type: 'text', text: 'Hello from Claude!' }],
        role: 'assistant',
      }),
    },
  };
}

function createMockPipeline(): import('@promptos/shared').MiddlewareNext {
  return vi.fn().mockImplementation(
    async (ctx: MiddlewareContext): Promise<MiddlewareResult> => ({
      response: { content: [{ type: 'text', text: 'pipeline response' }] },
      metadata: ctx.metadata,
    }),
  );
}

describe('createAnthropicAdapter', () => {
  it('creates a proxy that intercepts messages.create', async () => {
    const pipeline = createMockPipeline();
    const client = createMockAnthropicClient();
    const proxy = createAnthropicAdapter(client, pipeline) as typeof client;

    const result = await proxy.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      messages: [{ role: 'user', content: 'Hello' }],
    });

    expect(pipeline).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      content: [{ type: 'text', text: 'pipeline response' }],
    });
  });

  it('normalizes system param to system message', async () => {
    const pipeline = createMockPipeline();
    const client = createMockAnthropicClient();
    const proxy = createAnthropicAdapter(client, pipeline) as typeof client;

    await proxy.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      system: 'You are helpful.',
      messages: [{ role: 'user', content: 'Hello' }],
    });

    const calledCtx = (pipeline as ReturnType<typeof vi.fn>).mock
      .calls[0]?.[0] as MiddlewareContext;
    expect(calledCtx.messages[0]).toEqual({
      role: 'system',
      content: 'You are helpful.',
    });
    expect(calledCtx.provider).toBe('anthropic');
  });

  it('bypasses pipeline for streaming requests', async () => {
    const pipeline = createMockPipeline();
    const client = createMockAnthropicClient();
    const proxy = createAnthropicAdapter(client, pipeline) as typeof client;

    const result = await proxy.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      messages: [{ role: 'user', content: 'Hi' }],
      stream: true,
    });

    expect(pipeline).not.toHaveBeenCalled();
    expect(result).toHaveProperty('id', 'msg-123');
  });
});

describe('createAnthropicTerminalMiddleware', () => {
  it('creates a middleware that calls the client', async () => {
    const client = createMockAnthropicClient();
    const middleware = createAnthropicTerminalMiddleware(client);

    const ctx: MiddlewareContext = {
      provider: 'anthropic',
      model: 'claude-sonnet-4-5',
      messages: [
        { role: 'system', content: 'Be helpful.' },
        { role: 'user', content: 'Hello' },
      ],
      originalRequest: { model: 'claude-sonnet-4-5' },
      metadata: {
        cacheHit: false,
        compressed: false,
        originalTokenCount: 1,
        finalTokenCount: 1,
        budgetEnforced: false,
      },
    };

    const result = await middleware(ctx, vi.fn());
    expect(result.response).toHaveProperty('id', 'msg-123');
    expect(client.messages.create).toHaveBeenCalledTimes(1);

    // Verify system is extracted to top-level
    const callArgs = client.messages.create.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(callArgs.system).toBe('Be helpful.');
  });

  it('sets default max_tokens when not provided', async () => {
    const client = createMockAnthropicClient();
    const middleware = createAnthropicTerminalMiddleware(client);

    const ctx: MiddlewareContext = {
      provider: 'anthropic',
      model: 'claude-sonnet-4-5',
      messages: [{ role: 'user', content: 'Hello' }],
      originalRequest: { model: 'claude-sonnet-4-5' },
      metadata: {
        cacheHit: false,
        compressed: false,
        originalTokenCount: 1,
        finalTokenCount: 1,
        budgetEnforced: false,
      },
    };

    await middleware(ctx, vi.fn());
    const callArgs = client.messages.create.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(callArgs.max_tokens).toBe(4096);
  });
});
