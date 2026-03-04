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
  return crawlResult.posts.map((post, index) => {
    const platform = detectPlatform(post.url);
    return {
      id: post.id || `search-${index}`,
      platform,
      title: post.title || 'Untitled Discussion',
      content: post.content || '',
      response: '', // Will be generated on demand
      author: post.author || 'anonymous',
      url: post.url,
      subreddit: platform === 'reddit' ? extractSubreddit(post.url) : undefined,
      createdAt: formatRelativeTime(post.created_at),
      engagement: {
        upvotes: post.engagement?.upvotes,
        comments: post.engagement?.comments,
      },
    };
  });
}

function detectPlatform(url: string): 'reddit' | 'quora' | 'twitter' | 'linkedin' {
  if (url.includes('reddit.com')) return 'reddit';
  if (url.includes('quora.com')) return 'quora';
  if (url.includes('twitter.com') || url.includes('x.com')) return 'twitter';
  if (url.includes('linkedin.com')) return 'linkedin';
  return 'reddit'; // Default
}

function extractSubreddit(url: string): string | undefined {
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
      // Extract keywords from the target audience description
      const keywords = extractKeywords(data.targetAudience);

      if (keywords.length === 0) {
        throw new Error('Please provide more details about your target audience');
      }

      // Search for discussions on Reddit and Quora
      const crawlResult = await agentClient.searchDiscussions(
        keywords,
        ['reddit', 'quora'],
        10
      );

      // Transform to queue items
      const queueItems = transformToQueueItems(crawlResult);
      setResults(queueItems);
      setHasSearched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed. Please try again.');
      setResults([]);
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
