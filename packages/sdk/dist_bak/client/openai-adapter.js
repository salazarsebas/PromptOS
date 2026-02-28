import { countTokens } from '../compression/trimmer.js';
import { denormalizeToOpenAI, normalizeOpenAIMessages } from '../normalizer/openai-normalizer.js';
import { createProxy } from './create-proxy.js';
export function createOpenAIAdapter(client, pipeline) {
  return createProxy(client, pipeline, isCreateMethod, createInterceptedMethod);
}
export function createOpenAITerminalMiddleware(client) {
  return async (ctx) => {
    const openaiMessages = denormalizeToOpenAI(ctx.messages);
    const request = { ...ctx.originalRequest, messages: openaiMessages };
    const response = await client.chat.completions.create(request);
    return { response, metadata: ctx.metadata };
  };
}
function isCreateMethod(path) {
  return (
    path.length === 3 && path[0] === 'chat' && path[1] === 'completions' && path[2] === 'create'
  );
}
function createInterceptedMethod(pipeline, originalMethod) {
  return async (...args) => {
    const params = args[0] ?? {};
    if (params.stream) {
      return originalMethod(...args);
    }
    const messages = normalizeOpenAIMessages(params.messages ?? []);
    const tokenCount = countTokens(messages);
    const result = await pipeline({
      provider: 'openai',
      model: params.model ?? 'gpt-4o',
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
//# sourceMappingURL=openai-adapter.js.map
