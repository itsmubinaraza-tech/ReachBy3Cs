'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from './auth-context';
import { useOrg } from './org-context';

export interface QueueCountContextType {
  pendingCount: number;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

const QueueCountContext = createContext<QueueCountContextType | undefined>(undefined);

interface QueueCountProviderProps {
  children: ReactNode;
}

export function QueueCountProvider({ children }: QueueCountProviderProps) {
  const { user, isAuthenticated } = useAuth();
  const { organization } = useOrg();
  const [pendingCount, setPendingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Memoize supabase client to prevent reconnection loops
  const supabase = useMemo(() => createClient(), []);

  const fetchCount = useCallback(async () => {
    if (!user || !organization) {
      setPendingCount(0);
      setIsLoading(false);
      return;
    }

    try {
      const { count, error } = await supabase
        .from('engagement_queue')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organization.id)
        .eq('status', 'queued');

      if (error) {
        console.error('Error fetching queue count:', error);
        return;
      }

      setPendingCount(count || 0);
    } catch (err) {
      console.error('Error in fetchCount:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, organization, supabase]);

  // Initial fetch and refetch on organization change
  useEffect(() => {
    if (isAuthenticated && organization) {
      fetchCount();
    } else {
      setPendingCount(0);
      setIsLoading(false);
    }
  }, [isAuthenticated, organization, fetchCount]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!organization) return;

    const channel = supabase
      .channel('queue-count-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'engagement_queue',
          filter: `organization_id=eq.${organization.id}`,
        },
        () => {
          // Refetch count on any change
          fetchCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [organization, supabase, fetchCount]);

  const refresh = useCallback(async () => {
    await fetchCount();
  }, [fetchCount]);

  return (
    <QueueCountContext.Provider
      value={{
        pendingCount,
        isLoading,
        refresh,
      }}
    >
      {children}
    </QueueCountContext.Provider>
  );
}

export function useQueueCount() {
  const context = useContext(QueueCountContext);
  if (context === undefined) {
    throw new Error('useQueueCount must be used within a QueueCountProvider');
  }
  return context;
}
