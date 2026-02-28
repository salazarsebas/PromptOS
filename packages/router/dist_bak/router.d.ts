import { ProviderExecutor } from './executor/provider-executor.js';
import type {
  HealthStatus,
  RouterConfig,
  RouterProvider,
  RouterRequest,
  RouterResponse,
} from './types.js';
export declare class Router {
  private readonly config;
  private readonly healthTracker;
  private readonly executor;
  constructor(config: RouterConfig, executor?: ProviderExecutor);
  complete(request: RouterRequest): Promise<RouterResponse>;
  getHealthStatus(provider: RouterProvider): HealthStatus;
  resetHealth(provider?: RouterProvider): void;
}
//# sourceMappingURL=router.d.ts.map
