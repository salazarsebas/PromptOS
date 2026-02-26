import { describe, expect, it, vi } from 'vitest';
import { createRouter } from './create-router.js';
import { AllProvidersFailedError, NoProvidersConfiguredError, RouterError } from './errors.js';
import { ProviderExecutor } from './executor/provider-executor.js';
import { Router } from './router.js';
import type { RouterConfig, RouterProvider } from './types.js';

function mockExecutor(responses: Map<RouterProvider, { content: string; model: string }>) {
  const executor = new ProviderExecutor(vi.fn());
  vi.spyOn(executor, 'execute').mockImplementation(async (provider, _config, _params) => {
    const resp = responses.get(provider);
    if (!resp) throw new Error(`${provider} unavailable`);
    return {
      content: resp.content,
      model: resp.model,
      provider,
      usage: { inputTokens: 10, outputTokens: 5 },
    };
  });
  return executor;
}

function failingExecutor(
  failProvider: RouterProvider,
  responses: Map<RouterProvider, { content: string; model: string }>,
) {
  const executor = new ProviderExecutor(vi.fn());
  vi.spyOn(executor, 'execute').mockImplementation(async (provider, _config, _params) => {
    if (provider === failProvider) throw new Error('rate limited');
    const resp = responses.get(provider);
    if (!resp) throw new Error(`${provider} unavailable`);
    return {
      content: resp.content,
      model: resp.model,
      provider,
      usage: { inputTokens: 10, outputTokens: 5 },
    };
  });
  return executor;
}

const baseConfig: RouterConfig = {
  providers: {
    openai: { apiKey: 'sk-test' },
    anthropic: { apiKey: 'sk-ant-test' },
  },
  routing: { strategy: 'cost-optimized', fallbackChain: ['openai', 'anthropic'] },
};

describe('Router', () => {
  it('throws NoProvidersConfiguredError when no providers', () => {
    expect(() => new Router({ providers: {}, routing: { strategy: 'balanced' } })).toThrow(
      NoProvidersConfiguredError,
    );
  });

  it('routes a simple message to the correct model', async () => {
    const executor = mockExecutor(
      new Map<RouterProvider, { content: string; model: string }>([
        ['openai', { content: 'Hi!', model: 'gpt-4o-mini' }],
      ]),
    );
    const router = new Router(baseConfig, executor);

    const result = await router.complete({
      messages: [{ role: 'user', content: 'Hello' }],
    });

    expect(result.content).toBe('Hi!');
    expect(result.provider).toBe('openai');
    expect(result.routing.complexity.level).toBe('simple');
    expect(result.routing.attempts).toHaveLength(1);
    expect(result.routing.totalLatencyMs).toBeGreaterThanOrEqual(0);
  });

  it('falls back to second provider on failure', async () => {
    const executor = failingExecutor(
      'openai',
      new Map<RouterProvider, { content: string; model: string }>([
        ['anthropic', { content: 'Fallback!', model: 'claude-haiku-4-5' }],
      ]),
    );
    const router = new Router(baseConfig, executor);

    const result = await router.complete({
      messages: [{ role: 'user', content: 'Hello' }],
    });

    expect(result.content).toBe('Fallback!');
    expect(result.provider).toBe('anthropic');
    expect(result.routing.attempts).toHaveLength(2);
    expect(result.routing.attempts[0]?.success).toBe(false);
    expect(result.routing.attempts[1]?.success).toBe(true);
  });

  it('throws AllProvidersFailedError when all providers fail', async () => {
    const executor = new ProviderExecutor(vi.fn());
    vi.spyOn(executor, 'execute').mockRejectedValue(new Error('down'));
    const router = new Router(baseConfig, executor);

    await expect(router.complete({ messages: [{ role: 'user', content: 'Hi' }] })).rejects.toThrow(
      AllProvidersFailedError,
    );
  });

  it('records health when all providers fail (B1)', async () => {
    const executor = new ProviderExecutor(vi.fn());
    vi.spyOn(executor, 'execute').mockRejectedValue(new Error('down'));
    const router = new Router(baseConfig, executor);

    try {
      await router.complete({ messages: [{ role: 'user', content: 'Hi' }] });
    } catch {}

    const openaiHealth = router.getHealthStatus('openai');
    expect(openaiHealth.totalRequests).toBeGreaterThan(0);
    expect(openaiHealth.successRate).toBe(0);

    const anthropicHealth = router.getHealthStatus('anthropic');
    expect(anthropicHealth.totalRequests).toBeGreaterThan(0);
    expect(anthropicHealth.successRate).toBe(0);
  });

  it('throws RouterError when messages array is empty (Q1)', async () => {
    const executor = mockExecutor(new Map());
    const router = new Router(baseConfig, executor);

    await expect(router.complete({ messages: [] })).rejects.toThrow(RouterError);
    await expect(router.complete({ messages: [] })).rejects.toThrow('messages must not be empty');
  });

  it('records health after requests', async () => {
    const executor = failingExecutor(
      'openai',
      new Map<RouterProvider, { content: string; model: string }>([
        ['anthropic', { content: 'ok', model: 'claude-haiku-4-5' }],
      ]),
    );
    const router = new Router(baseConfig, executor);

    await router.complete({ messages: [{ role: 'user', content: 'Hi' }] });

    const openaiHealth = router.getHealthStatus('openai');
    expect(openaiHealth.successRate).toBe(0);

    const anthropicHealth = router.getHealthStatus('anthropic');
    expect(anthropicHealth.successRate).toBe(1);
  });

  it('respects explicit model override', async () => {
    const executor = mockExecutor(
      new Map<RouterProvider, { content: string; model: string }>([
        ['openai', { content: 'ok', model: 'gpt-4o' }],
      ]),
    );
    const router = new Router(baseConfig, executor);

    const result = await router.complete({
      messages: [{ role: 'user', content: 'Hi' }],
      model: 'gpt-4o',
      provider: 'openai',
    });

    expect(result.model).toBe('gpt-4o');
    expect(result.routing.attempts).toHaveLength(1);
  });

  it('resets health', async () => {
    const executor = new ProviderExecutor(vi.fn());
    vi.spyOn(executor, 'execute').mockRejectedValue(new Error('down'));
    const router = new Router(baseConfig, executor);

    try {
      await router.complete({ messages: [{ role: 'user', content: 'Hi' }] });
    } catch {}

    router.resetHealth('openai');
    expect(router.getHealthStatus('openai').totalRequests).toBe(0);
  });

  it('cost-optimized picks cheap model for simple requests', async () => {
    const executor = mockExecutor(
      new Map<RouterProvider, { content: string; model: string }>([
        ['openai', { content: 'ok', model: 'gpt-4o-mini' }],
      ]),
    );
    const config: RouterConfig = {
      providers: { openai: { apiKey: 'sk-test' } },
      routing: { strategy: 'cost-optimized' },
    };
    const router = new Router(config, executor);

    const result = await router.complete({
      messages: [{ role: 'user', content: 'Hello' }],
    });

    expect(result.routing.complexity.level).toBe('simple');
    // gpt-4o-mini is the expected model for cost-optimized + simple + openai
    expect(executor.execute).toHaveBeenCalledWith(
      'openai',
      expect.anything(),
      expect.objectContaining({ model: 'gpt-4o-mini' }),
    );
  });
});

describe('createRouter', () => {
  it('returns a Router instance', () => {
    const router = createRouter(baseConfig);
    expect(router).toBeInstanceOf(Router);
  });
});
