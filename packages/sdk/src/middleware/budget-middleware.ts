import type { CompressionStrategy, Middleware, TokenBudgetConfig } from '@prompt-os/shared';
import { enforceBudget } from '../budget/enforcer.js';

export function createBudgetMiddleware(
  budget: TokenBudgetConfig,
  compressionEnabled: boolean,
  compressionStrategy: CompressionStrategy,
): Middleware {
  const middleware: Middleware = async (ctx, next) => {
    if (!budget.maxInputTokens) return next(ctx);

    const result = enforceBudget(ctx.messages, {
      budget,
      compressionEnabled,
      compressionStrategy,
    });

    ctx.messages = result.messages;
    ctx.metadata.budgetEnforced = result.budgetEnforced;
    if (result.compressed) {
      ctx.metadata.compressed = true;
      ctx.metadata.originalTokenCount = result.originalTokenCount;
      ctx.metadata.finalTokenCount = result.finalTokenCount;
    }

    return next(ctx);
  };

  return middleware;
}
