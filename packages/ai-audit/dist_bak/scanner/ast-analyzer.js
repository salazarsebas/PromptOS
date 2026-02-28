import { PROVIDERS } from '@promptos/shared';
import { Project, SyntaxKind } from 'ts-morph';
import { matchCallExpression } from './pattern-matcher.js';

const project = new Project({
  compilerOptions: { allowJs: true, checkJs: false },
  skipAddingFilesFromTsConfig: true,
  skipFileDependencyResolution: true,
});
export async function analyzeFile(filePath) {
  const sourceFile = project.addSourceFileAtPath(filePath);
  const detected = [];
  try {
    analyzeSourceFile(sourceFile, filePath, detected);
  } finally {
    project.removeSourceFile(sourceFile);
  }
  return detected;
}
export async function analyzeFileDeep(filePath) {
  const sourceFile = project.addSourceFileAtPath(filePath);
  const calls = [];
  analyzeSourceFile(sourceFile, filePath, calls);
  return { calls, sourceFile };
}
export function releaseSourceFile(sourceFile) {
  project.removeSourceFile(sourceFile);
}
function analyzeSourceFile(sourceFile, filePath, detected) {
  const activeProviders = detectActiveProviders(sourceFile);
  if (activeProviders.length === 0) {
    return;
  }
  const callExpressions = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
  for (const callExpr of callExpressions) {
    const match = matchCallExpression(callExpr, activeProviders);
    if (match) {
      const { line, column } = sourceFile.getLineAndColumnAtPos(callExpr.getStart());
      const contextSnippet = extractContextSnippet(sourceFile, line);
      detected.push({
        filePath,
        line,
        column,
        provider: match.provider,
        method: match.fullMethodChain,
        category: match.category,
        modelArgument: match.modelArgument,
        inferredModel: match.inferredModel,
        contextSnippet,
        confidence: match.confidence,
      });
    }
  }
}
function matchesProviderImport(moduleSpecifier) {
  for (const provider of PROVIDERS) {
    const matches = provider.importPatterns.some(
      (pat) => moduleSpecifier === pat || moduleSpecifier.startsWith(`${pat}/`),
    );
    if (matches) return provider.name;
  }
  return null;
}
function addUnique(providers, name) {
  if (!providers.includes(name)) {
    providers.push(name);
  }
}
function detectActiveProviders(sourceFile) {
  const activeProviders = [];
  // Check ESM imports
  for (const importDecl of sourceFile.getImportDeclarations()) {
    const match = matchesProviderImport(importDecl.getModuleSpecifierValue());
    if (match) addUnique(activeProviders, match);
  }
  // Check require() calls
  for (const callExpr of sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression)) {
    if (callExpr.getExpression().getText() !== 'require') continue;
    const firstArg = callExpr.getArguments()[0];
    if (!firstArg?.isKind(SyntaxKind.StringLiteral)) continue;
    const match = matchesProviderImport(firstArg.getLiteralValue());
    if (match) addUnique(activeProviders, match);
  }
  return activeProviders;
}
function extractContextSnippet(sourceFile, line) {
  const fullText = sourceFile.getFullText();
  const lines = fullText.split('\n');
  const start = Math.max(0, line - 2);
  const end = Math.min(lines.length, line + 2);
  return lines.slice(start, end).join('\n');
}
//# sourceMappingURL=ast-analyzer.js.map
