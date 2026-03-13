'use client';

import { useState, useCallback, useRef } from 'react';
import { agentClient, AISearchWithResponsesResult, EnhancedPost } from '@/lib/agent/client';
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
 * Transform enhanced posts (with AI responses) to preview queue items
 */
function transformEnhancedPosts(posts: EnhancedPost[]): PreviewQueueItem[] {
  if (!posts || !Array.isArray(posts)) {
    return [];
  }

  return posts
    .filter((post) => post && post.external_url)
    .map((post, index) => {
      const url = post.external_url;
      const platform = detectPlatform(url);

      // Extract title from content (first line or first 100 chars)
      const contentLines = (post.content || '').split('\n');
      const title = contentLines[0]?.slice(0, 100) || 'Untitled Discussion';

      // Get response text - prefer value_first as the main response
      const responseText = post.ai_response ||
        post.response_variants?.value_first ||
        post.response_variants?.contextual || '';

      const hasResponse = !!responseText;
      const hasError = !!post.error;

      return {
        id: post.external_id || `search-${index}`,
        platform,
        title,
        content: post.content || '',
        response: responseText,
        responseVariants: post.response_variants ? {
          value_first: post.response_variants.value_first || '',
          soft_cta: post.response_variants.soft_cta || '',
          contextual: post.response_variants.contextual || '',
        } : undefined,
        author: post.author_handle || post.author_display_name || 'anonymous',
        url,
        subreddit: platform === 'reddit' ? extractSubreddit(url) : undefined,
        createdAt: formatRelativeTime(post.crawled_at || post.external_created_at || ''),
        engagement: {
          upvotes: post.engagement_metrics?.upvotes,
          comments: post.engagement_metrics?.comments,
        },
        riskLevel: post.risk_level || 'medium',
        ctsScore: post.cts_score ?? 0.5,
        responseStatus: hasError ? 'error' as ResponseStatus :
                        hasResponse ? 'ready' as ResponseStatus :
                        'error' as ResponseStatus,
        responseError: post.error || (hasResponse ? undefined : 'No response generated'),
      };
    });
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
 * Demo search hook - uses combined endpoint for faster results
 *
 * Single request approach:
 * - Uses aiSearchWithResponses which does scraping + AI analysis server-side
 * - Returns posts with AI responses in one request
 * - Much faster than separate scrape + analyze calls
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

  // Ref to track if search should be cancelled
  const cancelledRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const cancelAnalysis = useCallback(() => {
    cancelledRef.current = true;
    abortControllerRef.current?.abort();
    setIsSearching(false);
    setIsAnalyzing(false);
  }, []);

  const search = useCallback(async (data: DemoSearchFormData) => {
    // Reset cancel flag
    cancelledRef.current = false;

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
    setResults([]);

    try {
      // Validate input
      if (!data.targetAudience || data.targetAudience.trim().length < 10) {
        throw new Error('Please provide more details about your target audience (at least 10 characters)');
      }

      if (!data.solution || data.solution.trim().length < 5) {
        throw new Error('Please describe your solution (at least 5 characters)');
      }

      // Use combined endpoint - scrape + AI analysis in one request
      // This is much faster than separate calls
      const searchResult = await agentClient.aiSearchWithResponses(
        data.targetAudience.trim(),
        data.solution.trim(),
        ['reddit.com', 'stackoverflow.com'],
        3 // Limit to 3 posts for faster response
      );

      // Check if cancelled
      if (cancelledRef.current) {
        return;
      }

      // Increment search count after successful search
      incrementSearchCount();
      const remaining = getRemainingSearches();
      setRemainingSearches(remaining);
      setRateLimited(remaining === 0);

      // Transform to queue items (already has AI responses)
      const queueItems = transformEnhancedPosts(searchResult.posts);

      if (queueItems.length === 0) {
        setError('No conversations found. Try being more specific about the problem you solve.');
        setResults([]);
        setHasSearched(true);
        setIsSearching(false);
        return;
      }

      // Show all results at once (already have AI responses)
      setResults(queueItems);
      setHasSearched(true);
      setTotalCount(queueItems.length);
      setAnalyzingCount(queueItems.length);
      setIsSearching(false);

    } catch (err) {
      console.error('Search error:', err);

      // Provide more helpful error messages
      let errorMessage = 'Search failed. Please try again.';
      if (err instanceof Error) {
        if (err.message.includes('timeout') || err.message.includes('504')) {
          errorMessage = 'Search timed out. The server may be warming up - please try again.';
        } else if (err.message.includes('500')) {
          errorMessage = 'Server error. Please try again in a moment.';
        } else if (err.message.includes('network') || err.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
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
