import type { Middleware, MiddlewareNext } from '@promptos/shared';
import { countTokens } from '../compression/trimmer.js';
import { denormalizeToOpenAI, normalizeOpenAIMessages } from '../normalizer/openai-normalizer.js';

interface OpenAILikeClient {
  chat: {
    completions: {
      create: (params: Record<string, unknown>) => Promise<unknown>;
    };
  };
}

export function createOpenAIAdapter(client: unknown, pipeline: MiddlewareNext): unknown {
  return createProxy(client, pipeline);
}

export function createOpenAITerminalMiddleware(client: OpenAILikeClient): Middleware {
  return async (ctx) => {
    const openaiMessages = denormalizeToOpenAI(ctx.messages);
    const request = { ...ctx.originalRequest, messages: openaiMessages };
    const response = await client.chat.completions.create(request);
    return { response, metadata: ctx.metadata };
  };
}

function createProxy(target: unknown, pipeline: MiddlewareNext, path: string[] = []): unknown {
  if (typeof target !== 'object' || target === null) return target;

  return new Proxy(target as object, {
    get(obj, prop: string) {
      const value = Reflect.get(obj, prop);
      const currentPath = [...path, prop];

      if (isCreateMethod(currentPath) && typeof value === 'function') {
        return createInterceptedMethod(pipeline, value.bind(obj));
      }

      if (typeof value === 'object' && value !== null) {
        return createProxy(value, pipeline, currentPath);
      }

      if (typeof value === 'function') {
        return value.bind(obj);
      }

      return value;
    },
  });
}

function isCreateMethod(path: string[]): boolean {
  return (
    path.length === 3 && path[0] === 'chat' && path[1] === 'completions' && path[2] === 'create'
  );
}

function createInterceptedMethod(
  pipeline: MiddlewareNext,
  originalMethod: (...args: unknown[]) => unknown,
): (...args: unknown[]) => Promise<unknown> {
  return async (...args: unknown[]) => {
    const params = (args[0] ?? {}) as Record<string, unknown>;

    if (params.stream) {
      return originalMethod(...args);
    }

    const messages = normalizeOpenAIMessages(
      (params.messages ?? []) as Array<{ role: string; content: string | null }>,
    );

    const tokenCount = countTokens(messages);

    const result = await pipeline({
      provider: 'openai',
      model: (params.model as string) ?? 'gpt-4o',
      messages,
      originalRequest: params,
      metadata: {
        cacheHit: false,
        compressed: false,
        originalTokenCount: tokenCount,
        finalTokenCount: tokenCount,
        budgetEnforced: false,
      },
    });

    return result.response;
  };
}
