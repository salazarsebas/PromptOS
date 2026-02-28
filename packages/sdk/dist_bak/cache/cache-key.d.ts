import type { NormalizedMessage, SdkProvider } from '@promptos/shared';
export declare function computeCacheKey(
  provider: SdkProvider,
  model: string,
  messages: NormalizedMessage[],
  originalRequest?: Record<string, unknown>,
): string;
//# sourceMappingURL=cache-key.d.ts.map
