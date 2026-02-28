import type { ReportFormat } from './report.js';
export interface PromptOSConfig {
  callsPerMonth?: number;
  avgInputTokens?: number;
  avgOutputTokens?: number;
  format?: ReportFormat;
  deep?: boolean;
  promptTokenThreshold?: number;
  exclude?: string[];
}
//# sourceMappingURL=config.d.ts.map
