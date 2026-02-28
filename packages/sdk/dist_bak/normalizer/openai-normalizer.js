export function normalizeOpenAIMessages(messages) {
  const result = [];
  for (const msg of messages) {
    const role = normalizeRole(msg.role);
    const content = extractContent(msg.content);
    if (content !== undefined) {
      result.push({ role, content });
    }
  }
  return result;
}
export function denormalizeToOpenAI(messages) {
  return messages.map((m) => ({ role: m.role, content: m.content }));
}
function normalizeRole(role) {
  if (role === 'system' || role === 'user' || role === 'assistant') {
    return role;
  }
  return 'user';
}
function extractContent(content) {
  if (content === null || content === undefined) return '';
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .filter((part) => part.type === 'text')
      .map((part) => part.text)
      .join('\n');
  }
  return '';
}
//# sourceMappingURL=openai-normalizer.js.map
