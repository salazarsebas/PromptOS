import type { ModelIdentifier, OptimizationOpportunity } from '@prompt-os/shared';
import { estimateTokensFast, getPricing } from '@prompt-os/shared';
import { extractMessageContents, findApiCallNearLine } from './ast-utils.js';
import type { AnalyzerContext } from './context.js';

const DOWNGRADE_MAP: Record<string, { target: ModelIdentifier; label: string }> = {
  'gpt-4o': { target: 'gpt-4o-mini', label: 'GPT-4o-mini' },
  'gpt-4-turbo': { target: 'gpt-4o-mini', label: 'GPT-4o-mini' },
  'claude-sonnet-4-5': { target: 'claude-haiku-4-5', label: 'Claude Haiku 4.5' },
  'claude-3-opus': { target: 'claude-3-sonnet', label: 'Claude 3 Sonnet' },
  'claude-opus-4-5': { target: 'claude-sonnet-4-5', label: 'Claude Sonnet 4.5' },
  'gemini-2.5-pro': { target: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
  o1: { target: 'o3-mini', label: 'O3-mini' },
};

// Prompts under 500 tokens are likely simple tasks where a cheaper model suffices
const SHORT_MESSAGE_THRESHOLD = 500;

export function suggestModelDowngrades(context: AnalyzerContext): OptimizationOpportunity[] {
  const opportunities: OptimizationOpportunity[] = [];

  for (let i = 0; i < context.calls.length; i++) {
    const call = context.calls[i];
    if (!call) continue;

    const opp = evaluateDowngrade(call, context);
    if (opp) opportunities.push(opp);
  }

  return opportunities;
}

function evaluateDowngrade(
  call: import('@prompt-os/shared').DetectedCall,
  context: AnalyzerContext,
): OptimizationOpportunity | null {
  const downgrade = DOWNGRADE_MAP[call.inferredModel];
  if (!downgrade) return null;

  const sourceFile = context.sourceFiles.get(call.filePath);
  if (!sourceFile) return null;

  const promptTokens = estimatePromptTokensForCall(sourceFile, call.line);
  if (promptTokens >= SHORT_MESSAGE_THRESHOLD) return null;

  const savings = calculateSavings(call.inferredModel, downgrade.target, context);
  if (savings <= 0) return null;

  return {
    type: 'model-downgrade',
    severity: savings > 50 ? 'high' : savings > 10 ? 'medium' : 'low',
    filePath: call.filePath,
    line: call.line,
    description: `\`${call.inferredModel}\` used for a short prompt (~${promptTokens} tokens) — a cheaper model may suffice`,
    suggestion: `Consider using ${downgrade.label} (\`${downgrade.target}\`) for this call site`,
    estimatedMonthlySavingsUSD: Math.round(savings * 100) / 100,
  };
}

function estimatePromptTokensForCall(
  sourceFile: import('ts-morph').SourceFile,
  line: number,
): number {
  const apiCall = findApiCallNearLine(sourceFile, line);
  if (!apiCall) return 0;

  const messages = extractMessageContents(apiCall);
  return messages.reduce((sum, msg) => sum + estimateTokensFast(msg.content.length), 0);
}

function calculateSavings(
  currentModel: string,
  targetModel: string,
  context: AnalyzerContext,
): number {
  const currentPricing = getPricing(currentModel);
  const targetPricing = getPricing(targetModel);
  if (!currentPricing || !targetPricing) return 0;

  const { avgInputTokens, avgOutputTokens, callsPerMonth } = context.config;

  const currentCost =
    ((avgInputTokens / 1_000_000) * currentPricing.inputPer1MTokens +
      (avgOutputTokens / 1_000_000) * currentPricing.outputPer1MTokens) *
    callsPerMonth;

  const targetCost =
    ((avgInputTokens / 1_000_000) * targetPricing.inputPer1MTokens +
      (avgOutputTokens / 1_000_000) * targetPricing.outputPer1MTokens) *
    callsPerMonth;

  return currentCost - targetCost;
}
