import { encode } from 'gpt-tokenizer';

export function estimateTokens(text: string): number {
  return encode(text).length;
}

export function estimateTokensFast(charCount: number): number {
  return Math.ceil(charCount / 4);
}
