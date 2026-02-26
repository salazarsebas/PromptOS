import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: 'sk-test' });

export async function chatCompletion() {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: 'Hello' }],
  });
  return response;
}

export async function embedding() {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: 'Some text to embed',
  });
  return response;
}

export async function miniChat() {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: 'Quick question' }],
  });
  return response;
}
