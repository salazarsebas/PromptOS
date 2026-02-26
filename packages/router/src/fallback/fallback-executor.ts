import { AllProvidersFailedError } from '../errors.js';
import type { ResolvedRoute } from '../strategy/strategy-resolver.js';
import type { RouterProvider, RoutingAttempt } from '../types.js';

const BASE_DELAY_MS = 500;
const MAX_DELAY_MS = 5000;
const JITTER_FACTOR = 0.25;

export interface CallResult {
  content: string;
  model: string;
  provider: RouterProvider;
  usage?: { inputTokens: number; outputTokens: number };
}

export type ProviderCallFn = (route: ResolvedRoute) => Promise<CallResult>;

export interface FallbackResult {
  result: CallResult;
  attempts: RoutingAttempt[];
}

export async function executeFallbackChain(
  routes: ResolvedRoute[],
  callFn: ProviderCallFn,
  delayFn: (ms: number) => Promise<void> = (ms) => new Promise((r) => setTimeout(r, ms)),
): Promise<FallbackResult> {
  const attempts: RoutingAttempt[] = [];

  for (const [i, route] of routes.entries()) {
    const start = Date.now();

    try {
      const result = await callFn(route);
      attempts.push({
        provider: route.provider,
        model: route.model,
        success: true,
        latencyMs: Date.now() - start,
      });
      return { result, attempts };
    } catch (err) {
      attempts.push({
        provider: route.provider,
        model: route.model,
        success: false,
        latencyMs: Date.now() - start,
        error: err instanceof Error ? err.message : String(err),
      });

      // If there are more routes to try, backoff before next attempt
      if (i < routes.length - 1) {
        const delay = computeBackoff(i);
        await delayFn(delay);
      }
    }
  }

  throw new AllProvidersFailedError(
    attempts.map((a) => ({ provider: a.provider, error: a.error ?? 'unknown' })),
    attempts,
  );
}

function computeBackoff(attempt: number): number {
  const base = Math.min(BASE_DELAY_MS * 2 ** attempt, MAX_DELAY_MS);
  const jitter = base * JITTER_FACTOR * (2 * Math.random() - 1);
  return Math.max(0, Math.round(base + jitter));
}
