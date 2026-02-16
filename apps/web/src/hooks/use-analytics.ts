'use client';

import { useState, useEffect, useCallback } from 'react';
import { useOrg } from '@/contexts/org-context';
import {
  getKPIMetrics,
  getEngagementTimeline,
  getPlatformBreakdown,
  getRiskDistribution,
  getConversionFunnel,
  getRecentActivity,
} from '@/lib/analytics/queries';
import type { TimelineDataPoint } from '@/components/analytics/engagement-chart';
import type { PlatformData } from '@/components/analytics/platform-breakdown';
import type { RiskData } from '@/components/analytics/risk-distribution';
import type { FunnelStage } from '@/components/analytics/funnel-chart';
import type { KPIData } from '@/components/analytics/kpi-cards';
import type { ActivityItem } from '@/components/analytics/activity-feed';
import type { DateRange } from '@/components/analytics/date-range-picker';

// Mock data for demo mode
const mockKPIData: KPIData = {
  postsDetected: 1234,
  responsesGenerated: 987,
  responsesApproved: 892,
  responsesPosted: 756,
  postsDetectedChange: 0.12,
  responsesGeneratedChange: 0.08,
  responsesApprovedChange: 0.15,
  responsesPostedChange: 0.22,
};

const mockTimelineData: TimelineDataPoint[] = [
  { date: 'Feb 9', postsDetected: 145, responsesGenerated: 112, responsesApproved: 98, responsesPosted: 85 },
  { date: 'Feb 10', postsDetected: 178, responsesGenerated: 145, responsesApproved: 132, responsesPosted: 118 },
  { date: 'Feb 11', postsDetected: 156, responsesGenerated: 128, responsesApproved: 115, responsesPosted: 102 },
  { date: 'Feb 12', postsDetected: 189, responsesGenerated: 156, responsesApproved: 142, responsesPosted: 125 },
  { date: 'Feb 13', postsDetected: 201, responsesGenerated: 168, responsesApproved: 155, responsesPosted: 138 },
  { date: 'Feb 14', postsDetected: 187, responsesGenerated: 152, responsesApproved: 138, responsesPosted: 122 },
  { date: 'Feb 15', postsDetected: 178, responsesGenerated: 126, responsesApproved: 112, responsesPosted: 66 },
];

const mockPlatformData: PlatformData[] = [
  { platform: 'reddit', count: 523, percentage: 42.4 },
  { platform: 'twitter', count: 312, percentage: 25.3 },
  { platform: 'quora', count: 198, percentage: 16.1 },
  { platform: 'linkedin', count: 145, percentage: 11.8 },
  { platform: 'google', count: 56, percentage: 4.5 },
];

const mockRiskData: RiskData[] = [
  { level: 'low', count: 645, percentage: 52.3 },
  { level: 'medium', count: 342, percentage: 27.7 },
  { level: 'high', count: 187, percentage: 15.2 },
  { level: 'blocked', count: 60, percentage: 4.9 },
];

const mockFunnelData: FunnelStage[] = [
  { name: 'Detected', count: 1234, percentage: 100, dropoff: 0, color: '#8884d8' },
  { name: 'Signaled', count: 1156, percentage: 93.7, dropoff: 6.3, color: '#82ca9d' },
  { name: 'Generated', count: 987, percentage: 80.0, dropoff: 14.6, color: '#ffc658' },
  { name: 'Approved', count: 892, percentage: 72.3, dropoff: 9.6, color: '#ff7c7c' },
  { name: 'Posted', count: 756, percentage: 61.3, dropoff: 15.2, color: '#00C49F' },
];

