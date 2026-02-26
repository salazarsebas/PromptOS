import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: 'sk-test' });
const anthropic = new Anthropic({ apiKey: 'test-key' });

export async function getGreeting() {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: 'Say hello' }],
  });
  return response;
}

export async function translate() {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 100,
    messages: [{ role: 'user', content: 'Translate "hello" to Spanish' }],
  });
  return message;
}
