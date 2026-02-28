export function normalizeAnthropicMessages(request) {
  const result = [];
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
export function denormalizeToAnthropic(messages) {
  let system;
  const anthropicMessages = [];
  for (const msg of messages) {
    if (msg.role === 'system') {
      system = system ? `${system}\n${msg.content}` : msg.content;
    } else {
      anthropicMessages.push({ role: msg.role, content: msg.content });
    }
  }
  return { system, messages: anthropicMessages };
}
function extractContent(content) {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .filter((part) => part.type === 'text')
      .map((part) => part.text)
      .join('\n');
  }
  return '';
}
//# sourceMappingURL=anthropic-normalizer.js.map
