import type { CacheConfig, Middleware, MiddlewareResult } from '@promptos/shared';
import { computeCacheKey } from '../cache/cache-key.js';
import { MemoryCache } from '../cache/memory-cache.js';

export function createCacheMiddleware(config: CacheConfig): Middleware {
  const cache = new MemoryCache<MiddlewareResult>(
    config.ttlMs ?? 300_000,
    config.maxEntries ?? 100,
  );

  const middleware: Middleware = async (ctx, next) => {
    if (!config.enabled) return next(ctx);

    const key = computeCacheKey(ctx.provider, ctx.model, ctx.messages);
    const cached = cache.get(key);

    if (cached) {
      return {
        response: cached.response,
        metadata: { ...ctx.metadata, cacheHit: true },
      };
    }

    const result = await next(ctx);
    cache.set(key, result);
    return result;
  };

  return middleware;
}
