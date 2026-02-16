'use client';

import { useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/auth-context';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export type QueueChangeType = 'INSERT' | 'UPDATE' | 'DELETE';

export interface QueueChange {
  type: QueueChangeType;
  id: string;
  data: Record<string, unknown>;
  oldData?: Record<string, unknown>;
}

export interface UseRealtimeQueueOptions {
  onInsert?: (change: QueueChange) => void;
  onUpdate?: (change: QueueChange) => void;
  onDelete?: (change: QueueChange) => void;
  onAnyChange?: (change: QueueChange) => void;
  enabled?: boolean;
}

/**
 * Hook for subscribing to realtime queue updates via Supabase Realtime
 */
export function useRealtimeQueue(options: UseRealtimeQueueOptions = {}) {
  const {
    onInsert,
    onUpdate,
    onDelete,
    onAnyChange,
    enabled = true,
  } = options;

  const { user } = useAuth();
  const supabase = createClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Handle incoming changes
  const handleChange = useCallback(
    (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
      const change: QueueChange = {
        type: payload.eventType as QueueChangeType,
        id: (payload.new as any)?.id || (payload.old as any)?.id || '',
        data: payload.new as Record<string, unknown>,
        oldData: payload.old as Record<string, unknown> | undefined,
      };

      // Call specific handler
      switch (payload.eventType) {
        case 'INSERT':
          onInsert?.(change);
          break;
        case 'UPDATE':
          onUpdate?.(change);
          break;
        case 'DELETE':
          onDelete?.(change);
          break;
      }

      // Always call the general handler
      onAnyChange?.(change);
    },
    [onInsert, onUpdate, onDelete, onAnyChange]
  );

  useEffect(() => {
    if (!enabled || !user) {
      return;
    }

    // Create subscription channel for responses table
    const channel = supabase
      .channel('queue-realtime')
      .on<Record<string, unknown>>(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'responses',
        },
        handleChange
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Realtime queue subscription active');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Realtime queue subscription error');
        }
      });

    channelRef.current = channel;

    // Cleanup on unmount
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [enabled, user, supabase, handleChange]);

  // Method to manually unsubscribe
  const unsubscribe = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, [supabase]);

  return {
    isSubscribed: !!channelRef.current,
    unsubscribe,
  };
}

/**
 * Hook for subscribing to audit log events
 */
export function useRealtimeAuditLog(options: {
  onNewEntry?: (entry: Record<string, unknown>) => void;
  enabled?: boolean;
} = {}) {
  const { onNewEntry, enabled = true } = options;
  const { user } = useAuth();
  const supabase = createClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!enabled || !user) {
      return;
    }

    const channel = supabase
      .channel('audit-realtime')
      .on<Record<string, unknown>>(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'audit_logs',
        },
        (payload) => {
          onNewEntry?.(payload.new);
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [enabled, user, supabase, onNewEntry]);

  return {
    isSubscribed: !!channelRef.current,
  };
}
