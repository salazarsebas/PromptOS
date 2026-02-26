import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: 'sk-test' });

export async function processItems(items: string[]) {
  const results = [];
  for (const item of items) {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: item }],
    });
    results.push(response);
  }
  return results;
}

export async function processWithMap(items: string[]) {
  return items.map(async (item) => {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: item }],
    });
    return response;
  });
}
