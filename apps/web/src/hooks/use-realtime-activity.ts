'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useOrg } from '@/contexts/org-context';
import type { ActivityItem } from '@/components/analytics/activity-feed';
import type { RealtimeChannel } from '@supabase/supabase-js';

// Mock activity generator for demo mode
function generateMockActivity(): ActivityItem {
  const types: ActivityItem['type'][] = [
    'detected',
    'generated',
    'approved',
    'rejected',
    'posted',
    'edited',
    'flagged',
  ];
  const platforms = ['reddit', 'twitter', 'quora', 'linkedin', 'google'];
  const users = ['John', 'Sarah', 'Mike', 'Emma', undefined];

  const type = types[Math.floor(Math.random() * types.length)];
  const platform = platforms[Math.floor(Math.random() * platforms.length)];
  const user = users[Math.floor(Math.random() * users.length)];

  const descriptions: Record<ActivityItem['type'], string> = {
    detected: `New high-intent post detected on ${platform}`,
    generated: `AI response generated for ${platform} post`,
    approved: `Response approved for ${platform}`,
    rejected: `Response rejected for ${platform}`,
    posted: `Response posted to ${platform}`,
    edited: `Response edited for ${platform}`,
    flagged: `Response flagged for review (${platform})`,
  };

  return {
    id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    platform,
    description: descriptions[type] || `Activity: ${type}`,
    timestamp: new Date().toISOString(),
    user,
  };
}

export interface UseRealtimeActivityResult {
  activities: ActivityItem[];
  isConnected: boolean;
  error: Error | null;
  clearActivities: () => void;
}

export function useRealtimeActivity(maxItems: number = 50): UseRealtimeActivityResult {
  const { organization } = useOrg();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const addActivity = useCallback(
    (activity: ActivityItem) => {
      setActivities((prev) => {
        const updated = [activity, ...prev];
        return updated.slice(0, maxItems);
      });
    },
    [maxItems]
  );

  const clearActivities = useCallback(() => {
    setActivities([]);
  }, []);

  useEffect(() => {
    let channel: RealtimeChannel | null = null;
    let mockInterval: NodeJS.Timeout | null = null;

    // Demo mode with mock data
    if (!organization?.id) {
      setIsConnected(true);

      // Generate initial mock activities
      const initialActivities: ActivityItem[] = [];
      for (let i = 0; i < 5; i++) {
        const activity = generateMockActivity();
        activity.timestamp = new Date(Date.now() - i * 60 * 1000).toISOString();
        initialActivities.push(activity);
      }
      setActivities(initialActivities);

      // Periodically add new mock activities
      mockInterval = setInterval(() => {
        if (Math.random() > 0.5) {
          addActivity(generateMockActivity());
        }
      }, 15000); // Add activity every ~15 seconds (50% chance)

      return () => {
        if (mockInterval) clearInterval(mockInterval);
      };
    }

    // Real Supabase subscription
    const supabase = createClient();

    const setupSubscription = async () => {
      try {
        channel = supabase
          .channel(`activity-${organization.id}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'audit_log',
              filter: `organization_id=eq.${organization.id}`,
            },
            (payload) => {
              const log = payload.new as {
                id: string;
                action_type: string;
                action_data: Record<string, unknown> | null;
                created_at: string;
              };

              const activity: ActivityItem = {
                id: log.id,
                type: mapActionType(log.action_type),
                platform: log.action_data?.platform as string | undefined,
                description: generateDescription(log.action_type, log.action_data),
                timestamp: log.created_at,
              };

              addActivity(activity);
            }
          )
          .subscribe((status) => {
            setIsConnected(status === 'SUBSCRIBED');
            if (status === 'CHANNEL_ERROR') {
              setError(new Error('Failed to connect to real-time channel'));
            }
          });
      } catch (err) {
        setError(err as Error);
        setIsConnected(false);
      }
    };

    setupSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
      if (mockInterval) {
        clearInterval(mockInterval);
      }
    };
  }, [organization?.id, addActivity]);

  return {
    activities,
    isConnected,
    error,
    clearActivities,
  };
}

// Helper functions
function mapActionType(
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

function generateDescription(
  actionType: string,
  actionData: Record<string, unknown> | null
): string {
  const platform = actionData?.platform as string | undefined;

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

  return descriptions[actionType] || `Activity: ${actionType}`;
}
