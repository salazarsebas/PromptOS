import type { CostReport } from './cost.js';
import type { ScanResult } from './detection.js';
import type { DeepAnalysisResult } from './optimization.js';
export interface AuditReport {
  version: string;
  timestamp: string;
  targetPath: string;
  scan: ScanResult;
  cost: CostReport;
  deepAnalysis?: DeepAnalysisResult;
}
export type ReportFormat = 'terminal' | 'json' | 'markdown' | 'html';
//# sourceMappingURL=report.d.ts.map
