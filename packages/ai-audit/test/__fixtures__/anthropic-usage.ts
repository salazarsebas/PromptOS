import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: 'test-key' });

export async function messageCreate() {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 1024,
    messages: [{ role: 'user', content: 'Hello Claude' }],
  });
  return message;
}
