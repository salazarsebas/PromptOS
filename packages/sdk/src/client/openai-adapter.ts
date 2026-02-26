import type { Middleware, MiddlewareNext } from '@promptos/shared';
import { countTokens } from '../compression/trimmer.js';
import { denormalizeToOpenAI, normalizeOpenAIMessages } from '../normalizer/openai-normalizer.js';
import { createProxy } from './create-proxy.js';

interface OpenAILikeClient {
  chat: {
    completions: {
      create: (params: Record<string, unknown>) => Promise<unknown>;
    };
  };
}

export function createOpenAIAdapter(client: unknown, pipeline: MiddlewareNext): unknown {
  return createProxy(client, pipeline, isCreateMethod, createInterceptedMethod);
}

export function createOpenAITerminalMiddleware(client: OpenAILikeClient): Middleware {
  return async (ctx) => {
    const openaiMessages = denormalizeToOpenAI(ctx.messages);
    const request = { ...ctx.originalRequest, messages: openaiMessages };
    const response = await client.chat.completions.create(request);
    return { response, metadata: ctx.metadata };
  };
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
