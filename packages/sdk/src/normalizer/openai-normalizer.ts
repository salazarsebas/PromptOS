import type { NormalizedMessage } from '@promptos/shared';

interface OpenAITextContent {
  type: 'text';
  text: string;
}

interface OpenAIMessage {
  role: string;
  content: string | OpenAITextContent[] | null;
}

export function normalizeOpenAIMessages(messages: OpenAIMessage[]): NormalizedMessage[] {
  const result: NormalizedMessage[] = [];

  for (const msg of messages) {
    const role = normalizeRole(msg.role);
    const content = extractContent(msg.content);
    if (content !== undefined) {
      result.push({ role, content });
    }
  }

  return result;
}

export function denormalizeToOpenAI(
  messages: NormalizedMessage[],
): Array<{ role: string; content: string }> {
  return messages.map((m) => ({ role: m.role, content: m.content }));
}

function normalizeRole(role: string): NormalizedMessage['role'] {
  if (role === 'system' || role === 'user' || role === 'assistant') {
    return role;
  }
  return 'user';
}

function extractContent(content: string | OpenAITextContent[] | null): string {
  if (content === null || content === undefined) return '';
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .filter((part): part is OpenAITextContent => part.type === 'text')
      .map((part) => part.text)
      .join('\n');
  }
  return '';
}
