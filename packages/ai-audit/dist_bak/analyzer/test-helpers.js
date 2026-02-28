/**
 * Filter calls and align cost estimates for analyzer testing.
 */
export function filterCallsWithEstimates(scanCalls, costReport, predicate) {
  const calls = [];
  const estimates = [];
  for (let i = 0; i < scanCalls.length; i++) {
    const call = scanCalls[i];
    if (call && predicate(call)) {
      calls.push(call);
      const estimate = costReport.estimates[i];
      if (estimate) estimates.push(estimate);
    }
  }
  return { calls, estimates };
}
//# sourceMappingURL=test-helpers.js.map
