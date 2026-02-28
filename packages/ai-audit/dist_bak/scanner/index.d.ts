import type { ScanResult } from '@promptos/shared';
import type { SourceFile } from 'ts-morph';
export interface DeepScanResult {
  scanResult: ScanResult;
  sourceFiles: Map<string, SourceFile>;
}
export declare function scan(targetPath: string, ignoreDirs?: Set<string>): Promise<ScanResult>;
export declare function scanDeep(
  targetPath: string,
  ignoreDirs?: Set<string>,
): Promise<DeepScanResult>;
export declare function releaseAllSourceFiles(sourceFiles: Map<string, SourceFile>): void;
//# sourceMappingURL=index.d.ts.map
