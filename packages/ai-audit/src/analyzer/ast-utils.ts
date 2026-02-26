import type { SourceFile } from 'ts-morph';
import { SyntaxKind } from 'ts-morph';

export interface MessageContent {
  role: string;
  content: string;
}

/**
 * Find the CallExpression node at a given source line.
 */
export function findCallAtLine(
  sourceFile: SourceFile,
  line: number,
): import('ts-morph').CallExpression | null {
  const callExpressions = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
  for (const callExpr of callExpressions) {
    const callLine = sourceFile.getLineAndColumnAtPos(callExpr.getStart()).line;
    if (callLine === line) return callExpr;
  }
  return null;
}

/**
 * Find a CallExpression near a given line (within +/- tolerance).
 * Returns the first matching call that has an object literal first argument with a `messages` property.
 */
export function findApiCallNearLine(
  sourceFile: SourceFile,
  line: number,
  tolerance = 5,
): import('ts-morph').CallExpression | null {
  const callExpressions = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
  for (const callExpr of callExpressions) {
    const callLine = sourceFile.getLineAndColumnAtPos(callExpr.getStart()).line;
    if (Math.abs(callLine - line) > tolerance) continue;

    const messagesArray = extractMessagesArray(callExpr);
    if (messagesArray) return callExpr;
  }
  return null;
}

/**
 * Extract the `messages` ArrayLiteralExpression from a call like:
 *   openai.chat.completions.create({ messages: [...] })
 */
function extractMessagesArray(
  callExpr: import('ts-morph').CallExpression,
): import('ts-morph').ArrayLiteralExpression | null {
  const args = callExpr.getArguments();
  if (args.length === 0) return null;

  const firstArg = args[0];
  if (!firstArg?.isKind(SyntaxKind.ObjectLiteralExpression)) return null;

  const messagesProp = firstArg.getProperty('messages');
  if (!messagesProp?.isKind(SyntaxKind.PropertyAssignment)) return null;

  const initializer = messagesProp.getInitializer();
  if (!initializer?.isKind(SyntaxKind.ArrayLiteralExpression)) return null;

  return initializer;
}

/**
 * Extract all message content strings from a CallExpression's messages array.
 */
export function extractMessageContents(
  callExpr: import('ts-morph').CallExpression,
): MessageContent[] {
  const messagesArray = extractMessagesArray(callExpr);
  if (!messagesArray) return [];

  const contents: MessageContent[] = [];

  for (const element of messagesArray.getElements()) {
    if (!element.isKind(SyntaxKind.ObjectLiteralExpression)) continue;

    const roleProp = element.getProperty('role');
    const contentProp = element.getProperty('content');

    const role = extractStringLiteralValue(roleProp);
    const content = extractStringLiteralValue(contentProp);

    if (role !== null && content !== null) {
      contents.push({ role, content });
    }
  }

  return contents;
}

function extractStringLiteralValue(
  prop: import('ts-morph').PropertyAssignment | import('ts-morph').Node | undefined,
): string | null {
  if (!prop?.isKind(SyntaxKind.PropertyAssignment)) return null;
  const initializer = prop.getInitializer();
  if (!initializer?.isKind(SyntaxKind.StringLiteral)) return null;
  return initializer.getLiteralValue();
}
