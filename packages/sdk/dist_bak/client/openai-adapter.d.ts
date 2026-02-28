import type { Middleware, MiddlewareNext } from '@promptos/shared';
interface OpenAILikeClient {
  chat: {
    completions: {
      create: (params: Record<string, unknown>) => Promise<unknown>;
    };
  };
}
export declare function createOpenAIAdapter(client: unknown, pipeline: MiddlewareNext): unknown;
export declare function createOpenAITerminalMiddleware(client: OpenAILikeClient): Middleware;
//# sourceMappingURL=openai-adapter.d.ts.map
