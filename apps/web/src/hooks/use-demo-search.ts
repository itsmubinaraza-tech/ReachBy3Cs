'use client';

import { useState, useCallback, useRef } from 'react';
import { agentClient, CrawlResult, PipelineAnalyzeResult } from '@/lib/agent/client';
import { PreviewQueueItem, ResponseStatus } from '@/lib/landing/mock-preview-data';

// Rate limiting constants
const SEARCH_LIMIT = 10;
const STORAGE_KEY = 'reachby3cs_search_count';

// Rate limiting helper functions
function getSearchCount(): number {
  if (typeof window === 'undefined') return 0;
  const stored = sessionStorage.getItem(STORAGE_KEY);
  return stored ? parseInt(stored, 10) : 0;
}

function incrementSearchCount(): number {
  if (typeof window === 'undefined') return 0;
  const count = getSearchCount() + 1;
  sessionStorage.setItem(STORAGE_KEY, count.toString());
  return count;
}

function isRateLimited(): boolean {
  return getSearchCount() >= SEARCH_LIMIT;
}

function getRemainingSearches(): number {
  return Math.max(0, SEARCH_LIMIT - getSearchCount());
}

export interface DemoSearchFormData {
  targetAudience: string;
  timeFilter: number;
  solution: string;
}

export interface UseDemoSearchResult {
  search: (data: DemoSearchFormData) => Promise<void>;
  results: PreviewQueueItem[];
  isSearching: boolean;
  isAnalyzing: boolean;
  analyzingCount: number;
  totalCount: number;
  hasSearched: boolean;
  error: string | null;
  remainingSearches: number;
  isRateLimited: boolean;
  cancelAnalysis: () => void;
}

/**
 * Transform crawl result posts to preview queue items (without AI responses)
 */
function transformToQueueItems(result: CrawlResult): PreviewQueueItem[] {
  if (!result?.posts || !Array.isArray(result.posts)) {
    return [];
  }

  return result.posts
    .filter((post) => post && post.external_url)
    .map((post, index) => {
      const url = post.external_url;
      const platform = detectPlatform(url);

      // Extract title from content (first line or first 100 chars)
      const contentLines = (post.content || '').split('\n');
      const title = contentLines[0]?.slice(0, 100) || 'Untitled Discussion';

      return {
        id: post.external_id || `search-${index}`,
        platform,
        title,
        content: post.content || '',
        response: '', // Empty - will be filled by analyzePost
        author: post.author_handle || post.author_display_name || 'anonymous',
        url,
        subreddit: platform === 'reddit' ? extractSubreddit(url) : undefined,
        createdAt: formatRelativeTime(post.crawled_at || post.external_created_at || ''),
        engagement: {
          upvotes: post.engagement_metrics?.upvotes,
          comments: post.engagement_metrics?.comments,
        },
        // Progressive loading status - starts as idle
        responseStatus: 'idle' as ResponseStatus,
        responseError: undefined,
      };
    });
}

/**
 * Update a single queue item with AI analysis results
 */
function updateItemWithAnalysis(
  item: PreviewQueueItem,
  analysis: PipelineAnalyzeResult
): PreviewQueueItem {
  // Safely extract response - handle various API response structures
  const response = analysis?.response;
  const responseText = response?.recommended || response?.value_first || response?.contextual || '';

  // Safely extract risk info
  const risk = analysis?.risk;
  const riskLevel = risk?.level || 'medium';

  // Safely extract CTS score
  const ctsScore = analysis?.cts_score ?? 0.5;

  return {
    ...item,
    response: responseText,
    responseVariants: response ? {
      value_first: response.value_first || '',
      soft_cta: response.soft_cta || '',
      contextual: response.contextual || '',
    } : undefined,
    riskLevel: riskLevel as 'low' | 'medium' | 'high' | 'blocked',
    ctsScore,
    responseStatus: responseText ? 'ready' as ResponseStatus : 'error' as ResponseStatus,
    responseError: responseText ? undefined : 'No response generated',
  };
}

function detectPlatform(url: string | undefined | null): 'reddit' | 'quora' | 'twitter' | 'linkedin' | 'stackoverflow' | 'hackernews' {
  if (!url) return 'reddit';
  if (url.includes('reddit.com')) return 'reddit';
  if (url.includes('quora.com')) return 'quora';
  if (url.includes('twitter.com') || url.includes('x.com')) return 'twitter';
  if (url.includes('linkedin.com')) return 'linkedin';
  if (url.includes('stackoverflow.com')) return 'stackoverflow';
  if (url.includes('ycombinator.com') || url.includes('news.ycombinator.com')) return 'hackernews';
  return 'reddit';
}

function extractSubreddit(url: string | undefined | null): string | undefined {
  if (!url) return undefined;
  const match = url.match(/reddit\.com\/r\/([^/]+)/);
  return match ? `r/${match[1]}` : undefined;
}

function formatRelativeTime(dateString: string): string {
  if (!dateString) return 'Recently';

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}

/**
 * Progressive search hook for demo page
 *
 * Two-phase approach:
 * 1. Fast search (2-3 sec): Get posts via aiSearch, show immediately
 * 2. Progressive analysis: Analyze each post individually, update UI as each completes
 */
