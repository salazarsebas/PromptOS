import type { SourceFile } from 'ts-morph';
export interface MessageContent {
  role: string;
  content: string;
}
/**
 * Find the CallExpression node at a given source line.
 */
export declare function findCallAtLine(
  sourceFile: SourceFile,
  line: number,
): import('ts-morph').CallExpression | null;
/**
 * Find a CallExpression near a given line (within +/- tolerance).
 * Returns the first matching call that has an object literal first argument with a `messages` property.
 */
export declare function findApiCallNearLine(
  sourceFile: SourceFile,
  line: number,
  tolerance?: number,
): import('ts-morph').CallExpression | null;
/**
 * Extract all message content strings from a CallExpression's messages array.
 */
export declare function extractMessageContents(
  callExpr: import('ts-morph').CallExpression,
): MessageContent[];
//# sourceMappingURL=ast-utils.d.ts.map
