import type { OptimizationOpportunity } from '@promptos/shared';
import { extractMessageContents, findApiCallNearLine } from './ast-utils.js';
import type { AnalyzerContext } from './context.js';

// Cached/shared system prompts typically save ~30% of per-call input token cost
const REDUNDANCY_SAVINGS_RATIO = 0.3;

export function detectRedundancy(context: AnalyzerContext): OptimizationOpportunity[] {
  const opportunities: OptimizationOpportunity[] = [];
  const systemPromptGroups = new Map<
    string,
    Array<{ filePath: string; line: number; callIndex: number }>
  >();

  for (let i = 0; i < context.calls.length; i++) {
    const call = context.calls[i];
    if (!call) continue;

    const sourceFile = context.sourceFiles.get(call.filePath);
    if (!sourceFile) continue;

    const apiCall = findApiCallNearLine(sourceFile, call.line);
    if (!apiCall) continue;

    const messages = extractMessageContents(apiCall);
    const systemMsg = messages.find((m) => m.role === 'system');
    if (!systemMsg) continue;

    const group = systemPromptGroups.get(systemMsg.content);
    if (group) {
      group.push({ filePath: call.filePath, line: call.line, callIndex: i });
    } else {
      systemPromptGroups.set(systemMsg.content, [
        { filePath: call.filePath, line: call.line, callIndex: i },
      ]);
    }
  }

  for (const [prompt, locations] of systemPromptGroups) {
    if (locations.length < 2) continue;
    buildRedundancyOpportunity(opportunities, prompt, locations, context);
  }

  return opportunities;
}

function buildRedundancyOpportunity(
  opportunities: OptimizationOpportunity[],
  prompt: string,
  locations: Array<{ filePath: string; line: number; callIndex: number }>,
  context: AnalyzerContext,
): void {
  const duplicateCount = locations.length - 1;
  const firstLoc = locations[0];
  if (!firstLoc) return;

  const estimate = context.costEstimates[firstLoc.callIndex];
  const savings = estimate
    ? estimate.monthlyCostUSD * duplicateCount * REDUNDANCY_SAVINGS_RATIO
    : 0;
  const truncated = prompt.length > 60 ? `${prompt.slice(0, 60)}...` : prompt;

  opportunities.push({
    type: 'redundant-context',
    severity: locations.length >= 3 ? 'high' : 'medium',
    filePath: firstLoc.filePath,
    line: firstLoc.line,
    description: `System prompt "${truncated}" is duplicated across ${locations.length} call sites`,
    suggestion:
      'Extract the shared system prompt into a constant and consider using prompt caching',
    estimatedMonthlySavingsUSD: Math.round(savings * 100) / 100,
  });
}
