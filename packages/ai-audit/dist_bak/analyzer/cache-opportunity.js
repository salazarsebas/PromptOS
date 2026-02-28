import { SyntaxKind } from 'ts-morph';
import { findCallAtLine } from './ast-utils.js';

const LOOP_KINDS = new Set([
  SyntaxKind.ForStatement,
  SyntaxKind.ForInStatement,
  SyntaxKind.ForOfStatement,
  SyntaxKind.WhileStatement,
  SyntaxKind.DoStatement,
]);
const ITERATION_METHODS = new Set([
  'forEach',
  'map',
  'flatMap',
  'reduce',
  'filter',
  'some',
  'every',
]);
const CACHE_SAVINGS_RATIO = 0.5;
export function detectCacheOpportunities(context) {
  const opportunities = [];
  for (let i = 0; i < context.calls.length; i++) {
    const call = context.calls[i];
    if (!call) continue;
    const sourceFile = context.sourceFiles.get(call.filePath);
    if (!sourceFile) continue;
    const targetCall = findCallAtLine(sourceFile, call.line);
    if (!targetCall) continue;
    if (!isInsideLoop(targetCall)) continue;
    const estimate = context.costEstimates[i];
    const savings = estimate ? estimate.monthlyCostUSD * CACHE_SAVINGS_RATIO : 0;
    opportunities.push({
      type: 'missing-cache',
      severity: 'high',
      filePath: call.filePath,
      line: call.line,
      description: `LLM call \`${call.method}\` is inside a loop — each iteration makes a separate API call`,
      suggestion:
        'Consider batching requests, caching identical inputs, or moving the call outside the loop',
      estimatedMonthlySavingsUSD: Math.round(savings * 100) / 100,
    });
  }
  return opportunities;
}
function isInsideLoop(node) {
  let current = node.getParent();
  while (current) {
    if (LOOP_KINDS.has(current.getKind())) return true;
    if (isIterationMethodCall(current)) return true;
    current = current.getParent();
  }
  return false;
}
function isIterationMethodCall(node) {
  if (!node.isKind(SyntaxKind.CallExpression)) return false;
  const expr = node.getExpression();
  if (!expr.isKind(SyntaxKind.PropertyAccessExpression)) return false;
  return ITERATION_METHODS.has(expr.getName());
}
//# sourceMappingURL=cache-opportunity.js.map
