'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/auth-context';
import { useOrg } from '@/contexts/org-context';
import { mockQuickStats, type QuickStat } from '@/lib/mock-data';

export interface DashboardStats {
  pendingReviews: number;
  approvedToday: number;
  autoPosted: number;
  successRate: number;
  // Changes compared to yesterday
  approvedChange: number;
  autoPostedChange: number;
  successRateChange: number;
}

export interface UseDashboardStatsResult {
  stats: QuickStat[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook to fetch real dashboard statistics from Supabase
 * Falls back to mock data in demo mode or on error
 */
export function useDashboardStats(): UseDashboardStatsResult {
  const { user, isAuthenticated } = useAuth();
  const { organization } = useOrg();
  const [stats, setStats] = useState<QuickStat[]>(mockQuickStats);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchStats = useCallback(async () => {
    // Use mock data if not authenticated or in demo mode
    if (!isAuthenticated || !user || !organization) {
      setStats(mockQuickStats);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayISO = yesterday.toISOString();

      // Fetch pending reviews count from engagement_queue (filtered by org)
      const { count: pendingCount, error: pendingError } = await supabase
        .from('engagement_queue')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organization.id)
        .eq('status', 'queued');

      if (pendingError) throw pendingError;

      // Fetch approved today count
      const { count: approvedTodayCount, error: approvedError } = await supabase
        .from('responses')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved')
        .gte('reviewed_at', todayISO);

      if (approvedError) throw approvedError;

      // Fetch approved yesterday count (for comparison)
      const { count: approvedYesterdayCount, error: approvedYestError } = await supabase
        .from('responses')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved')
        .gte('reviewed_at', yesterdayISO)
        .lt('reviewed_at', todayISO);

      if (approvedYestError) throw approvedYestError;

      // Fetch auto-posted today count
      const { count: autoPostedTodayCount, error: autoPostError } = await supabase
        .from('responses')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'posted')
        .eq('can_auto_post', true)
        .gte('posted_at', todayISO);

      if (autoPostError) throw autoPostError;

      // Fetch auto-posted yesterday count
      const { count: autoPostedYesterdayCount, error: autoPostYestError } = await supabase
        .from('responses')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'posted')
        .eq('can_auto_post', true)
        .gte('posted_at', yesterdayISO)
        .lt('posted_at', todayISO);

      if (autoPostYestError) throw autoPostYestError;

      // Fetch total responses this week for success rate
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoISO = weekAgo.toISOString();

      const { count: totalWeekCount, error: totalWeekError } = await supabase
        .from('responses')
        .select('*', { count: 'exact', head: true })
        .in('status', ['approved', 'rejected', 'posted', 'edited'])
        .gte('created_at', weekAgoISO);

      if (totalWeekError) throw totalWeekError;

      const { count: approvedWeekCount, error: approvedWeekError } = await supabase
        .from('responses')
        .select('*', { count: 'exact', head: true })
        .in('status', ['approved', 'posted', 'edited'])
        .gte('created_at', weekAgoISO);

      if (approvedWeekError) throw approvedWeekError;

      // Calculate metrics
      const pending = pendingCount ?? 0;
      const approvedToday = approvedTodayCount ?? 0;
      const approvedYesterday = approvedYesterdayCount ?? 0;
      const autoPostedToday = autoPostedTodayCount ?? 0;
      const autoPostedYesterday = autoPostedYesterdayCount ?? 0;
      const totalWeek = totalWeekCount ?? 1; // Avoid division by zero
      const approvedWeek = approvedWeekCount ?? 0;

      // Calculate percentage changes
      const approvedChange = approvedYesterday > 0
        ? (approvedToday - approvedYesterday) / approvedYesterday
        : 0;
      const autoPostedChange = autoPostedYesterday > 0
        ? (autoPostedToday - autoPostedYesterday) / autoPostedYesterday
        : 0;
      const successRate = totalWeek > 0 ? approvedWeek / totalWeek : 0;

      // Build stats array
      const realStats: QuickStat[] = [
        {
          id: 'stat-1',
          title: 'Pending Reviews',
          value: String(pending),
          description: 'Responses awaiting approval',
        },
        {
          id: 'stat-2',
          title: 'Approved Today',
          value: String(approvedToday),
          change: approvedChange,
          changeLabel: 'vs yesterday',
          description: 'Manually approved',
        },
        {
          id: 'stat-3',
          title: 'Auto-posted',
          value: String(autoPostedToday),
          change: autoPostedChange,
          changeLabel: 'vs yesterday',
          description: 'Posted automatically',
        },
        {
          id: 'stat-4',
          title: 'Success Rate',
          value: `${Math.round(successRate * 100)}%`,
          change: 0.02, // Placeholder for weekly trend
          changeLabel: 'this week',
          description: 'Approval rate',
        },
      ];

      setStats(realStats);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load stats');
      // Fall back to mock data on error
      setStats(mockQuickStats);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user, organization, supabase]);

  const refresh = useCallback(async () => {
    await fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    isLoading,
    error,
    refresh,
  };
}
