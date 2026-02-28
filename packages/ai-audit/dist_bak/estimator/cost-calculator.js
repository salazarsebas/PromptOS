import { getDefaultModel, getPricing } from '@promptos/shared';

const TOP_COST_DRIVERS_LIMIT = 10;
export function calculateCosts(calls, options) {
  const estimates = calls.map((call, index) => {
    const model = call.inferredModel;
    const pricing = getPricing(model) ?? getPricing(getDefaultModel(call.provider, call.category));
    if (!pricing) {
      return {
        callIndex: index,
        model,
        estimatedInputTokensPerCall: options.avgInputTokens,
        estimatedOutputTokensPerCall: options.avgOutputTokens,
        estimatedCallsPerMonth: options.callsPerMonth,
        monthlyCostUSD: 0,
      };
    }
    const inputCostPerCall = (options.avgInputTokens / 1_000_000) * pricing.inputPer1MTokens;
    const outputCostPerCall = (options.avgOutputTokens / 1_000_000) * pricing.outputPer1MTokens;
    const monthlyCost = (inputCostPerCall + outputCostPerCall) * options.callsPerMonth;
    return {
      callIndex: index,
      model,
      estimatedInputTokensPerCall: options.avgInputTokens,
      estimatedOutputTokensPerCall: options.avgOutputTokens,
      estimatedCallsPerMonth: options.callsPerMonth,
      monthlyCostUSD: Math.round(monthlyCost * 100) / 100,
    };
  });
  const byProvider = {};
  let totalCost = 0;
  for (let i = 0; i < calls.length; i++) {
    const call = calls[i];
    const est = estimates[i];
    if (!call || !est) continue;
    totalCost += est.monthlyCostUSD;
    if (!byProvider[call.provider]) {
      byProvider[call.provider] = {
        provider: call.provider,
        totalMonthlyCostUSD: 0,
        callCount: 0,
        percentage: 0,
      };
    }
    const summary = byProvider[call.provider];
    if (summary) {
      summary.totalMonthlyCostUSD += est.monthlyCostUSD;
      summary.callCount++;
    }
  }
  for (const summary of Object.values(byProvider)) {
    summary.totalMonthlyCostUSD = Math.round(summary.totalMonthlyCostUSD * 100) / 100;
    summary.percentage =
      totalCost > 0 ? Math.round((summary.totalMonthlyCostUSD / totalCost) * 100) : 0;
  }
  const topCostDrivers = [...estimates]
    .sort((a, b) => b.monthlyCostUSD - a.monthlyCostUSD)
    .slice(0, TOP_COST_DRIVERS_LIMIT);
  return {
    totalMonthlyCostUSD: Math.round(totalCost * 100) / 100,
    byProvider,
    topCostDrivers,
    estimates,
  };
}
//# sourceMappingURL=cost-calculator.js.map