export function useDemoSearch(): UseDemoSearchResult {
  const [results, setResults] = useState<PreviewQueueItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzingCount, setAnalyzingCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remainingSearches, setRemainingSearches] = useState<number>(() => getRemainingSearches());
  const [rateLimited, setRateLimited] = useState<boolean>(() => isRateLimited());

  // Ref to track if analysis should be cancelled
  const cancelledRef = useRef(false);
  // Ref to store form data for analysis phase
  const formDataRef = useRef<DemoSearchFormData | null>(null);

  const cancelAnalysis = useCallback(() => {
    cancelledRef.current = true;
    setIsAnalyzing(false);
  }, []);

  const search = useCallback(async (data: DemoSearchFormData) => {
    // Reset cancel flag
    cancelledRef.current = false;
    formDataRef.current = data;

    // Check rate limit before proceeding
    if (isRateLimited()) {
      setRateLimited(true);
      setError('You have reached the search limit for this session. Sign up for unlimited searches!');
      return;
    }

    setIsSearching(true);
    setIsAnalyzing(false);
    setAnalyzingCount(0);
    setTotalCount(0);
    setError(null);

    try {
      // Validate input
      if (!data.targetAudience || data.targetAudience.trim().length < 10) {
        throw new Error('Please provide more details about your target audience (at least 10 characters)');
      }

      if (!data.solution || data.solution.trim().length < 5) {
        throw new Error('Please describe your solution (at least 5 characters)');
      }

      // PHASE 1: Fast search (just scrape, no AI)
      // This returns in 2-3 seconds
      const searchResult = await agentClient.aiSearch(
        data.targetAudience.trim(),
        data.solution.trim(),
        ['reddit.com', 'stackoverflow.com', 'news.ycombinator.com'],
        5 // Limit to 5 posts
      );

      // Increment search count after successful search
      incrementSearchCount();
      const remaining = getRemainingSearches();
      setRemainingSearches(remaining);
      setRateLimited(remaining === 0);

      // Transform to queue items (without AI responses yet)
      const queueItems = transformToQueueItems(searchResult);

      if (queueItems.length === 0) {
        setError('No conversations found. Try being more specific about the problem you solve.');
        setResults([]);
        setHasSearched(true);
        setIsSearching(false);
        return;
      }

      // Show posts immediately with 'generating' status (all at once for parallel)
      const itemsWithGenerating = queueItems.map((item) => ({
        ...item,
        responseStatus: 'generating' as ResponseStatus,
      }));
      setResults(itemsWithGenerating);
      setHasSearched(true);
      setIsSearching(false);
      setTotalCount(queueItems.length);

      // PHASE 2: Parallel analysis
      // Analyze ALL posts in parallel for faster response time
      setIsAnalyzing(true);

      // Create analysis promises for all posts
      const analysisPromises = queueItems.map(async (item) => {
        const itemId = item.id;

        try {
          // Check if cancelled before starting
          if (cancelledRef.current) {
            return { itemId, success: false, cancelled: true };
          }

          // Analyze this post through the AI pipeline (parallel)
          const analysis = await agentClient.analyzePost(
            item.content,
            item.platform,
            data.solution.trim(),
            data.targetAudience.trim(),
            'ReachBy3Cs Demo' // Required app_name parameter
          );

          // Check if cancelled after async call
          if (cancelledRef.current) {
            return { itemId, success: false, cancelled: true };
          }

          // Validate the analysis response has expected structure
          if (!analysis || typeof analysis !== 'object') {
            throw new Error('Invalid analysis response from server');
          }

          // Update this specific item with analysis results
          setResults((prev) =>
            prev.map((p) =>
              p.id === itemId ? updateItemWithAnalysis(p, analysis) : p
            )
          );

          // Increment completed count
          setAnalyzingCount((prev) => prev + 1);

          return { itemId, success: true };
        } catch (analysisError) {
          console.error(`Analysis error for post ${itemId}:`, analysisError);

          // Mark this item as error
          setResults((prev) =>
            prev.map((p) =>
              p.id === itemId
                ? {
                    ...p,
                    responseStatus: 'error' as ResponseStatus,
                    responseError: analysisError instanceof Error ? analysisError.message : 'Failed to generate response',
                  }
                : p
            )
          );

          // Still increment count (this one is done, even if failed)
          setAnalyzingCount((prev) => prev + 1);

          return { itemId, success: false, error: analysisError };
        }
      });

      // Wait for all parallel requests to complete
      await Promise.allSettled(analysisPromises);

      setIsAnalyzing(false);
    } catch (err) {
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : 'Search failed. Please try again.');
      setResults([]);
      setHasSearched(true);
      setIsSearching(false);
      setIsAnalyzing(false);
    }
  }, []);

  return {
    search,
    results,
    isSearching,
    isAnalyzing,
    analyzingCount,
    totalCount,
    hasSearched,
    error,
    remainingSearches,
    isRateLimited: rateLimited,
    cancelAnalysis,
  };
}
