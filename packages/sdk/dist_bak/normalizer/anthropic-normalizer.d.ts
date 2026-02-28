import type { NormalizedMessage } from '@promptos/shared';
interface AnthropicTextContent {
  type: 'text';
  text: string;
}
interface AnthropicMessage {
  role: string;
  content: string | AnthropicTextContent[];
}
interface AnthropicRequest {
  system?: string;
  messages: AnthropicMessage[];
}
export declare function normalizeAnthropicMessages(request: AnthropicRequest): NormalizedMessage[];
export declare function denormalizeToAnthropic(messages: NormalizedMessage[]): AnthropicRequest;
//# sourceMappingURL=anthropic-normalizer.d.ts.map
