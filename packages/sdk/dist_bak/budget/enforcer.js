import { compressMessages, countTokens } from '../compression/trimmer.js';
import { TokenBudgetExceededError } from '../errors.js';
export function enforceBudget(messages, options) {
  const originalTokenCount = countTokens(messages);
  const maxTokens = options.budget.maxInputTokens;
  if (!maxTokens || originalTokenCount <= maxTokens) {
    return {
      messages,
      originalTokenCount,
      finalTokenCount: originalTokenCount,
      budgetEnforced: false,
      compressed: false,
    };
  }
  if (options.compressionEnabled) {
    const compressed = compressMessages(messages, maxTokens, options.compressionStrategy);
    const finalTokenCount = countTokens(compressed);
    if (finalTokenCount <= maxTokens) {
      return {
        messages: compressed,
        originalTokenCount,
        finalTokenCount,
        budgetEnforced: true,
        compressed: true,
      };
    }
  }
  throw new TokenBudgetExceededError(originalTokenCount, maxTokens);
}
//# sourceMappingURL=enforcer.js.map
