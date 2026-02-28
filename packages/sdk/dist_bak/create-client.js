import {
  createAnthropicAdapter,
  createAnthropicTerminalMiddleware,
} from './client/anthropic-adapter.js';
import { createOpenAIAdapter, createOpenAITerminalMiddleware } from './client/openai-adapter.js';
import { loadAnthropicClient, loadOpenAIClient } from './client/provider-loader.js';
import { PromptOSError } from './errors.js';
import { createBudgetMiddleware } from './middleware/budget-middleware.js';
import { createCacheMiddleware } from './middleware/cache-middleware.js';
import { createCompressionMiddleware } from './middleware/compression-middleware.js';
import { compose } from './middleware/pipeline.js';
export async function createClient(config) {
  const middlewares = [];
  const compressionEnabled = config.compression?.enabled ?? false;
  const compressionStrategy = config.compression?.strategy ?? 'trim';
  if (config.cache?.enabled) {
    middlewares.push(createCacheMiddleware(config.cache));
  }
  if (compressionEnabled && config.compression) {
    middlewares.push(
      createCompressionMiddleware(config.compression, config.tokenBudget?.maxInputTokens),
    );
  }
  if (config.tokenBudget?.maxInputTokens) {
    middlewares.push(
      createBudgetMiddleware(config.tokenBudget, compressionEnabled, compressionStrategy),
    );
  }
  const clientOptions = { apiKey: config.apiKey, baseURL: config.baseURL };
  if (config.provider === 'openai') {
    const client = await loadOpenAIClient(clientOptions);
    middlewares.push(createOpenAITerminalMiddleware(client));
    const pipeline = compose(middlewares);
    return createOpenAIAdapter(client, pipeline);
  }
  if (config.provider === 'anthropic') {
    const client = await loadAnthropicClient(clientOptions);
    middlewares.push(createAnthropicTerminalMiddleware(client));
    const pipeline = compose(middlewares);
    return createAnthropicAdapter(client, pipeline);
  }
  throw new PromptOSError(`Unsupported provider: ${config.provider}`);
}
//# sourceMappingURL=create-client.js.map
