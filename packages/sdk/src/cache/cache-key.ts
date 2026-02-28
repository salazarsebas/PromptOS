import { createHash } from 'node:crypto';
import type { NormalizedMessage, SdkProvider } from '@prompt-os/shared';

export function computeCacheKey(
  provider: SdkProvider,
  model: string,
  messages: NormalizedMessage[],
  originalRequest?: Record<string, unknown>,
): string {
  const requestParams = originalRequest ? extractCacheableParams(originalRequest) : undefined;
  const payload = JSON.stringify({ provider, model, messages, requestParams });
  return createHash('sha256').update(payload).digest('hex');
}

function extractCacheableParams(request: Record<string, unknown>): Record<string, unknown> {
  const { messages: _, ...rest } = request;
  return rest;
}
