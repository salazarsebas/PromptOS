import { countTokens } from '../compression/trimmer.js';
import {
  denormalizeToAnthropic,
  normalizeAnthropicMessages,
} from '../normalizer/anthropic-normalizer.js';
import { createProxy } from './create-proxy.js';

const DEFAULT_MAX_TOKENS = 4096;
export function createAnthropicAdapter(client, pipeline) {
  return createProxy(client, pipeline, isCreateMethod, createInterceptedMethod);
}
export function createAnthropicTerminalMiddleware(client) {
  return async (ctx) => {
    const { system, messages } = denormalizeToAnthropic(ctx.messages);
    const request = {
      ...ctx.originalRequest,
      messages,
      max_tokens: ctx.originalRequest.max_tokens ?? DEFAULT_MAX_TOKENS,
    };
    if (system) {
      request.system = system;
    }
    const response = await client.messages.create(request);
    return { response, metadata: ctx.metadata };
  };
}
function isCreateMethod(path) {
  return path.length === 2 && path[0] === 'messages' && path[1] === 'create';
}
function createInterceptedMethod(pipeline, originalMethod) {
  return async (...args) => {
    const params = args[0] ?? {};
    if (params.stream) {
      return originalMethod(...args);
    }
    const messages = normalizeAnthropicMessages({
      system: params.system,
      messages: params.messages ?? [],
    });
    const tokenCount = countTokens(messages);
    const result = await pipeline({
      provider: 'anthropic',
      model: params.model ?? 'claude-sonnet-4-5',
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
//# sourceMappingURL=anthropic-adapter.js.map
