import { createClient } from '@/lib/supabase/client';
import type { RiskLevel, DailyMetrics, AuditLog } from 'shared-types';
import type { TimelineDataPoint } from '@/components/analytics/engagement-chart';
import type { PlatformData } from '@/components/analytics/platform-breakdown';
import type { RiskData } from '@/components/analytics/risk-distribution';
import type { FunnelStage } from '@/components/analytics/funnel-chart';
import type { KPIData } from '@/components/analytics/kpi-cards';
import type { ActivityItem } from '@/components/analytics/activity-feed';

export interface AnalyticsQueryResult<T> {
  data: T | null;
  error: Error | null;
}

/**
 * Get KPI metrics for a date range
 */
export async function getKPIMetrics(
  orgId: string,
  startDate: Date,
  endDate: Date
): Promise<AnalyticsQueryResult<KPIData>> {
  const supabase = createClient();

  try {
    const { data: currentMetrics, error } = await supabase
      .from('daily_metrics')
      .select('*')
      .eq('organization_id', orgId)
      .gte('metric_date', startDate.toISOString().split('T')[0])
      .lte('metric_date', endDate.toISOString().split('T')[0]);

    if (error) throw error;

    // Calculate previous period for comparison
    const periodLength = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const prevStartDate = new Date(startDate.getTime() - periodLength * 24 * 60 * 60 * 1000);
    const prevEndDate = new Date(startDate.getTime() - 1);

    const { data: prevMetrics } = await supabase
      .from('daily_metrics')
      .select('*')
      .eq('organization_id', orgId)
      .gte('metric_date', prevStartDate.toISOString().split('T')[0])
      .lte('metric_date', prevEndDate.toISOString().split('T')[0]);

    // Aggregate current period
    const current = aggregateMetrics(currentMetrics || []);
    const previous = aggregateMetrics(prevMetrics || []);

    // Calculate percentage changes
    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 1 : 0;
      return (current - previous) / previous;
    };

    return {
      data: {
        postsDetected: current.postsDetected,
        responsesGenerated: current.responsesGenerated,
        responsesApproved: current.responsesApproved,
        responsesPosted: current.responsesPosted,
        postsDetectedChange: calculateChange(current.postsDetected, previous.postsDetected),
        responsesGeneratedChange: calculateChange(
          current.responsesGenerated,
          previous.responsesGenerated
        ),
        responsesApprovedChange: calculateChange(
          current.responsesApproved,
          previous.responsesApproved
        ),
        responsesPostedChange: calculateChange(current.responsesPosted, previous.responsesPosted),
      },
      error: null,
    };
  } catch (err) {
    return { data: null, error: err as Error };
  }
}

/**
 * Get engagement timeline data
 */
export async function getEngagementTimeline(
  orgId: string,
  startDate: Date,
  endDate: Date
): Promise<AnalyticsQueryResult<TimelineDataPoint[]>> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('daily_metrics')
      .select('*')
      .eq('organization_id', orgId)
      .gte('metric_date', startDate.toISOString().split('T')[0])
      .lte('metric_date', endDate.toISOString().split('T')[0])
      .order('metric_date', { ascending: true });

    if (error) throw error;

    const timeline: TimelineDataPoint[] = (data || []).map((metric: DailyMetrics) => ({
      date: formatDateLabel(metric.metric_date),
      postsDetected: metric.posts_detected,
      responsesGenerated: metric.responses_generated,
      responsesApproved: metric.responses_approved,
      responsesPosted: metric.responses_auto_posted + metric.responses_manually_posted,
    }));

    return { data: timeline, error: null };
  } catch (err) {
    return { data: null, error: err as Error };
  }
}

/**
 * Get platform breakdown
 */
