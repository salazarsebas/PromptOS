import { encode } from 'gpt-tokenizer';

export function estimateTokens(text: string): number {
  try {
    return encode(text).length;
  } catch {
    return estimateTokensFast(text.length);
  }
}

export function estimateTokensFast(charCount: number): number {
  return Math.ceil(Math.max(0, charCount) / 4);
}
