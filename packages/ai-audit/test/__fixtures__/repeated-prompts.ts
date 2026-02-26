import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: 'sk-test' });

export async function askQuestion(question: string) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: 'You are a helpful assistant that answers questions concisely.' },
      { role: 'user', content: question },
    ],
  });
  return response;
}

export async function askFollowUp(question: string) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: 'You are a helpful assistant that answers questions concisely.' },
      { role: 'user', content: question },
    ],
  });
  return response;
}

export async function askThird(question: string) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: 'You are a helpful assistant that answers questions concisely.' },
      { role: 'user', content: question },
    ],
  });
  return response;
}
