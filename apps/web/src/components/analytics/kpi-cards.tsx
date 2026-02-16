'use client';

import { MetricCard } from './metric-card';

export interface KPIData {
  postsDetected: number;
  responsesGenerated: number;
  responsesApproved: number;
  responsesPosted: number;
  postsDetectedChange?: number;
  responsesGeneratedChange?: number;
  responsesApprovedChange?: number;
  responsesPostedChange?: number;
}

export interface KPICardsProps {
  data: KPIData;
  loading?: boolean;
}

export function KPICards({ data, loading = false }: KPICardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
      <MetricCard
        title="Posts Detected"
        value={data.postsDetected}
        change={data.postsDetectedChange}
        changeLabel="vs previous period"
        loading={loading}
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
        }
      />
      <MetricCard
        title="Responses Generated"
        value={data.responsesGenerated}
        change={data.responsesGeneratedChange}
        changeLabel="vs previous period"
        loading={loading}
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
        }
      />
      <MetricCard
        title="Approved"
        value={data.responsesApproved}
        change={data.responsesApprovedChange}
        changeLabel="vs previous period"
        loading={loading}
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        }
      />
      <MetricCard
        title="Posted"
        value={data.responsesPosted}
        change={data.responsesPostedChange}
        changeLabel="vs previous period"
        loading={loading}
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 11l5-5m0 0l5 5m-5-5v12"
            />
          </svg>
        }
      />
    </div>
  );
}
