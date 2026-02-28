import type { NormalizedMessage } from '@promptos/shared';
interface OpenAITextContent {
  type: 'text';
  text: string;
}
interface OpenAIMessage {
  role: string;
  content: string | OpenAITextContent[] | null;
}
export declare function normalizeOpenAIMessages(messages: OpenAIMessage[]): NormalizedMessage[];
export declare function denormalizeToOpenAI(messages: NormalizedMessage[]): Array<{
  role: string;
  content: string;
}>;
//# sourceMappingURL=openai-normalizer.d.ts.map
