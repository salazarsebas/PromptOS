import type {
  ComplexityResult,
  HealthStatus,
  ModelIdentifier,
  RouterConfig,
  RouterProvider,
  RouterRequest,
} from '../types.js';
export interface ResolvedRoute {
  provider: RouterProvider;
  model: ModelIdentifier;
}
export declare function resolveRoute(
  request: RouterRequest,
  complexity: ComplexityResult,
  config: RouterConfig,
  healthStatuses: Map<RouterProvider, HealthStatus>,
): ResolvedRoute[];
//# sourceMappingURL=strategy-resolver.d.ts.map
