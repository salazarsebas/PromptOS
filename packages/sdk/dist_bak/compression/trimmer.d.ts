import type { CompressionStrategy, NormalizedMessage } from '@promptos/shared';
export declare function compressMessages(
  messages: NormalizedMessage[],
  maxTokens: number,
  strategy?: CompressionStrategy,
): NormalizedMessage[];
export declare function countTokens(messages: NormalizedMessage[]): number;
//# sourceMappingURL=trimmer.d.ts.map
