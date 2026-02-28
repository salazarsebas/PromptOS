import type { CallCategory, ModelIdentifier, Provider } from './provider.js';
export interface ModelPricing {
  model: ModelIdentifier;
  provider: Provider;
  inputPer1MTokens: number;
  outputPer1MTokens: number;
  category: CallCategory;
}
export interface CostEstimate {
  callIndex: number;
  model: ModelIdentifier;
  estimatedInputTokensPerCall: number;
  estimatedOutputTokensPerCall: number;
  estimatedCallsPerMonth: number;
  monthlyCostUSD: number;
}
export interface CostReport {
  totalMonthlyCostUSD: number;
  byProvider: Record<string, ProviderCostSummary>;
  topCostDrivers: CostEstimate[];
  estimates: CostEstimate[];
}
export interface ProviderCostSummary {
  provider: Provider;
  totalMonthlyCostUSD: number;
  callCount: number;
  percentage: number;
}
//# sourceMappingURL=cost.d.ts.map
