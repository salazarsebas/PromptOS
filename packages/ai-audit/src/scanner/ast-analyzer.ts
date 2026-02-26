import type { DetectedCall, Provider } from '@promptos/shared';
import { PROVIDERS } from '@promptos/shared';
import type { SourceFile } from 'ts-morph';
import { Project, SyntaxKind } from 'ts-morph';
import { matchCallExpression } from './pattern-matcher.js';

export type { SourceFile };

const project = new Project({
  compilerOptions: { allowJs: true, checkJs: false },
  skipAddingFilesFromTsConfig: true,
  skipFileDependencyResolution: true,
});

export interface DeepAnalysisFileResult {
  calls: DetectedCall[];
  sourceFile: SourceFile;
}

export async function analyzeFile(filePath: string): Promise<DetectedCall[]> {
  const sourceFile = project.addSourceFileAtPath(filePath);
  const detected: DetectedCall[] = [];

  try {
    analyzeSourceFile(sourceFile, filePath, detected);
  } finally {
    project.removeSourceFile(sourceFile);
  }

  return detected;
}

export async function analyzeFileDeep(filePath: string): Promise<DeepAnalysisFileResult> {
  const sourceFile = project.addSourceFileAtPath(filePath);
  const calls: DetectedCall[] = [];
  analyzeSourceFile(sourceFile, filePath, calls);
  return { calls, sourceFile };
}

export function releaseSourceFile(sourceFile: SourceFile): void {
  project.removeSourceFile(sourceFile);
}

function analyzeSourceFile(
  sourceFile: SourceFile,
  filePath: string,
  detected: DetectedCall[],
): void {
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

function matchesProviderImport(moduleSpecifier: string): Provider | null {
  for (const provider of PROVIDERS) {
    const matches = provider.importPatterns.some(
      (pat) => moduleSpecifier === pat || moduleSpecifier.startsWith(`${pat}/`),
    );
    if (matches) return provider.name;
  }
  return null;
}

function addUnique(providers: Provider[], name: Provider): void {
  if (!providers.includes(name)) {
    providers.push(name);
  }
}

function detectActiveProviders(sourceFile: SourceFile): Provider[] {
  const activeProviders: Provider[] = [];

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

function extractContextSnippet(sourceFile: SourceFile, line: number): string {
  const fullText = sourceFile.getFullText();
  const lines = fullText.split('\n');
  const start = Math.max(0, line - 2);
  const end = Math.min(lines.length, line + 2);
  return lines.slice(start, end).join('\n');
}
