import type { CallCategory, Provider } from '@promptos/shared';
import type { CallExpression } from 'ts-morph';
export interface PatternMatch {
  provider: Provider;
  fullMethodChain: string;
  category: CallCategory;
  modelArgument?: string;
  inferredModel: string;
  confidence: 'high' | 'medium' | 'low';
}
export declare function matchCallExpression(
  callExpr: CallExpression,
  activeProviders: Provider[],
): PatternMatch | null;
//# sourceMappingURL=pattern-matcher.d.ts.map
