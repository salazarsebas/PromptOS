import type { CostReport } from './cost.js';
import type { ScanResult } from './detection.js';

export interface AuditReport {
  version: string;
  timestamp: string;
  targetPath: string;
  scan: ScanResult;
  cost: CostReport;
}

export type ReportFormat = 'terminal' | 'json';
