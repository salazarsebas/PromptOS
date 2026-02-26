import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI('test-key');
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

export async function generateContent() {
  const result = await model.generateContent('Hello Gemini');
  return result;
}
