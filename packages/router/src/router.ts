import { classifyComplexity } from './classifier/complexity-classifier.js';
import { AllProvidersFailedError, NoProvidersConfiguredError, RouterError } from './errors.js';
import { ProviderExecutor } from './executor/provider-executor.js';
import { executeFallbackChain } from './fallback/fallback-executor.js';
import { HealthTracker } from './health/health-tracker.js';
import { resolveRoute } from './strategy/strategy-resolver.js';
import type {
  HealthStatus,
  RouterConfig,
  RouterProvider,
  RouterRequest,
  RouterResponse,
} from './types.js';

export class Router {
  private readonly config: RouterConfig;
  private readonly healthTracker: HealthTracker;
  private readonly executor: ProviderExecutor;

  constructor(config: RouterConfig, executor?: ProviderExecutor) {
    const providers = Object.keys(config.providers) as RouterProvider[];
    if (providers.length === 0) {
      throw new NoProvidersConfiguredError();
    }

    this.config = config;
    this.healthTracker = new HealthTracker(config.healthCheck);
    this.executor = executor ?? new ProviderExecutor();
  }

  async complete(request: RouterRequest): Promise<RouterResponse> {
    if (!request.messages.length) {
      throw new RouterError('messages must not be empty');
    }

    const totalStart = Date.now();

    const complexity = classifyComplexity(request.messages);
    const healthStatuses = this.healthTracker.getAllStatuses();
    const routes = resolveRoute(request, complexity, this.config, healthStatuses);

    try {
      const { result, attempts } = await executeFallbackChain(routes, async (route) => {
        const providerConfig = this.config.providers[route.provider];
        if (!providerConfig) {
          throw new Error(`Provider ${route.provider} not configured`);
        }
        return this.executor.execute(route.provider, providerConfig, {
          model: route.model,
          messages: request.messages,
          maxTokens: request.maxTokens,
          temperature: request.temperature,
        });
      });

      // Record health for all attempted providers
      for (const attempt of attempts) {
        this.healthTracker.record(attempt.provider, attempt.success);
      }

      return {
        content: result.content,
        model: result.model,
        provider: result.provider,
        usage: result.usage,
        routing: {
          complexity,
          selectedModel: result.model,
          selectedProvider: result.provider,
          attempts,
          totalLatencyMs: Date.now() - totalStart,
        },
      };
    } catch (error) {
      if (error instanceof AllProvidersFailedError) {
        for (const attempt of error.routingAttempts) {
          this.healthTracker.record(attempt.provider, attempt.success);
        }
      }
      throw error;
    }
  }

  getHealthStatus(provider: RouterProvider): HealthStatus {
    return this.healthTracker.getStatus(provider);
  }

  resetHealth(provider?: RouterProvider): void {
    this.healthTracker.reset(provider);
  }
}
