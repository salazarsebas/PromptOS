import type { CompressionStrategy, NormalizedMessage, TokenBudgetConfig } from '@prompt-os/shared';
import { compressMessages, countTokens } from '../compression/trimmer.js';
import { TokenBudgetExceededError } from '../errors.js';

interface EnforceOptions {
  budget: TokenBudgetConfig;
  compressionEnabled: boolean;
  compressionStrategy: CompressionStrategy;
}

export interface EnforceResult {
  messages: NormalizedMessage[];
  originalTokenCount: number;
  finalTokenCount: number;
  budgetEnforced: boolean;
  compressed: boolean;
}

export function enforceBudget(
  messages: NormalizedMessage[],
  options: EnforceOptions,
): EnforceResult {
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
