import { describe, expect, it, vi } from 'vitest';
import { AllProvidersFailedError } from '../errors.js';
import type { ResolvedRoute } from '../strategy/strategy-resolver.js';
import type { ProviderCallFn } from './fallback-executor.js';
import { executeFallbackChain } from './fallback-executor.js';

function route(provider: 'openai' | 'anthropic', model = 'gpt-4o'): ResolvedRoute {
  return { provider, model };
}

function successCall(content = 'ok'): ProviderCallFn {
  return async (r) => ({
    content,
    model: r.model,
    provider: r.provider,
    usage: { inputTokens: 10, outputTokens: 5 },
  });
}

function failCall(message = 'API error'): ProviderCallFn {
  return async () => {
    throw new Error(message);
  };
}

const noDelay = async () => {};

describe('executeFallbackChain', () => {
  it('returns immediately on first success', async () => {
    const routes = [route('openai'), route('anthropic')];
    const callFn = vi.fn(successCall('hello'));

    const { result, attempts } = await executeFallbackChain(routes, callFn, noDelay);

    expect(result.content).toBe('hello');
    expect(result.provider).toBe('openai');
    expect(attempts).toHaveLength(1);
    expect(attempts[0]?.success).toBe(true);
    expect(callFn).toHaveBeenCalledTimes(1);
  });

  it('falls back to second provider on first failure', async () => {
    const routes = [route('openai'), route('anthropic', 'claude-sonnet-4-5')];
    let callCount = 0;
    const callFn: ProviderCallFn = async (r) => {
      callCount++;
      if (callCount === 1) throw new Error('rate limited');
      return { content: 'fallback', model: r.model, provider: r.provider };
    };

    const { result, attempts } = await executeFallbackChain(routes, callFn, noDelay);

    expect(result.content).toBe('fallback');
    expect(result.provider).toBe('anthropic');
    expect(attempts).toHaveLength(2);
    expect(attempts[0]?.success).toBe(false);
    expect(attempts[0]?.error).toBe('rate limited');
    expect(attempts[1]?.success).toBe(true);
  });

  it('throws AllProvidersFailedError when all fail', async () => {
    const routes = [route('openai'), route('anthropic')];
    const callFn = failCall('server error');

    await expect(executeFallbackChain(routes, callFn, noDelay)).rejects.toThrow(
      AllProvidersFailedError,
    );

    try {
      await executeFallbackChain(routes, callFn, noDelay);
    } catch (err) {
      expect(err).toBeInstanceOf(AllProvidersFailedError);
      const typed = err as InstanceType<typeof AllProvidersFailedError>;
      expect(typed.attempts).toHaveLength(2);
      expect(typed.attempts[0]?.provider).toBe('openai');
      expect(typed.attempts[1]?.provider).toBe('anthropic');
    }
  });

  it('calls delay between failures', async () => {
    const routes = [route('openai'), route('anthropic')];
    const delays: number[] = [];
    const delayFn = async (ms: number) => {
      delays.push(ms);
    };
    let callCount = 0;
    const callFn: ProviderCallFn = async (r) => {
      callCount++;
      if (callCount === 1) throw new Error('fail');
      return { content: 'ok', model: r.model, provider: r.provider };
    };

    await executeFallbackChain(routes, callFn, delayFn);

    expect(delays).toHaveLength(1);
    // First attempt backoff: base 500ms ± 25% jitter → [375, 625]
    expect(delays[0]).toBeGreaterThanOrEqual(375);
    expect(delays[0]).toBeLessThanOrEqual(625);
  });

  it('does not delay after the last failure', async () => {
    const routes = [route('openai')];
    const delays: number[] = [];
    const delayFn = async (ms: number) => {
      delays.push(ms);
    };

    await expect(executeFallbackChain(routes, failCall(), delayFn)).rejects.toThrow(
      AllProvidersFailedError,
    );

    expect(delays).toHaveLength(0);
  });

  it('escalates backoff with 3+ routes', async () => {
    const routes = [
      route('openai'),
      route('anthropic', 'claude-sonnet-4-5'),
      route('openai', 'gpt-4o-mini'),
    ];
    const delays: number[] = [];
    const delayFn = async (ms: number) => {
      delays.push(ms);
    };
    let callCount = 0;
    const callFn: ProviderCallFn = async (r) => {
      callCount++;
      if (callCount <= 2) throw new Error('fail');
      return { content: 'ok', model: r.model, provider: r.provider };
    };

    const { result, attempts } = await executeFallbackChain(routes, callFn, delayFn);

    expect(result.content).toBe('ok');
    expect(attempts).toHaveLength(3);
    expect(delays).toHaveLength(2);
    // Second delay should be larger than first (exponential backoff)
    const firstDelay = delays[0] ?? 0;
    const secondDelay = delays[1] ?? 0;
    expect(secondDelay).toBeGreaterThan(firstDelay * 1.5);
  });

  it('records latency in attempts', async () => {
    const routes = [route('openai')];
    const { attempts } = await executeFallbackChain(routes, successCall(), noDelay);

    expect(attempts[0]?.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it('handles single route success', async () => {
    const routes = [route('anthropic', 'claude-haiku-4-5')];
    const { result, attempts } = await executeFallbackChain(routes, successCall(), noDelay);

    expect(result.provider).toBe('anthropic');
    expect(attempts).toHaveLength(1);
  });

  it('preserves usage data', async () => {
    const routes = [route('openai')];
    const { result } = await executeFallbackChain(routes, successCall(), noDelay);

    expect(result.usage).toEqual({ inputTokens: 10, outputTokens: 5 });
  });
});
