'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/auth-context';
import { useDeviceType } from '@/hooks';
import { useKeyboardQueue } from '@/hooks/use-keyboard-queue';
import { cn, formatRelativeTime, formatPlatformName } from '@/lib/utils';
import { OriginalPost } from '@/components/queue/original-post';
import { AIAnalysis } from '@/components/queue/ai-analysis';
import { ResponseVariants } from '@/components/queue/response-variants';
import { ResponseActions } from '@/components/queue/response-actions';
import { ClusterInfo } from '@/components/queue/cluster-info';
import { ResponseEditor } from '@/components/queue/response-editor';
import { approveResponse, rejectResponse, editResponse } from '@/lib/queue/actions';
import type { QueueItemDisplay, ResponseType, DeviceType as DeviceTypeEnum } from 'shared-types';

// Map device type hook output to database enum
function mapDeviceType(type: 'mobile' | 'tablet' | 'desktop'): DeviceTypeEnum {
  switch (type) {
    case 'mobile':
      return 'mobile_ios'; // Could differentiate based on platform
    case 'tablet':
      return 'tablet';
    default:
      return 'web';
  }
}

export default function QueueDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const deviceInfo = useDeviceType();
  const supabase = createClient();

  const [item, setItem] = useState<QueueItemDisplay | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<ResponseType>('value_first');
  const [selectedResponse, setSelectedResponse] = useState('');
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [isActioning, setIsActioning] = useState(false);

  const id = params.id as string;

  // Show notification
  const showNotification = useCallback((type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  // Fetch item data
  useEffect(() => {
    async function fetchItem() {
      if (!user || !id) return;

      try {
        setIsLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('responses')
          .select(`
            id,
            selected_response,
            selected_type,
            value_first_response,
            soft_cta_response,
            contextual_response,
            cta_level,
            cts_score,
            can_auto_post,
            status,
            created_at,
            cluster:clusters(
              id,
              name,
              member_count
            ),
            signal:signals!inner(
              id,
              problem_category_id,
              emotional_intensity,
              keywords,
              post:posts!inner(
                id,
                external_url,
                content,
                author_handle,
                detected_at,
                platform:platforms(
                  id,
                  name,
                  slug,
                  icon_url
                )
              ),
              risk_score:risk_scores!inner(
                risk_level,
                risk_score,
                context_flags
              )
            )
          `)
          .eq('id', id)
          .single();

        if (fetchError) {
          throw new Error(fetchError.message);
        }

        if (!data) {
          throw new Error('Item not found');
        }

        // Transform to QueueItemDisplay
        const transformedItem: QueueItemDisplay = {
          id: data.id,
          original: {
            platform: {
              id: (data as any).signal.post.platform.id,
              name: (data as any).signal.post.platform.name,
              slug: (data as any).signal.post.platform.slug,
              iconUrl: (data as any).signal.post.platform.icon_url,
            },
            content: (data as any).signal.post.content,
            authorHandle: (data as any).signal.post.author_handle,
            url: (data as any).signal.post.external_url,
            detectedAt: (data as any).signal.post.detected_at,
          },
          analysis: {
            problemCategory: (data as any).signal.problem_category_id,
            emotionalIntensity: (data as any).signal.emotional_intensity,
            keywords: (data as any).signal.keywords || [],
            riskLevel: (data as any).signal.risk_score.risk_level,
            riskScore: (data as any).signal.risk_score.risk_score,
            riskFactors: (data as any).signal.risk_score.context_flags || [],
          },
          responses: {
            valueFirst: data.value_first_response,
            softCta: data.soft_cta_response,
            contextual: data.contextual_response,
            selected: data.selected_response,
            selectedType: data.selected_type as ResponseType,
          },
          metrics: {
            ctaLevel: data.cta_level as 0 | 1 | 2 | 3,
            ctsScore: data.cts_score,
            canAutoPost: data.can_auto_post,
          },
          cluster: (data as any).cluster ? {
            id: (data as any).cluster.id,
            name: (data as any).cluster.name,
            memberCount: (data as any).cluster.member_count,
          } : null,
          status: data.status as any,
          priority: 50,
          createdAt: data.created_at,
        };

        setItem(transformedItem);
        setSelectedType(transformedItem.responses.selectedType);
        setSelectedResponse(transformedItem.responses.selected);
      } catch (err) {
        console.error('Error fetching item:', err);
        setError(err instanceof Error ? err.message : 'Failed to load item');
      } finally {
        setIsLoading(false);
      }
    }

    fetchItem();
  }, [user, id, supabase]);

  // Handle response selection
  const handleResponseSelect = useCallback((type: ResponseType, content: string) => {
    setSelectedType(type);
    setSelectedResponse(content);
  }, []);

  // Handle approve
  const handleApprove = useCallback(async () => {
    if (!item || isActioning) return;

    setIsActioning(true);
    try {
      const result = await approveResponse(
        item.id,
        mapDeviceType(deviceInfo.type),
        selectedType
      );

      if (result.success) {
        showNotification('success', 'Response approved successfully!');
        router.push('/dashboard/queue');
      } else {
        showNotification('error', result.error || 'Failed to approve');
      }
    } finally {
      setIsActioning(false);
    }
  }, [item, selectedType, deviceInfo.type, router, showNotification, isActioning]);

  // Handle reject
  const handleReject = useCallback(async () => {
    if (!item || isActioning) return;

    setIsActioning(true);
    try {
      const result = await rejectResponse(
        item.id,
        null,
        mapDeviceType(deviceInfo.type)
      );

      if (result.success) {
        showNotification('success', 'Response rejected');
        router.push('/dashboard/queue');
      } else {
        showNotification('error', result.error || 'Failed to reject');
      }
    } finally {
      setIsActioning(false);
    }
  }, [item, deviceInfo.type, router, showNotification, isActioning]);

  // Handle edit save
  const handleEditSave = useCallback(async (newText: string) => {
    if (!item) return;

    const result = await editResponse(
      item.id,
      newText,
      mapDeviceType(deviceInfo.type)
    );

    if (result.success) {
      showNotification('success', 'Response edited and approved!');
      router.push('/dashboard/queue');
    } else {
      throw new Error(result.error || 'Failed to save edit');
    }
  }, [item, deviceInfo.type, router, showNotification]);

  // Handle go back
  const handleGoBack = useCallback(() => {
    router.push('/dashboard/queue');
  }, [router]);

  // Keyboard shortcuts
  useKeyboardQueue({
    onNavigateNext: () => {}, // Could navigate to next item in queue
    onNavigatePrevious: () => {}, // Could navigate to previous item
    onApprove: handleApprove,
    onReject: handleReject,
    onEdit: () => setIsEditorOpen(true),
    onOpenDetail: () => {},
    onCloseModal: () => {
      if (isEditorOpen) {
        setIsEditorOpen(false);
      } else {
        handleGoBack();
      }
    },
    enabled: !isEditorOpen,
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin w-8 h-8 text-blue-600" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !item) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {error || 'Item not found'}
          </h2>
          <Link
            href="/dashboard/queue"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Return to queue
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleGoBack}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Response Detail
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {formatPlatformName(item.original.platform.slug)} - {formatRelativeTime(item.original.detectedAt)}
                </p>
              </div>
            </div>

            {/* Keyboard hints */}
            <div className="hidden lg:flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded font-mono">a</kbd>
                Approve
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded font-mono">r</kbd>
                Reject
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded font-mono">e</kbd>
                Edit
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded font-mono">Esc</kbd>
                Back
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Original Post Section */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
              Original Post
            </h2>
            <OriginalPost
              platform={item.original.platform}
              content={item.original.content}
              authorHandle={item.original.authorHandle}
              url={item.original.url}
              detectedAt={item.original.detectedAt}
            />
          </div>

          {/* AI Analysis Section */}
          <div className="p-6 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
              AI Analysis
            </h2>
            <AIAnalysis
              analysis={item.analysis}
              metrics={item.metrics}
              expanded={true}
            />
          </div>

          {/* Cluster Section */}
          {item.cluster && (
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                Community Cluster
              </h2>
              <ClusterInfo cluster={item.cluster} showLink />
            </div>
          )}

          {/* Response Variants Section */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
              Response Options
            </h2>
            <ResponseVariants
              responses={item.responses}
              selectedType={selectedType}
              onSelect={handleResponseSelect}
            />
          </div>

          {/* Actions Section */}
          <div className="p-6 bg-gray-50 dark:bg-gray-900/50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Status: <span className={cn(
                  'font-medium',
                  item.status === 'pending' ? 'text-blue-600' :
                  item.status === 'approved' ? 'text-green-600' :
                  item.status === 'rejected' ? 'text-red-600' :
                  'text-gray-600'
                )}>
                  {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                </span>
              </div>
              <ResponseActions
                onApprove={handleApprove}
                onReject={handleReject}
                onEdit={() => setIsEditorOpen(true)}
                isLoading={isActioning}
                disabled={item.status !== 'pending'}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Response Editor Modal */}
      <ResponseEditor
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSave={handleEditSave}
        originalResponse={selectedResponse}
        selectedType={selectedType}
        originalPost={{
          content: item.original.content,
          platform: formatPlatformName(item.original.platform.slug),
          authorHandle: item.original.authorHandle,
        }}
      />

      {/* Notification Toast */}
      {notification && (
        <div
          className={cn(
            'fixed bottom-20 lg:bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg transition-all transform z-50',
            notification.type === 'success'
              ? 'bg-green-600 text-white'
              : 'bg-red-600 text-white'
          )}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <span className="text-sm font-medium">{notification.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
