import type { DetectedCall } from '@promptos/shared';
import type { SourceFile } from 'ts-morph';
export type { SourceFile };
export interface DeepAnalysisFileResult {
  calls: DetectedCall[];
  sourceFile: SourceFile;
}
export declare function analyzeFile(filePath: string): Promise<DetectedCall[]>;
export declare function analyzeFileDeep(filePath: string): Promise<DeepAnalysisFileResult>;
export declare function releaseSourceFile(sourceFile: SourceFile): void;
//# sourceMappingURL=ast-analyzer.d.ts.map
