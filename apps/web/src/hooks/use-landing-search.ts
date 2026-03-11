'use client';

import { useState, useCallback } from 'react';
import { agentClient, CrawlResult } from '@/lib/agent/client';
import { PreviewQueueItem } from '@/lib/landing/mock-preview-data';

export interface SearchFormData {
  targetAudience: string;
  timeFilter: number;
  solution: string;
}

export interface UseLandingSearchResult {
  search: (data: SearchFormData) => Promise<void>;
  results: PreviewQueueItem[];
  isSearching: boolean;
  hasSearched: boolean;
  error: string | null;
}

/**
 * Extract keywords from target audience description
 * Simple keyword extraction - takes key phrases and removes common words
 */
function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    'i', 'me', 'my', 'we', 'our', 'you', 'your', 'the', 'a', 'an', 'and', 'or',
    'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was',
    'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
    'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can',
    'need', 'dare', 'ought', 'used', 'that', 'this', 'these', 'those', 'who',
    'which', 'what', 'where', 'when', 'why', 'how', 'all', 'each', 'every',
    'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'not', 'only',
    'same', 'so', 'than', 'too', 'very', 'just', 'also', 'now', 'here', 'there',
    'then', 'if', 'about', 'into', 'through', 'during', 'before', 'after',
    'above', 'below', 'from', 'up', 'down', 'out', 'off', 'over', 'under',
    'again', 'further', 'once', 'trying', 'problem', 'solve', 'help', 'looking',
  ]);

  // Extract words, filter stopwords, and take top keywords
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word));

  // Get unique words and take top 5-7 for search
  const uniqueWords = [...new Set(words)];
  return uniqueWords.slice(0, 7);
}

/**
 * Transform crawl result posts to preview queue items
 */
function transformToQueueItems(crawlResult: CrawlResult): PreviewQueueItem[] {
  if (!crawlResult?.posts || !Array.isArray(crawlResult.posts)) {
    return [];
  }

  return crawlResult.posts
    .filter((post) => post && post.external_url) // Filter out posts without URLs
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
        response: '', // Will be generated on demand
        author: post.author_handle || post.author_display_name || 'anonymous',
        url,
        subreddit: platform === 'reddit' ? extractSubreddit(url) : undefined,
        createdAt: formatRelativeTime(post.crawled_at || post.external_created_at || ''),
        engagement: {
          upvotes: post.engagement_metrics?.upvotes,
          comments: post.engagement_metrics?.comments,
        },
      };
    });
}

function detectPlatform(url: string | undefined | null): 'reddit' | 'quora' | 'twitter' | 'linkedin' | 'stackoverflow' | 'hackernews' {
  if (!url) return 'reddit'; // Default for missing URLs
  if (url.includes('reddit.com')) return 'reddit';
  if (url.includes('quora.com')) return 'quora';
  if (url.includes('twitter.com') || url.includes('x.com')) return 'twitter';
  if (url.includes('linkedin.com')) return 'linkedin';
  if (url.includes('stackoverflow.com')) return 'stackoverflow';
  if (url.includes('ycombinator.com') || url.includes('news.ycombinator.com')) return 'hackernews';
  return 'reddit'; // Default
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

export function useLandingSearch(): UseLandingSearchResult {
  const [results, setResults] = useState<PreviewQueueItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (data: SearchFormData) => {
    setIsSearching(true);
    setError(null);

    try {
      // Validate input
      if (!data.targetAudience || data.targetAudience.trim().length < 10) {
        throw new Error('Please provide more details about your target audience (at least 10 characters)');
      }

      if (!data.solution || data.solution.trim().length < 5) {
        throw new Error('Please describe your solution (at least 5 characters)');
      }

      // Use AI-powered search for better results
      const crawlResult = await agentClient.aiSearch(
        data.targetAudience.trim(),
        data.solution.trim(),
        ['reddit.com', 'stackoverflow.com', 'news.ycombinator.com'],
        10
      );

      // Transform to queue items
      const queueItems = transformToQueueItems(crawlResult);

      if (queueItems.length === 0) {
        setError('No conversations found. Try being more specific about the problem you solve.');
      }

      setResults(queueItems);
      setHasSearched(true);
    } catch (err) {
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : 'Search failed. Please try again.');
      setResults([]);
      setHasSearched(true); // Mark as searched even on error to not show mock data
    } finally {
      setIsSearching(false);
    }
  }, []);

  return {
    search,
    results,
    isSearching,
    hasSearched,
    error,
  };
}
