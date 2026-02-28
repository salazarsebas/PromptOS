import type { CallCategory, Provider } from '@prompt-os/shared';
import { getDefaultModel, PROVIDERS } from '@prompt-os/shared';
import type { CallExpression } from 'ts-morph';
import { SyntaxKind } from 'ts-morph';

export interface PatternMatch {
  provider: Provider;
  fullMethodChain: string;
  category: CallCategory;
  modelArgument?: string;
  inferredModel: string;
  confidence: 'high' | 'medium' | 'low';
}

export function matchCallExpression(
  callExpr: CallExpression,
  activeProviders: Provider[],
): PatternMatch | null {
  const expressionText = callExpr.getExpression().getText();

  for (const providerName of activeProviders) {
    const providerInfo = PROVIDERS.find((p) => p.name === providerName);
    if (!providerInfo) continue;

    for (const pattern of providerInfo.callPatterns) {
      if (matchesPattern(expressionText, pattern.objectPattern, pattern.methodName)) {
        const modelArg = extractModelArgument(callExpr);
        return {
          provider: providerName,
          fullMethodChain: expressionText,
          category: pattern.category,
          modelArgument: modelArg ?? undefined,
          inferredModel: modelArg ?? getDefaultModel(providerName, pattern.category),
          confidence: modelArg ? 'high' : 'medium',
        };
      }
    }
  }

  return null;
}

const patternCache = new Map<string, RegExp>();

function matchesPattern(
  expressionText: string,
  objectPattern: string,
  methodName: string,
): boolean {
  const cacheKey = `${objectPattern}::${methodName}`;
  let regex = patternCache.get(cacheKey);
  if (!regex) {
    const patternParts = objectPattern.replaceAll('*', '[\\w$]+').replaceAll('.', '\\.');
    const fullPattern = methodName ? `${patternParts}\\.${methodName}` : patternParts;
    regex = new RegExp(`^${fullPattern}$`);
    patternCache.set(cacheKey, regex);
  }
  return regex.test(expressionText);
}

function extractModelArgument(callExpr: CallExpression): string | null {
  const args = callExpr.getArguments();
  if (args.length === 0) return null;

  const firstArg = args[0];

  if (firstArg?.isKind(SyntaxKind.ObjectLiteralExpression)) {
    const modelProp = firstArg.getProperty('model');
    if (modelProp?.isKind(SyntaxKind.PropertyAssignment)) {
      const initializer = modelProp.getInitializer();
      if (initializer?.isKind(SyntaxKind.StringLiteral)) {
        return initializer.getLiteralValue();
      }
    }
  }

  return null;
}
