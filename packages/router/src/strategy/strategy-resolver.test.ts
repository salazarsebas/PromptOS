import { describe, expect, it } from 'vitest';
import type {
  ComplexityResult,
  HealthStatus,
  RouterConfig,
  RouterProvider,
  RouterRequest,
} from '../types.js';
import { resolveRoute } from './strategy-resolver.js';

function makeConfig(overrides: Partial<RouterConfig> = {}): RouterConfig {
  return {
    providers: {
      openai: { apiKey: 'sk-test' },
      anthropic: { apiKey: 'sk-ant-test' },
    },
    routing: { strategy: 'cost-optimized' },
    ...overrides,
  };
}

function makeRequest(overrides: Partial<RouterRequest> = {}): RouterRequest {
  return {
    messages: [{ role: 'user', content: 'Hello' }],
    ...overrides,
  };
}

function makeComplexity(level: 'simple' | 'moderate' | 'complex' = 'simple'): ComplexityResult {
  return {
    level,
    signals: {
      tokenCount: 10,
      messageCount: 1,
      hasSystemPrompt: false,
      hasMultiTurn: false,
      keywordComplexity: 0.5,
    },
    confidence: 0.8,
  };
}

function healthyStatus(provider: RouterProvider): HealthStatus {
  return { provider, healthy: true, successRate: 1, totalRequests: 10, windowStart: Date.now() };
}

function unhealthyStatus(provider: RouterProvider): HealthStatus {
  return { provider, healthy: false, successRate: 0.3, totalRequests: 10, windowStart: Date.now() };
}

describe('resolveRoute', () => {
  it('returns routes for all configured providers', () => {
    const routes = resolveRoute(makeRequest(), makeComplexity(), makeConfig(), new Map());
    expect(routes).toHaveLength(2);
    expect(routes[0]?.provider).toBe('openai');
    expect(routes[1]?.provider).toBe('anthropic');
  });

  it('respects fallback chain order', () => {
    const config = makeConfig({
      routing: { strategy: 'cost-optimized', fallbackChain: ['anthropic', 'openai'] },
    });
    const routes = resolveRoute(makeRequest(), makeComplexity(), config, new Map());
    expect(routes[0]?.provider).toBe('anthropic');
    expect(routes[1]?.provider).toBe('openai');
  });

  it('returns single route for explicit provider + model', () => {
    const request = makeRequest({ provider: 'openai', model: 'gpt-4o' });
    const routes = resolveRoute(request, makeComplexity(), makeConfig(), new Map());
    expect(routes).toHaveLength(1);
    expect(routes[0]).toEqual({ provider: 'openai', model: 'gpt-4o' });
  });

  it('puts requested provider first', () => {
    const request = makeRequest({ provider: 'anthropic' });
    const routes = resolveRoute(request, makeComplexity(), makeConfig(), new Map());
    expect(routes[0]?.provider).toBe('anthropic');
  });

  it('filters out unhealthy providers', () => {
    const health = new Map<RouterProvider, HealthStatus>([
      ['openai', unhealthyStatus('openai')],
      ['anthropic', healthyStatus('anthropic')],
    ]);
    const routes = resolveRoute(makeRequest(), makeComplexity(), makeConfig(), health);
    expect(routes).toHaveLength(1);
    expect(routes[0]?.provider).toBe('anthropic');
  });

  it('keeps all providers if all are unhealthy', () => {
    const health = new Map<RouterProvider, HealthStatus>([
      ['openai', unhealthyStatus('openai')],
      ['anthropic', unhealthyStatus('anthropic')],
    ]);
    const routes = resolveRoute(makeRequest(), makeComplexity(), makeConfig(), health);
    expect(routes).toHaveLength(2);
  });

  it('selects correct model for complexity level', () => {
    const routes = resolveRoute(makeRequest(), makeComplexity('complex'), makeConfig(), new Map());
    expect(routes[0]?.model).toBe('gpt-4o');
    expect(routes[1]?.model).toBe('claude-sonnet-4-5');
  });

  it('uses explicit model override for all routes', () => {
    const request = makeRequest({ model: 'gpt-4o' });
    const routes = resolveRoute(request, makeComplexity(), makeConfig(), new Map());
    for (const route of routes) {
      expect(route.model).toBe('gpt-4o');
    }
  });

  it('works with single provider config', () => {
    const config = makeConfig({
      providers: { openai: { apiKey: 'sk-test' } },
      routing: { strategy: 'balanced' },
    });
    const routes = resolveRoute(makeRequest(), makeComplexity('moderate'), config, new Map());
    expect(routes).toHaveLength(1);
    expect(routes[0]).toEqual({ provider: 'openai', model: 'gpt-4o' });
  });

  it('request.provider not in configuredProviders still returns routes', () => {
    const config = makeConfig({
      providers: { openai: { apiKey: 'sk-test' } },
    });
    const request = makeRequest({ provider: 'anthropic' });
    const routes = resolveRoute(request, makeComplexity(), config, new Map());
    // anthropic isn't configured, so it gets prepended but openai is still there
    expect(routes.length).toBeGreaterThanOrEqual(1);
    expect(routes.some((r) => r.provider === 'openai')).toBe(true);
  });

  it('fallback chain ignores providers not in config', () => {
    const config = makeConfig({
      providers: { openai: { apiKey: 'sk-test' } },
      routing: { strategy: 'cost-optimized', fallbackChain: ['anthropic', 'openai'] },
    });
    const routes = resolveRoute(makeRequest(), makeComplexity(), config, new Map());
    expect(routes).toHaveLength(1);
    expect(routes[0]?.provider).toBe('openai');
  });
});
