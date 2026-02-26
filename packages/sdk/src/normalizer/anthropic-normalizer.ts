import type { NormalizedMessage } from '@promptos/shared';

interface AnthropicTextContent {
  type: 'text';
  text: string;
}

interface AnthropicMessage {
  role: string;
  content: string | AnthropicTextContent[];
}

interface AnthropicRequest {
  system?: string;
  messages: AnthropicMessage[];
}

export function normalizeAnthropicMessages(request: AnthropicRequest): NormalizedMessage[] {
  const result: NormalizedMessage[] = [];

  if (request.system) {
    result.push({ role: 'system', content: request.system });
  }

  for (const msg of request.messages) {
    const role = msg.role === 'assistant' ? 'assistant' : 'user';
    const content = extractContent(msg.content);
    if (content) {
      result.push({ role, content });
    }
  }

  return result;
}

export function denormalizeToAnthropic(messages: NormalizedMessage[]): AnthropicRequest {
  let system: string | undefined;
  const anthropicMessages: Array<{ role: string; content: string }> = [];

  for (const msg of messages) {
    if (msg.role === 'system') {
      system = system ? `${system}\n${msg.content}` : msg.content;
    } else {
      anthropicMessages.push({ role: msg.role, content: msg.content });
    }
  }

  return { system, messages: anthropicMessages };
}

function extractContent(content: string | AnthropicTextContent[]): string {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .filter((part): part is AnthropicTextContent => part.type === 'text')
      .map((part) => part.text)
      .join('\n');
  }
  return '';
}
