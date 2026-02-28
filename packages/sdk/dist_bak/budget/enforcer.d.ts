import type { CompressionStrategy, NormalizedMessage, TokenBudgetConfig } from '@promptos/shared';
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
export declare function enforceBudget(
  messages: NormalizedMessage[],
  options: EnforceOptions,
): EnforceResult;
//# sourceMappingURL=enforcer.d.ts.map
