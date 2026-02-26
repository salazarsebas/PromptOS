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
  // Trim from the last user message working backwards
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (!msg || msg.role === 'system') continue;

    while (countTokens(messages) > maxTokens && msg.content.length > 0) {
      const overage = countTokens(messages) - maxTokens;
      const charsToRemove = Math.max(1, overage * 4);
      msg.content = msg.content.slice(0, -charsToRemove);
    }

    if (countTokens(messages) <= maxTokens) break;
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

function splitSentences(text: string): string[] {
  const result: string[] = [];
  const pattern = /[^.!?]*[.!?]+\s*/g;
  let lastIndex = 0;

  for (let match = pattern.exec(text); match !== null; match = pattern.exec(text)) {
    result.push(match[0]);
    lastIndex = pattern.lastIndex;
  }

  // Remaining text without sentence-ending punctuation
  if (lastIndex < text.length) {
    result.push(text.slice(lastIndex));
  }

  return result;
}

export function countTokens(messages: NormalizedMessage[]): number {
  return messages.reduce((sum, msg) => sum + (msg.content ? estimateTokens(msg.content) : 0), 0);
}
