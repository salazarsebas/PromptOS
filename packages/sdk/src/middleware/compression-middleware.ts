import type { CompressionConfig, Middleware } from '@promptos/shared';
import { compressMessages, countTokens } from '../compression/trimmer.js';

export function createCompressionMiddleware(
  config: CompressionConfig,
  maxTokens?: number,
): Middleware {
  const middleware: Middleware = async (ctx, next) => {
    if (!config.enabled || !maxTokens) return next(ctx);

    const strategy = config.strategy ?? 'trim';
    const originalTokenCount = countTokens(ctx.messages);
    const compressed = compressMessages(ctx.messages, maxTokens, strategy);
    const finalTokenCount = countTokens(compressed);
    const wasCompressed = finalTokenCount < originalTokenCount;

    ctx.messages = compressed;
    ctx.metadata.originalTokenCount = originalTokenCount;
    ctx.metadata.finalTokenCount = finalTokenCount;
    ctx.metadata.compressed = wasCompressed;

    return next(ctx);
  };

  return middleware;
}
