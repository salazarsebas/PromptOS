import type { Middleware, MiddlewareNext } from '@promptos/shared';
interface AnthropicLikeClient {
  messages: {
    create: (params: Record<string, unknown>) => Promise<unknown>;
  };
}
export declare function createAnthropicAdapter(client: unknown, pipeline: MiddlewareNext): unknown;
export declare function createAnthropicTerminalMiddleware(client: AnthropicLikeClient): Middleware;
//# sourceMappingURL=anthropic-adapter.d.ts.map
