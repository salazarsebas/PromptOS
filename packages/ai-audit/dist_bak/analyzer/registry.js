import { detectCacheOpportunities } from './cache-opportunity.js';
import { suggestModelDowngrades } from './model-suggester.js';
import { detectOversizedPrompts } from './prompt-sizer.js';
import { detectRedundancy } from './redundancy-detector.js';

const ANALYZER_REGISTRY = {
  'redundant-context': detectRedundancy,
  'missing-cache': detectCacheOpportunities,
  'oversized-prompt': detectOversizedPrompts,
  'model-downgrade': suggestModelDowngrades,
};
export function runAnalyzers(context) {
  const opportunities = [];
  for (const analyzer of Object.values(ANALYZER_REGISTRY)) {
    opportunities.push(...analyzer(context));
  }
  opportunities.sort((a, b) => b.estimatedMonthlySavingsUSD - a.estimatedMonthlySavingsUSD);
  const totalEstimatedSavingsUSD =
    Math.round(opportunities.reduce((sum, opp) => sum + opp.estimatedMonthlySavingsUSD, 0) * 100) /
    100;
  return { opportunities, totalEstimatedSavingsUSD };
}
//# sourceMappingURL=registry.js.map
