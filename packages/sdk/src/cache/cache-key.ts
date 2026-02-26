import { createHash } from 'node:crypto';
import type { NormalizedMessage, SdkProvider } from '@promptos/shared';

export function computeCacheKey(
  provider: SdkProvider,
  model: string,
  messages: NormalizedMessage[],
): string {
  const payload = JSON.stringify({ provider, model, messages });
  return createHash('sha256').update(payload).digest('hex');
}
