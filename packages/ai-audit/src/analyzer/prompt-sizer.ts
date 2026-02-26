import type { OptimizationOpportunity } from '@promptos/shared';
import { estimateTokensFast } from '@promptos/shared';
import { extractMessageContents, findApiCallNearLine } from './ast-utils.js';
import type { AnalyzerContext } from './context.js';

const OVERSIZED_PROMPT_SAVINGS_RATIO = 0.4;

export function detectOversizedPrompts(context: AnalyzerContext): OptimizationOpportunity[] {
  const opportunities: OptimizationOpportunity[] = [];
  const { promptTokenThreshold } = context.config;

  for (let i = 0; i < context.calls.length; i++) {
    const call = context.calls[i];
    if (!call) continue;

    const sourceFile = context.sourceFiles.get(call.filePath);
    if (!sourceFile) continue;

    const apiCall = findApiCallNearLine(sourceFile, call.line);
    if (!apiCall) continue;

    const messages = extractMessageContents(apiCall);
    const totalTokens = messages.reduce(
      (sum, msg) => sum + estimateTokensFast(msg.content.length),
      0,
    );
    if (totalTokens <= promptTokenThreshold) continue;

    const estimate = context.costEstimates[i];
    const overageRatio = (totalTokens - promptTokenThreshold) / totalTokens;
    const savings = estimate
      ? estimate.monthlyCostUSD * overageRatio * OVERSIZED_PROMPT_SAVINGS_RATIO
      : 0;

    opportunities.push({
      type: 'oversized-prompt',
      severity: totalTokens > promptTokenThreshold * 2 ? 'high' : 'medium',
      filePath: call.filePath,
      line: call.line,
      description: `Prompt contains ~${totalTokens} tokens (threshold: ${promptTokenThreshold}) — ${Math.round(overageRatio * 100)}% over budget`,
      suggestion:
        'Consider compressing the prompt, splitting into multiple calls, or using a summarization step',
      estimatedMonthlySavingsUSD: Math.round(savings * 100) / 100,
    });
  }

  return opportunities;
}