export async function getPlatformBreakdown(
  orgId: string,
  startDate: Date,
  endDate: Date
): Promise<AnalyticsQueryResult<PlatformData[]>> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('daily_metrics')
      .select('platform_breakdown')
      .eq('organization_id', orgId)
      .gte('metric_date', startDate.toISOString().split('T')[0])
      .lte('metric_date', endDate.toISOString().split('T')[0]);

    if (error) throw error;

    // Aggregate platform breakdowns
    const platformCounts: Record<string, number> = {};
    (data || []).forEach((metric: { platform_breakdown: Record<string, number> | null }) => {
      if (metric.platform_breakdown) {
        Object.entries(metric.platform_breakdown).forEach(([platform, count]) => {
          platformCounts[platform] = (platformCounts[platform] || 0) + count;
        });
      }
    });

    const total = Object.values(platformCounts).reduce((sum, count) => sum + count, 0);
    const platformData: PlatformData[] = Object.entries(platformCounts)
      .map(([platform, count]) => ({
        platform,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);

    return { data: platformData, error: null };
  } catch (err) {
    return { data: null, error: err as Error };
  }
}

/**
 * Get risk distribution
 */
export async function getRiskDistribution(
  orgId: string,
  startDate: Date,
  endDate: Date
): Promise<AnalyticsQueryResult<RiskData[]>> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('daily_metrics')
      .select('risk_breakdown')
      .eq('organization_id', orgId)
      .gte('metric_date', startDate.toISOString().split('T')[0])
      .lte('metric_date', endDate.toISOString().split('T')[0]);

    if (error) throw error;

    // Aggregate risk breakdowns
    const riskCounts: Record<RiskLevel, number> = {
      low: 0,
      medium: 0,
      high: 0,
      blocked: 0,
    };

    (data || []).forEach((metric: { risk_breakdown: Record<RiskLevel, number> | null }) => {
      if (metric.risk_breakdown) {
        Object.entries(metric.risk_breakdown).forEach(([level, count]) => {
          riskCounts[level as RiskLevel] = (riskCounts[level as RiskLevel] || 0) + count;
        });
      }
    });

    const total = Object.values(riskCounts).reduce((sum, count) => sum + count, 0);
    const riskData: RiskData[] = (['low', 'medium', 'high', 'blocked'] as RiskLevel[]).map(
      (level) => ({
        level,
        count: riskCounts[level],
        percentage: total > 0 ? (riskCounts[level] / total) * 100 : 0,
      })
    );

    return { data: riskData, error: null };
  } catch (err) {
    return { data: null, error: err as Error };
  }
}

/**
 * Get conversion funnel data
 */
export async function getConversionFunnel(
  orgId: string,
  startDate: Date,
  endDate: Date
): Promise<AnalyticsQueryResult<FunnelStage[]>> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('daily_metrics')
      .select('*')
      .eq('organization_id', orgId)
      .gte('metric_date', startDate.toISOString().split('T')[0])
      .lte('metric_date', endDate.toISOString().split('T')[0]);

    if (error) throw error;

    const aggregated = aggregateMetrics(data || []);
    const total = aggregated.postsDetected || 1;

    const funnel: FunnelStage[] = [
      {
        name: 'Detected',
        count: aggregated.postsDetected,
        percentage: 100,
        dropoff: 0,
        color: '#8884d8',
      },
      {
        name: 'Signaled',
        count: aggregated.signalsGenerated,
        percentage: (aggregated.signalsGenerated / total) * 100,
        dropoff:
          aggregated.postsDetected > 0
            ? ((aggregated.postsDetected - aggregated.signalsGenerated) / aggregated.postsDetected) *
              100
            : 0,
        color: '#82ca9d',
      },
      {
        name: 'Generated',
        count: aggregated.responsesGenerated,
        percentage: (aggregated.responsesGenerated / total) * 100,
        dropoff:
          aggregated.signalsGenerated > 0
            ? ((aggregated.signalsGenerated - aggregated.responsesGenerated) /
                aggregated.signalsGenerated) *
              100
            : 0,
        color: '#ffc658',
      },
      {
        name: 'Approved',
        count: aggregated.responsesApproved,
        percentage: (aggregated.responsesApproved / total) * 100,
        dropoff:
          aggregated.responsesGenerated > 0
            ? ((aggregated.responsesGenerated - aggregated.responsesApproved) /
                aggregated.responsesGenerated) *
              100
            : 0,
        color: '#ff7c7c',
      },
      {
        name: 'Posted',
        count: aggregated.responsesPosted,
        percentage: (aggregated.responsesPosted / total) * 100,
        dropoff:
          aggregated.responsesApproved > 0
            ? ((aggregated.responsesApproved - aggregated.responsesPosted) /
                aggregated.responsesApproved) *
              100
            : 0,
        color: '#00C49F',
      },
    ];

    return { data: funnel, error: null };
  } catch (err) {
    return { data: null, error: err as Error };
  }
}

