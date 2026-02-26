import type { Middleware, MiddlewareNext } from '@promptos/shared';
import { countTokens } from '../compression/trimmer.js';
import {
  denormalizeToAnthropic,
  normalizeAnthropicMessages,
} from '../normalizer/anthropic-normalizer.js';

const DEFAULT_MAX_TOKENS = 4096;

interface AnthropicLikeClient {
  messages: {
    create: (params: Record<string, unknown>) => Promise<unknown>;
  };
}

export function createAnthropicAdapter(client: unknown, pipeline: MiddlewareNext): unknown {
  return createProxy(client, pipeline);
}

export function createAnthropicTerminalMiddleware(client: AnthropicLikeClient): Middleware {
  return async (ctx) => {
    const { system, messages } = denormalizeToAnthropic(ctx.messages);
    const request: Record<string, unknown> = {
      ...ctx.originalRequest,
      messages,
      max_tokens: (ctx.originalRequest.max_tokens as number | undefined) ?? DEFAULT_MAX_TOKENS,
    };
    if (system) {
      request.system = system;
    }
    const response = await client.messages.create(request);
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
  return path.length === 2 && path[0] === 'messages' && path[1] === 'create';
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

    const messages = normalizeAnthropicMessages({
      system: params.system as string | undefined,
      messages: (params.messages ?? []) as Array<{
        role: string;
        content: string | Array<{ type: 'text'; text: string }>;
      }>,
    });

    const tokenCount = countTokens(messages);

    const result = await pipeline({
      provider: 'anthropic',
      model: (params.model as string) ?? 'claude-sonnet-4-5',
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
