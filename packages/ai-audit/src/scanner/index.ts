import type { DetectedCall, ScanError, ScanResult } from '@promptos/shared';
import { collectFiles } from '@promptos/shared';
import type { SourceFile } from 'ts-morph';
import { analyzeFile, analyzeFileDeep, releaseSourceFile } from './ast-analyzer.js';

const BATCH_SIZE = 20;

export interface DeepScanResult {
  scanResult: ScanResult;
  sourceFiles: Map<string, SourceFile>;
}

export async function scan(targetPath: string): Promise<ScanResult> {
  const start = performance.now();
  const files = await collectFiles(targetPath);
  const calls: DetectedCall[] = [];
  const errors: ScanError[] = [];
  let skippedFiles = 0;

  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(batch.map((filePath) => analyzeFile(filePath)));

    for (let j = 0; j < results.length; j++) {
      const result = results[j];
      if (result?.status === 'fulfilled') {
        calls.push(...result.value);
      } else if (result?.status === 'rejected') {
        const filePath = batch[j];
        if (filePath) {
          errors.push({
            filePath,
            message: result.reason?.message ?? 'Unknown error',
          });
        }
        skippedFiles++;
      }
    }
  }

  return {
    scannedFiles: files.length - skippedFiles,
    skippedFiles,
    totalCalls: calls.length,
    calls,
    scanDurationMs: performance.now() - start,
    errors,
  };
}

export async function scanDeep(targetPath: string): Promise<DeepScanResult> {
  const start = performance.now();
  const files = await collectFiles(targetPath);
  const calls: DetectedCall[] = [];
  const errors: ScanError[] = [];
  const sourceFiles = new Map<string, SourceFile>();
  let skippedFiles = 0;

  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(batch.map((filePath) => analyzeFileDeep(filePath)));

    for (let j = 0; j < results.length; j++) {
      const result = results[j];
      const filePath = batch[j];
      if (!filePath) continue;

      if (result?.status === 'fulfilled') {
        processDeepResult(result.value, filePath, calls, sourceFiles);
      } else if (result?.status === 'rejected') {
        errors.push({ filePath, message: result.reason?.message ?? 'Unknown error' });
        skippedFiles++;
      }
    }
  }

  return {
    scanResult: {
      scannedFiles: files.length - skippedFiles,
      skippedFiles,
      totalCalls: calls.length,
      calls,
      scanDurationMs: performance.now() - start,
      errors,
    },
    sourceFiles,
  };
}

function processDeepResult(
  value: { calls: DetectedCall[]; sourceFile: SourceFile },
  filePath: string,
  calls: DetectedCall[],
  sourceFiles: Map<string, SourceFile>,
): void {
  calls.push(...value.calls);
  if (value.calls.length > 0) {
    sourceFiles.set(filePath, value.sourceFile);
  } else {
    releaseSourceFile(value.sourceFile);
  }
}

export function releaseAllSourceFiles(sourceFiles: Map<string, SourceFile>): void {
  for (const sf of sourceFiles.values()) {
    releaseSourceFile(sf);
  }
  sourceFiles.clear();
}
