import type { CallCategory, ModelIdentifier, Provider } from './provider.js';
export interface DetectedCall {
  filePath: string;
  line: number;
  column: number;
  provider: Provider;
  method: string;
  category: CallCategory;
  modelArgument?: string;
  inferredModel: ModelIdentifier;
  contextSnippet: string;
  confidence: 'high' | 'medium' | 'low';
}
export interface ScanResult {
  scannedFiles: number;
  skippedFiles: number;
  totalCalls: number;
  calls: DetectedCall[];
  scanDurationMs: number;
  errors: ScanError[];
}
export interface ScanError {
  filePath: string;
  message: string;
}
//# sourceMappingURL=detection.d.ts.map
