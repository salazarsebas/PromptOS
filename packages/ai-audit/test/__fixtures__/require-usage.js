const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: 'sk-test' });

async function chat() {
  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: 'Hello from CJS' }],
  });
  return response;
}

module.exports = { chat };
