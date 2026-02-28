import { encode } from 'gpt-tokenizer';
export function estimateTokens(text) {
  try {
    return encode(text).length;
  } catch {
    return estimateTokensFast(text.length);
  }
}
export function estimateTokensFast(charCount) {
  return Math.ceil(Math.max(0, charCount) / 4);
}
//# sourceMappingURL=tokens.js.map
