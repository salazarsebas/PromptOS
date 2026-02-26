export type Provider = 'openai' | 'anthropic' | 'google' | 'langchain' | 'unknown';

export type OpenAIModel =
  | 'gpt-4o'
  | 'gpt-4o-mini'
  | 'gpt-4-turbo'
  | 'gpt-3.5-turbo'
  | 'o1'
  | 'o1-mini'
  | 'o3-mini'
  | 'text-embedding-3-small'
  | 'text-embedding-3-large'
  | 'text-embedding-ada-002';

export type AnthropicModel =
  | 'claude-opus-4-5'
  | 'claude-sonnet-4-5'
  | 'claude-haiku-4-5'
  | 'claude-3-opus'
  | 'claude-3-sonnet'
  | 'claude-3-haiku';

export type GoogleModel = 'gemini-2.5-pro' | 'gemini-2.5-flash' | 'gemini-2.0-flash';

export type ModelIdentifier = OpenAIModel | AnthropicModel | GoogleModel | string;

export type CallCategory = 'chat' | 'embedding' | 'completion' | 'generation' | 'other';

export interface CallPattern {
  objectPattern: string;
  methodName: string;
  category: CallCategory;
}

export interface ProviderInfo {
  name: Provider;
  importPatterns: string[];
  callPatterns: CallPattern[];
}