const mockActivityData: ActivityItem[] = [
  {
    id: '1',
    type: 'posted',
    platform: 'reddit',
    description: 'Response auto-posted to r/SaaS thread',
    timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
  },
  {
    id: '2',
    type: 'approved',
    platform: 'twitter',
    description: 'Response approved by reviewer',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    user: 'John',
  },
  {
    id: '3',
    type: 'detected',
    platform: 'quora',
    description: 'New high-intent post detected',
    timestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
  },
  {
    id: '4',
    type: 'generated',
    platform: 'linkedin',
    description: 'AI response generated for LinkedIn post',
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
  },
  {
    id: '5',
    type: 'rejected',
    platform: 'reddit',
    description: 'Response rejected - off-topic content',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    user: 'Sarah',
  },
  {
    id: '6',
    type: 'flagged',
    platform: 'twitter',
    description: 'High-risk response flagged for review',
    timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
  },
  {
    id: '7',
    type: 'edited',
    platform: 'quora',
    description: 'Response edited before approval',
    timestamp: new Date(Date.now() - 1000 * 60 * 38).toISOString(),
    user: 'Mike',
  },
  {
    id: '8',
    type: 'posted',
    platform: 'reddit',
    description: 'Auto-posted to r/relationships',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    id: '9',
    type: 'approved',
    platform: 'linkedin',
    description: 'Response approved for posting',
    timestamp: new Date(Date.now() - 1000 * 60 * 52).toISOString(),
    user: 'John',
  },
  {
    id: '10',
    type: 'detected',
    platform: 'twitter',
    description: 'New conversation thread detected',
    timestamp: new Date(Date.now() - 1000 * 60 * 67).toISOString(),
  },
];

export interface AnalyticsData {
  kpis: KPIData | null;
  timeline: TimelineDataPoint[] | null;
  platformBreakdown: PlatformData[] | null;
  riskDistribution: RiskData[] | null;
  funnel: FunnelStage[] | null;
  activities: ActivityItem[] | null;
}

export interface UseAnalyticsResult {
  data: AnalyticsData;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export function useAnalytics(dateRange: DateRange): UseAnalyticsResult {
  const { organization } = useOrg();
  const [data, setData] = useState<AnalyticsData>({
    kpis: null,
    timeline: null,
    platformBreakdown: null,
    riskDistribution: null,
    funnel: null,
    activities: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    // Use mock data if no organization (demo mode)
    if (!organization?.id) {
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 500));
      setData({
        kpis: mockKPIData,
        timeline: mockTimelineData,
        platformBreakdown: mockPlatformData,
        riskDistribution: mockRiskData,
        funnel: mockFunnelData,
        activities: mockActivityData,
      });
      setIsLoading(false);
      return;
    }

    try {
      const [kpisResult, timelineResult, platformResult, riskResult, funnelResult, activityResult] =
        await Promise.all([
          getKPIMetrics(organization.id, dateRange.startDate, dateRange.endDate),
          getEngagementTimeline(organization.id, dateRange.startDate, dateRange.endDate),
          getPlatformBreakdown(organization.id, dateRange.startDate, dateRange.endDate),
          getRiskDistribution(organization.id, dateRange.startDate, dateRange.endDate),
          getConversionFunnel(organization.id, dateRange.startDate, dateRange.endDate),
          getRecentActivity(organization.id, 20),
        ]);

      // Check for errors
      const firstError =
        kpisResult.error ||
        timelineResult.error ||
        platformResult.error ||
        riskResult.error ||
        funnelResult.error ||
        activityResult.error;

      if (firstError) {
        throw firstError;
      }

      setData({
        kpis: kpisResult.data,
        timeline: timelineResult.data,
        platformBreakdown: platformResult.data,
        riskDistribution: riskResult.data,
        funnel: funnelResult.data,
        activities: activityResult.data,
      });
    } catch (err) {
      setError(err as Error);
      // Fall back to mock data on error
      setData({
        kpis: mockKPIData,
        timeline: mockTimelineData,
        platformBreakdown: mockPlatformData,
        riskDistribution: mockRiskData,
        funnel: mockFunnelData,
        activities: mockActivityData,
      });
    } finally {
      setIsLoading(false);
    }
  }, [organization?.id, dateRange.startDate, dateRange.endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    refresh: fetchData,
  };
}
