import type {
  ComplexityResult,
  HealthStatus,
  ModelIdentifier,
  RouterConfig,
  RouterProvider,
  RouterRequest,
} from '../types.js';
import { getModelForTier } from './model-tiers.js';

export interface ResolvedRoute {
  provider: RouterProvider;
  model: ModelIdentifier;
}

export function resolveRoute(
  request: RouterRequest,
  complexity: ComplexityResult,
  config: RouterConfig,
  healthStatuses: Map<RouterProvider, HealthStatus>,
): ResolvedRoute[] {
  // Explicit provider + model override → single route, no fallback
  if (request.provider && request.model) {
    return [{ provider: request.provider, model: request.model }];
  }

  const configuredProviders = Object.keys(config.providers) as RouterProvider[];

  // Build ordered provider list
  let orderedProviders: RouterProvider[];
  if (config.routing.fallbackChain && config.routing.fallbackChain.length > 0) {
    // Use fallback chain, but only include configured providers
    orderedProviders = config.routing.fallbackChain.filter((p) => configuredProviders.includes(p));
  } else {
    orderedProviders = configuredProviders;
  }

  // If user specified a provider, put it first
  if (request.provider) {
    orderedProviders = [
      request.provider,
      ...orderedProviders.filter((p) => p !== request.provider),
    ];
  }

  // Filter out unhealthy providers (but keep at least one)
  const healthyProviders = orderedProviders.filter((p) => {
    const status = healthStatuses.get(p);
    return !status || status.healthy;
  });

  const finalProviders = healthyProviders.length > 0 ? healthyProviders : orderedProviders;

  // Map each provider to its model
  return finalProviders.map((provider) => ({
    provider,
    model: request.model ?? getModelForTier(config.routing.strategy, provider, complexity.level),
  }));
}