/**
 * Get recent activity from audit log
 */
export async function getRecentActivity(
  orgId: string,
  limit: number = 20
): Promise<AnalyticsQueryResult<ActivityItem[]>> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('audit_log')
      .select(
        `
        id,
        action_type,
        entity_type,
        action_data,
        created_at,
        users:user_id (
          full_name,
          email
        )
      `
      )
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    const activities: ActivityItem[] = (data || []).map((log) => {
      const actionData = log.action_data as Record<string, unknown> | null;
      const users = log.users as { full_name: string | null; email: string } | null;
      return {
        id: log.id as string,
        type: mapActionToActivityType(log.action_type as string),
        platform: actionData?.platform as string | undefined,
        description: generateActivityDescription({
          action_type: log.action_type as string,
          action_data: actionData,
        }),
        timestamp: log.created_at as string,
        user: users?.full_name || users?.email?.split('@')[0] || undefined,
      };
    });

    return { data: activities, error: null };
  } catch (err) {
    return { data: null, error: err as Error };
  }
}

// Helper functions

function aggregateMetrics(metrics: DailyMetrics[]) {
  return metrics.reduce(
    (acc, metric) => ({
      postsDetected: acc.postsDetected + metric.posts_detected,
      signalsGenerated: acc.signalsGenerated + metric.signals_generated,
      responsesGenerated: acc.responsesGenerated + metric.responses_generated,
      responsesApproved: acc.responsesApproved + metric.responses_approved,
      responsesRejected: acc.responsesRejected + metric.responses_rejected,
      responsesPosted:
        acc.responsesPosted + metric.responses_auto_posted + metric.responses_manually_posted,
    }),
    {
      postsDetected: 0,
      signalsGenerated: 0,
      responsesGenerated: 0,
      responsesApproved: 0,
      responsesRejected: 0,
      responsesPosted: 0,
    }
  );
}

function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function mapActionToActivityType(
  actionType: string
): 'detected' | 'generated' | 'approved' | 'rejected' | 'posted' | 'edited' | 'flagged' {
  const mapping: Record<string, ActivityItem['type']> = {
    post_detected: 'detected',
    signal_created: 'detected',
    response_generated: 'generated',
    response_approved: 'approved',
    response_rejected: 'rejected',
    response_posted: 'posted',
    response_edited: 'edited',
    response_flagged: 'flagged',
    auto_post: 'posted',
  };
  return mapping[actionType] || 'detected';
}

function generateActivityDescription(log: { action_type: string; action_data: Record<string, unknown> | null }): string {
  const platform = log.action_data?.platform as string | undefined;

  const descriptions: Record<string, string> = {
    post_detected: `New post detected${platform ? ` on ${platform}` : ''}`,
    signal_created: `Signal analyzed${platform ? ` from ${platform}` : ''}`,
    response_generated: `Response generated${platform ? ` for ${platform} post` : ''}`,
    response_approved: `Response approved${platform ? ` for ${platform}` : ''}`,
    response_rejected: `Response rejected${platform ? ` for ${platform}` : ''}`,
    response_posted: `Response posted${platform ? ` to ${platform}` : ''}`,
    response_edited: `Response edited${platform ? ` for ${platform}` : ''}`,
    response_flagged: `Response flagged for review${platform ? ` (${platform})` : ''}`,
    auto_post: `Auto-posted response${platform ? ` to ${platform}` : ''}`,
  };

  return descriptions[log.action_type] || `Activity: ${log.action_type}`;
}
