import type { CallResult } from '../fallback/fallback-executor.js';
import type { NormalizedMessage, ProviderConfig, RouterProvider } from '../types.js';
interface ExecuteParams {
  model: string;
  messages: NormalizedMessage[];
  maxTokens?: number;
  temperature?: number;
}
type ClientFactory = (
  provider: RouterProvider,
  config: ProviderConfig,
) => unknown | Promise<unknown>;
export declare class ProviderExecutor {
  private readonly clients;
  private readonly clientFactory;
  constructor(clientFactory?: ClientFactory);
  execute(
    provider: RouterProvider,
    config: ProviderConfig,
    params: ExecuteParams,
  ): Promise<CallResult>;
  private getOrCreateClient;
  private executeOpenAI;
  private executeAnthropic;
}
//# sourceMappingURL=provider-executor.d.ts.map
