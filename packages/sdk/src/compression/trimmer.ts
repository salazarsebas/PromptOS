import type { CompressionStrategy, NormalizedMessage } from '@promptos/shared';
import { estimateTokens } from '@promptos/shared';

export function compressMessages(
  messages: NormalizedMessage[],
  maxTokens: number,
  strategy: CompressionStrategy = 'trim',
): NormalizedMessage[] {
  if (strategy === 'none' || messages.length === 0) return messages;

  const totalTokens = countTokens(messages);
  if (totalTokens <= maxTokens) return messages;

  const result = messages.map((m) => ({ ...m }));

  if (strategy === 'sentence') {
    return compressBySentence(result, maxTokens);
  }

  return compressByTrim(result, maxTokens);
}

function compressByTrim(messages: NormalizedMessage[], maxTokens: number): NormalizedMessage[] {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (!msg || msg.role === 'system') continue;

    // Use codepoint-aware slicing to avoid splitting surrogate pairs
    let codepoints = Array.from(msg.content);
    let currentTotal = countTokens(messages);

    while (currentTotal > maxTokens && codepoints.length > 0) {
      const overage = currentTotal - maxTokens;
      // Estimate chars to remove (4 chars ≈ 1 token)
      const cpToRemove = Math.max(1, overage * 4);
      codepoints = codepoints.slice(0, -cpToRemove);
      msg.content = codepoints.join('');
      currentTotal = countTokens(messages);
    }

    if (currentTotal <= maxTokens) break;
  }

  return messages;
}

function compressBySentence(messages: NormalizedMessage[], maxTokens: number): NormalizedMessage[] {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (!msg || msg.role === 'system') continue;

    const sentences = splitSentences(msg.content);

    while (sentences.length > 1 && countTokens(messages) > maxTokens) {
      sentences.pop();
      msg.content = sentences.join('');
    }

    if (countTokens(messages) <= maxTokens) break;
  }

  return messages;
}

// Common abbreviations that shouldn't be treated as sentence endings
const ABBREVIATIONS = new Set([
  'mr',
  'mrs',
  'ms',
  'dr',
  'prof',
  'sr',
  'jr',
  'st',
  'ave',
  'vs',
  'etc',
  'inc',
  'ltd',
  'corp',
  'dept',
  'univ',
  'govt',
  'approx',
  'est',
  'vol',
  'no',
  'fig',
  'eq',
  'e.g',
  'i.e',
]);

function splitSentences(text: string): string[] {
  const result: string[] = [];
  const pattern = /[^.!?]*[.!?]+\s*/g;
  let lastIndex = 0;

  for (let match = pattern.exec(text); match !== null; match = pattern.exec(text)) {
    const segment = match[0];

    // Check if this ends with an abbreviation (e.g., "Mr. ")
    const wordBeforePeriod =
      segment
        .trimEnd()
        .replace(/[.!?]+$/, '')
        .split(/\s+/)
        .pop() ?? '';
    const isAbbreviation = ABBREVIATIONS.has(wordBeforePeriod.toLowerCase());

    if (isAbbreviation && result.length === 0) {
      // First segment with abbreviation — accumulate into buffer
      result.push(segment);
    } else if (isAbbreviation && result.length > 0) {
      // Merge abbreviation into previous segment
      result[result.length - 1] += segment;
    } else if (result.length > 0 && isTrailingAbbreviation(result[result.length - 1] ?? '')) {
      // Previous segment ended with abbreviation — merge
      result[result.length - 1] += segment;
    } else {
      result.push(segment);
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    result.push(text.slice(lastIndex));
  }

  return result;
}

function isTrailingAbbreviation(segment: string): boolean {
  const trimmed = segment.trimEnd();
  if (!trimmed.endsWith('.')) return false;
  const word = trimmed.replace(/\.$/, '').split(/\s+/).pop() ?? '';
  return ABBREVIATIONS.has(word.toLowerCase());
}

export function countTokens(messages: NormalizedMessage[]): number {
  return messages.reduce((sum, msg) => sum + (msg.content ? estimateTokens(msg.content) : 0), 0);
}
