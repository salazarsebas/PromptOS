import type { ProviderInfo } from '../types/provider.js';

export const PROVIDERS: ProviderInfo[] = [
  {
    name: 'openai',
    importPatterns: ['openai', '@openai/client'],
    callPatterns: [
      {
        objectPattern: '*.chat.completions',
        methodName: 'create',
        category: 'chat',
      },
      {
        objectPattern: '*.completions',
        methodName: 'create',
        category: 'completion',
      },
      {
        objectPattern: '*.embeddings',
        methodName: 'create',
        category: 'embedding',
      },
    ],
  },
  {
    name: 'anthropic',
    importPatterns: ['@anthropic-ai/sdk'],
    callPatterns: [
      {
        objectPattern: '*.messages',
        methodName: 'create',
        category: 'chat',
      },
      {
        objectPattern: '*.completions',
        methodName: 'create',
        category: 'completion',
      },
    ],
  },
  {
    name: 'google',
    importPatterns: ['@google/generative-ai', '@google-cloud/vertexai'],
    callPatterns: [
      {
        objectPattern: '*',
        methodName: 'generateContent',
        category: 'generation',
      },
      {
        objectPattern: '*',
        methodName: 'sendMessage',
        category: 'chat',
      },
    ],
  },
  {
    name: 'langchain',
    importPatterns: ['langchain', '@langchain/core', '@langchain/openai', '@langchain/anthropic'],
    callPatterns: [
      {
        objectPattern: '*',
        methodName: 'invoke',
        category: 'chat',
      },
      {
        objectPattern: '*',
        methodName: 'call',
        category: 'chat',
      },
    ],
  },
];
