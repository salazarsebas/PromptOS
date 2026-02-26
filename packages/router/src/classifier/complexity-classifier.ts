import type { NormalizedMessage } from '@promptos/shared';
import { estimateTokens } from '@promptos/shared';
import type { ComplexityLevel, ComplexityResult, ComplexitySignals } from '../types.js';

const SIMPLE_TOKEN_CEILING = 500;
const COMPLEX_TOKEN_FLOOR = 2000;
const MULTI_TURN_THRESHOLD = 2;

const COMPLEX_KEYWORDS: RegExp[] = [
  /\banalyze\b/i,
  /\bcompare\b/i,
  /\bexplain\s+in\s+detail\b/i,
  /\bstep[\s-]by[\s-]step\b/i,
  /\bwrite\s+(?:a\s+)?(?:comprehensive|detailed)\b/i,
  /\bcode\s+review\b/i,
  /\brefactor\b/i,
  /\barchitect(?:ure)?\b/i,
  /\bdebug\b/i,
  /\boptimize\b/i,
  /\btrade[\s-]?offs?\b/i,
  /\bpros?\s+and\s+cons?\b/i,
];

const SIMPLE_KEYWORDS: RegExp[] = [
  /\btranslate\b/i,
  /\bsummarize\b/i,
  /\blist\b/i,
  /\byes\s+or\s+no\b/i,
  /\btrue\s+or\s+false\b/i,
  /\bclassify\b/i,
  /\bextract\b/i,
  /\bformat\b/i,
  /\bconvert\b/i,
];

export function classifyComplexity(messages: NormalizedMessage[]): ComplexityResult {
  const signals = computeSignals(messages);
  const score = computeRawScore(signals);
  const level = scoreToLevel(score);
  const confidence = computeConfidence(score, level);
  return { level, signals, confidence };
}

function computeSignals(messages: NormalizedMessage[]): ComplexitySignals {
  const allContent = messages.map((m) => m.content).join(' ');
  const tokenCount = messages.length > 0 ? estimateTokens(allContent) : 0;
  const messageCount = messages.length;
  const hasSystemPrompt = messages.some((m) => m.role === 'system');
  const nonSystemMessages = messages.filter((m) => m.role !== 'system');
  const hasMultiTurn = nonSystemMessages.length > MULTI_TURN_THRESHOLD;
  const keywordComplexity = computeKeywordScore(allContent);

  return { tokenCount, messageCount, hasSystemPrompt, hasMultiTurn, keywordComplexity };
}

function computeKeywordScore(text: string): number {
  const complexHits = COMPLEX_KEYWORDS.filter((kw) => kw.test(text)).length;
  const simpleHits = SIMPLE_KEYWORDS.filter((kw) => kw.test(text)).length;

  if (complexHits + simpleHits === 0) return 0;

  return complexHits / (complexHits + simpleHits);
}

function computeRawScore(signals: ComplexitySignals): number {
  let score = 0;

  // Token count (weight: 0.35)
  if (signals.tokenCount >= COMPLEX_TOKEN_FLOOR) {
    score += 0.35;
  } else if (signals.tokenCount > SIMPLE_TOKEN_CEILING) {
    const ratio =
      (signals.tokenCount - SIMPLE_TOKEN_CEILING) / (COMPLEX_TOKEN_FLOOR - SIMPLE_TOKEN_CEILING);
    score += ratio * 0.35;
  }

  // Keyword complexity (weight: 0.30)
  score += signals.keywordComplexity * 0.3;

  // Multi-turn (weight: 0.15)
  if (signals.hasMultiTurn) {
    score += 0.15;
  }

  // System prompt (weight: 0.10)
  if (signals.hasSystemPrompt) {
    score += 0.1;
  }

  // Message count (weight: 0.10)
  score += Math.min(signals.messageCount / 10, 1) * 0.1;

  return score;
}

function scoreToLevel(score: number): ComplexityLevel {
  if (score < 0.33) return 'simple';
  if (score < 0.66) return 'moderate';
  return 'complex';
}

function computeConfidence(score: number, level: ComplexityLevel): number {
  if (level === 'simple') {
    return Math.max(0, Math.min(1, 1 - score / 0.33));
  }
  if (level === 'complex') {
    return Math.max(0, Math.min(1, (score - 0.66) / 0.34));
  }
  // moderate
  const distToSimple = score - 0.33;
  const distToComplex = 0.66 - score;
  return Math.max(0, Math.min(1, Math.min(distToSimple, distToComplex) / 0.165));
}
