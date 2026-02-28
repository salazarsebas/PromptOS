import { enforceBudget } from '../budget/enforcer.js';
export function createBudgetMiddleware(budget, compressionEnabled, compressionStrategy) {
  const middleware = async (ctx, next) => {
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
//# sourceMappingURL=budget-middleware.js.map
