import { getDefaultModel, PROVIDERS } from '@promptos/shared';
import { SyntaxKind } from 'ts-morph';
export function matchCallExpression(callExpr, activeProviders) {
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
const patternCache = new Map();
function matchesPattern(expressionText, objectPattern, methodName) {
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
function extractModelArgument(callExpr) {
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
//# sourceMappingURL=pattern-matcher.js.map
