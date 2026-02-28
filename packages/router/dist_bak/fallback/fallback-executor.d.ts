import type { ResolvedRoute } from '../strategy/strategy-resolver.js';
import type { RouterProvider, RoutingAttempt } from '../types.js';
export interface CallResult {
  content: string;
  model: string;
  provider: RouterProvider;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}
export type ProviderCallFn = (route: ResolvedRoute) => Promise<CallResult>;
export interface FallbackResult {
  result: CallResult;
  attempts: RoutingAttempt[];
}
export declare function executeFallbackChain(
  routes: ResolvedRoute[],
  callFn: ProviderCallFn,
  delayFn?: (ms: number) => Promise<void>,
): Promise<FallbackResult>;
//# sourceMappingURL=fallback-executor.d.ts.map
