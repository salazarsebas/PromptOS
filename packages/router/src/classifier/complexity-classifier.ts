import type { NormalizedMessage } from '@prompt-os/shared';
import { estimateTokens } from '@prompt-os/shared';
import type { ComplexityLevel, ComplexityResult, ComplexitySignals } from '../types.js';

const SIMPLE_TOKEN_CEILING = 500;
const COMPLEX_TOKEN_FLOOR = 2000;
const MULTI_TURN_THRESHOLD = 2;

// Scoring weights for each signal (must sum to 1.0)
const WEIGHT_TOKEN_COUNT = 0.35;
const WEIGHT_KEYWORD = 0.3;
const WEIGHT_MULTI_TURN = 0.15;
const WEIGHT_SYSTEM_PROMPT = 0.1;
const WEIGHT_MESSAGE_COUNT = 0.1;

// Thresholds for classifying the final score into levels
const SIMPLE_THRESHOLD = 0.33;
const COMPLEX_THRESHOLD = 0.66;

const MAX_MESSAGES_FOR_SCORE = 10;

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

  if (signals.tokenCount >= COMPLEX_TOKEN_FLOOR) {
    score += WEIGHT_TOKEN_COUNT;
  } else if (signals.tokenCount > SIMPLE_TOKEN_CEILING) {
    const ratio =
      (signals.tokenCount - SIMPLE_TOKEN_CEILING) / (COMPLEX_TOKEN_FLOOR - SIMPLE_TOKEN_CEILING);
    score += ratio * WEIGHT_TOKEN_COUNT;
  }

  score += signals.keywordComplexity * WEIGHT_KEYWORD;

  if (signals.hasMultiTurn) {
    score += WEIGHT_MULTI_TURN;
  }

  if (signals.hasSystemPrompt) {
    score += WEIGHT_SYSTEM_PROMPT;
  }

  score += Math.min(signals.messageCount / MAX_MESSAGES_FOR_SCORE, 1) * WEIGHT_MESSAGE_COUNT;

  return score;
}

function scoreToLevel(score: number): ComplexityLevel {
  if (score < SIMPLE_THRESHOLD) return 'simple';
  if (score < COMPLEX_THRESHOLD) return 'moderate';
  return 'complex';
}

function computeConfidence(score: number, level: ComplexityLevel): number {
  const moderateBandWidth = COMPLEX_THRESHOLD - SIMPLE_THRESHOLD;
  const halfBand = moderateBandWidth / 2;

  if (level === 'simple') {
    return Math.max(0, Math.min(1, 1 - score / SIMPLE_THRESHOLD));
  }
  if (level === 'complex') {
    return Math.max(0, Math.min(1, (score - COMPLEX_THRESHOLD) / (1 - COMPLEX_THRESHOLD)));
  }
  // moderate: confidence peaks at center of band
  const distToSimple = score - SIMPLE_THRESHOLD;
  const distToComplex = COMPLEX_THRESHOLD - score;
  return Math.max(0, Math.min(1, Math.min(distToSimple, distToComplex) / halfBand));
}
