import { useState, useEffect, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { Response, RiskLevel } from 'shared-types';
import { supabase } from '../lib/supabase';
import { AppStorage, type QueueCacheItem, type PendingAction } from '../lib/storage';
import { useOrganization } from '../contexts/OrganizationContext';
import { useAuth } from '../contexts/AuthContext';

export interface QueueItem {
  id: string;
  platform: string;
  platformName: string;
  originalText: string;
  responsePreview: string;
  selectedResponse: string;
  riskLevel: RiskLevel;
  ctaLevel: number;
  ctsScore: number;
  canAutoPost: boolean;
  createdAt: string;
  externalUrl?: string;
  clusterId?: string;
  clusterName?: string;
}

interface UseQueueOptions {
  filter?: 'all' | 'low' | 'medium' | 'high';
  sortBy?: 'created' | 'cts' | 'risk';
}

export function useQueue(options: UseQueueOptions = {}) {
  const { filter = 'all', sortBy = 'created' } = options;
  const { organization } = useOrganization();
  const { dbUser } = useAuth();
  const [items, setItems] = useState<QueueItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getDeviceType = (): string => {
    return Platform.OS === 'ios' ? 'mobile_ios' : 'mobile_android';
  };

  const fetchQueue = useCallback(async (showLoading = true) => {
    if (!organization) {
      setItems([]);
      setIsLoading(false);
      return;
    }

    if (showLoading) setIsLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('responses')
        .select(`
          id,
          selected_response,
          cta_level,
          cts_score,
          can_auto_post,
          created_at,
          signals (
            id,
            emotional_intensity,
            posts (
              id,
              content,
              external_url,
              platforms (
                id,
                name,
                slug
              )
            ),
            risk_scores (
              risk_level
            )
          ),
          clusters (
            id,
            name
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      // Apply risk filter
      if (filter !== 'all') {
        query = query.eq('signals.risk_scores.risk_level', filter);
      }

      const { data, error: queryError } = await query;

      if (queryError) {
        throw queryError;
      }

      // Transform data to QueueItem format
      const queueItems: QueueItem[] = (data ?? []).map((response: any) => ({
        id: response.id,
        platform: response.signals?.posts?.platforms?.slug ?? 'unknown',
        platformName: response.signals?.posts?.platforms?.name ?? 'Unknown',
        originalText: response.signals?.posts?.content ?? '',
        responsePreview: response.selected_response?.substring(0, 100) + '...',
        selectedResponse: response.selected_response,
        riskLevel: response.signals?.risk_scores?.[0]?.risk_level ?? 'low',
        ctaLevel: response.cta_level ?? 0,
        ctsScore: response.cts_score ?? 0,
        canAutoPost: response.can_auto_post ?? false,
        createdAt: response.created_at,
        externalUrl: response.signals?.posts?.external_url,
        clusterId: response.clusters?.id,
        clusterName: response.clusters?.name,
      }));

      // Sort items
      if (sortBy === 'cts') {
        queueItems.sort((a, b) => b.ctsScore - a.ctsScore);
      } else if (sortBy === 'risk') {
        const riskOrder = { blocked: 0, high: 1, medium: 2, low: 3 };
        queueItems.sort(
          (a, b) => riskOrder[a.riskLevel] - riskOrder[b.riskLevel]
        );
      }

      setItems(queueItems);

      // Cache for offline access
      const cacheItems: QueueCacheItem[] = queueItems.map((item) => ({
        id: item.id,
        platform: item.platform,
        originalText: item.originalText,
        responsePreview: item.responsePreview,
        riskLevel: item.riskLevel,
        ctaLevel: item.ctaLevel,
        ctsScore: item.ctsScore,
        canAutoPost: item.canAutoPost,
        createdAt: item.createdAt,
        cachedAt: Date.now(),
      }));
      AppStorage.setQueueCache(cacheItems);
      AppStorage.setLastSyncTime(Date.now());
    } catch (err) {
      console.error('Error fetching queue:', err);
      setError('Failed to load queue');

      // Try to use cached data
      const cached = AppStorage.getQueueCache();
      if (cached && cached.length > 0) {
        setItems(
          cached.map((c) => ({
            ...c,
            platformName: c.platform,
            selectedResponse: '',
          }))
        );
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [organization, filter, sortBy]);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchQueue(false);
  }, [fetchQueue]);

  const approve = useCallback(async (responseId: string, notes?: string) => {
    if (!dbUser) return { success: false };

    // Optimistic update
    setItems((prev) => prev.filter((item) => item.id !== responseId));

    // Haptic feedback
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      const { error: updateError } = await supabase
        .from('responses')
        .update({
          status: 'approved',
          reviewed_by: dbUser.id,
          reviewed_at: new Date().toISOString(),
          review_device: getDeviceType(),
          review_notes: notes,
        })
        .eq('id', responseId);

      if (updateError) {
        throw updateError;
      }

      // Log audit event
      await supabase.from('audit_log').insert({
        organization_id: dbUser.organization_id,
        user_id: dbUser.id,
        action_type: 'response.approved',
        entity_type: 'response',
        entity_id: responseId,
        device_type: getDeviceType(),
        action_data: { notes },
      });

      return { success: true };
    } catch (err) {
      console.error('Error approving response:', err);

      // Store as pending action for offline sync
      AppStorage.addPendingAction({
        id: `approve-${responseId}-${Date.now()}`,
        type: 'approve',
        responseId,
        timestamp: Date.now(),
        data: { notes },
      });

      // Revert optimistic update on error (if online)
      await fetchQueue(false);

      Alert.alert(
        'Offline Mode',
        'Action saved and will sync when connection is restored.'
      );

      return { success: false };
    }
  }, [dbUser, fetchQueue]);

  const reject = useCallback(async (responseId: string, reason?: string) => {
    if (!dbUser) return { success: false };

    // Optimistic update
    setItems((prev) => prev.filter((item) => item.id !== responseId));

    // Haptic feedback
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

    try {
      const { error: updateError } = await supabase
        .from('responses')
        .update({
          status: 'rejected',
          reviewed_by: dbUser.id,
          reviewed_at: new Date().toISOString(),
          review_device: getDeviceType(),
          review_notes: reason,
        })
        .eq('id', responseId);

      if (updateError) {
        throw updateError;
      }

      // Log audit event
      await supabase.from('audit_log').insert({
        organization_id: dbUser.organization_id,
        user_id: dbUser.id,
        action_type: 'response.rejected',
        entity_type: 'response',
        entity_id: responseId,
        device_type: getDeviceType(),
        action_data: { reason },
      });

      return { success: true };
    } catch (err) {
      console.error('Error rejecting response:', err);

      // Store as pending action for offline sync
      AppStorage.addPendingAction({
        id: `reject-${responseId}-${Date.now()}`,
        type: 'reject',
        responseId,
        timestamp: Date.now(),
        data: { notes: reason },
      });

      await fetchQueue(false);

      Alert.alert(
        'Offline Mode',
        'Action saved and will sync when connection is restored.'
      );

      return { success: false };
    }
  }, [dbUser, fetchQueue]);

  // Sync pending actions when online
  const syncPendingActions = useCallback(async () => {
    const pendingActions = AppStorage.getPendingActions();
    if (pendingActions.length === 0) return;

    for (const action of pendingActions) {
      try {
        if (action.type === 'approve') {
          await approve(action.responseId, action.data?.notes);
        } else if (action.type === 'reject') {
          await reject(action.responseId, action.data?.notes);
        }
        AppStorage.removePendingAction(action.id);
      } catch (err) {
        console.error('Error syncing pending action:', err);
      }
    }
  }, [approve, reject]);

  // Initial fetch
  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  // Set up realtime subscription
  useEffect(() => {
    if (!organization) return;

    const channel = supabase
      .channel('queue-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'responses',
          filter: `status=eq.pending`,
        },
        () => {
          // Refresh queue on any change
          fetchQueue(false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [organization, fetchQueue]);

  return {
    items,
    isLoading,
    isRefreshing,
    error,
    refresh,
    approve,
    reject,
    syncPendingActions,
    pendingActionsCount: AppStorage.getPendingActions().length,
  };
}
