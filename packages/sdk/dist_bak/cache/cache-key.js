import { createHash } from 'node:crypto';
export function computeCacheKey(provider, model, messages, originalRequest) {
  const requestParams = originalRequest ? extractCacheableParams(originalRequest) : undefined;
  const payload = JSON.stringify({ provider, model, messages, requestParams });
  return createHash('sha256').update(payload).digest('hex');
}
function extractCacheableParams(request) {
  const { messages: _, ...rest } = request;
  return rest;
}
//# sourceMappingURL=cache-key.js.map
