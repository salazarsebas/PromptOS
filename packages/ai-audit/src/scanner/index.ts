import type { DetectedCall, ScanError, ScanResult } from '@promptos/shared';
import { collectFiles } from '@promptos/shared';
import { analyzeFile } from './ast-analyzer.js';

const BATCH_SIZE = 20;

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
