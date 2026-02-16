import type { TimelineDataPoint } from '@/components/analytics/engagement-chart';
import type { PlatformData } from '@/components/analytics/platform-breakdown';
import type { RiskData } from '@/components/analytics/risk-distribution';
import type { FunnelStage } from '@/components/analytics/funnel-chart';
import type { KPIData } from '@/components/analytics/kpi-cards';

export interface AnalyticsExportData {
  kpis: KPIData;
  timeline: TimelineDataPoint[];
  platformBreakdown: PlatformData[];
  riskDistribution: RiskData[];
  funnel: FunnelStage[];
  dateRange: {
    startDate: string;
    endDate: string;
  };
  exportedAt: string;
}

/**
 * Convert data array to CSV string
 */
export function convertToCSV(data: Record<string, unknown>[]): string {
  if (data.length === 0 || !data[0]) return '';

  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          // Escape quotes and wrap in quotes if contains comma
          const stringValue = String(value ?? '');
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        })
        .join(',')
    ),
  ];

  return csvRows.join('\n');
}

/**
 * Export data to CSV and trigger download
 */
export function exportToCSV(data: Record<string, unknown>[], filename: string): void {
  const csv = convertToCSV(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `${filename}.csv`);
}

/**
 * Export data to JSON and trigger download
 */
export function exportToJSON(data: unknown, filename: string): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
  downloadBlob(blob, `${filename}.json`);
}

/**
 * Generate comprehensive analytics report
 */
export async function generateReport(
  data: AnalyticsExportData,
  format: 'csv' | 'json'
): Promise<void> {
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `analytics-report-${timestamp}`;

  if (format === 'json') {
    exportToJSON(data, filename);
    return;
  }

  // For CSV, create multiple sheets combined into one file
  const csvSections: string[] = [];

  // KPI Summary
  csvSections.push('=== KPI SUMMARY ===');
  csvSections.push(
    convertToCSV([
      {
        Metric: 'Posts Detected',
        Value: data.kpis.postsDetected,
        Change: formatPercentage(data.kpis.postsDetectedChange),
      },
      {
        Metric: 'Responses Generated',
        Value: data.kpis.responsesGenerated,
        Change: formatPercentage(data.kpis.responsesGeneratedChange),
      },
      {
        Metric: 'Responses Approved',
        Value: data.kpis.responsesApproved,
        Change: formatPercentage(data.kpis.responsesApprovedChange),
      },
      {
        Metric: 'Responses Posted',
        Value: data.kpis.responsesPosted,
        Change: formatPercentage(data.kpis.responsesPostedChange),
      },
    ])
  );
  csvSections.push('');

  // Timeline
  csvSections.push('=== ENGAGEMENT TIMELINE ===');
  csvSections.push(
    convertToCSV(
      data.timeline.map((point) => ({
        Date: point.date,
        'Posts Detected': point.postsDetected,
        'Responses Generated': point.responsesGenerated,
        'Responses Approved': point.responsesApproved,
        'Responses Posted': point.responsesPosted,
      }))
    )
  );
  csvSections.push('');

  // Platform Breakdown
  csvSections.push('=== PLATFORM BREAKDOWN ===');
  csvSections.push(
    convertToCSV(
      data.platformBreakdown.map((platform) => ({
        Platform: platform.platform,
        Count: platform.count,
        Percentage: `${platform.percentage.toFixed(1)}%`,
      }))
    )
  );
  csvSections.push('');

  // Risk Distribution
  csvSections.push('=== RISK DISTRIBUTION ===');
  csvSections.push(
    convertToCSV(
      data.riskDistribution.map((risk) => ({
        'Risk Level': risk.level.charAt(0).toUpperCase() + risk.level.slice(1),
        Count: risk.count,
        Percentage: `${risk.percentage.toFixed(1)}%`,
      }))
    )
  );
  csvSections.push('');

  // Funnel
  csvSections.push('=== CONVERSION FUNNEL ===');
  csvSections.push(
    convertToCSV(
      data.funnel.map((stage) => ({
        Stage: stage.name,
        Count: stage.count,
        Percentage: `${stage.percentage.toFixed(1)}%`,
        Dropoff: `${stage.dropoff.toFixed(1)}%`,
      }))
    )
  );
  csvSections.push('');

  // Metadata
  csvSections.push('=== REPORT METADATA ===');
  csvSections.push(
    convertToCSV([
      { Field: 'Date Range', Value: `${data.dateRange.startDate} to ${data.dateRange.endDate}` },
      { Field: 'Exported At', Value: data.exportedAt },
    ])
  );

  const fullCSV = csvSections.join('\n');
  const blob = new Blob([fullCSV], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `${filename}.csv`);
}

/**
 * Helper to trigger file download
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Format percentage for display
 */
function formatPercentage(value: number | undefined): string {
  if (value === undefined) return 'N/A';
  const percentage = value * 100;
  const sign = percentage >= 0 ? '+' : '';
  return `${sign}${percentage.toFixed(1)}%`;
}
