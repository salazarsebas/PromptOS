const DEFAULTS = {
  promptTokenThreshold: 2000,
  callsPerMonth: 1000,
  avgInputTokens: 500,
  avgOutputTokens: 200,
};
export function resolveAnalyzerConfig(config) {
  return {
    promptTokenThreshold: config.promptTokenThreshold ?? DEFAULTS.promptTokenThreshold,
    callsPerMonth: config.callsPerMonth ?? DEFAULTS.callsPerMonth,
    avgInputTokens: config.avgInputTokens ?? DEFAULTS.avgInputTokens,
    avgOutputTokens: config.avgOutputTokens ?? DEFAULTS.avgOutputTokens,
  };
}
//# sourceMappingURL=context.js.map
