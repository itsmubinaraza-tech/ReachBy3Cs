import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge class names with Tailwind CSS support
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength - 3).trim() + '...';
}

/**
 * Format a date as relative time (e.g., "5m ago", "2h ago")
 */
export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const target = typeof date === 'string' ? new Date(date) : date;
  const diffMs = now.getTime() - target.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);

  if (diffSeconds < 60) {
    return 'just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return `${diffWeeks}w ago`;
  }
}

/**
 * Get Tailwind color class for risk level
 */
export function getRiskColor(level: 'low' | 'medium' | 'high' | 'blocked'): string {
  const colors: Record<string, string> = {
    low: 'text-green-600 bg-green-100',
    medium: 'text-yellow-600 bg-yellow-100',
    high: 'text-orange-600 bg-orange-100',
    blocked: 'text-red-600 bg-red-100',
  };
  return colors[level] || 'text-gray-600 bg-gray-100';
}

/**
 * Get Tailwind color class for CTA level
 */
export function getCTAColor(level: number): string {
  const colors: Record<number, string> = {
    0: 'text-green-600 bg-green-100',
    1: 'text-blue-600 bg-blue-100',
    2: 'text-yellow-600 bg-yellow-100',
    3: 'text-red-600 bg-red-100',
  };
  return colors[level] ?? 'text-gray-600 bg-gray-100';
}

/**
 * Format a percentage (e.g., 0.75 -> "75%")
 */
export function formatPercentage(value: number, decimals = 0): string {
  return (value * 100).toFixed(decimals) + '%';
}

/**
 * Format a score (e.g., 0.856 -> "0.86")
 */
export function formatScore(score: number, decimals = 2): string {
  return score.toFixed(decimals);
}

/**
 * Format platform name for display
 */
export function formatPlatformName(slug: string): string {
  const names: Record<string, string> = {
    reddit: 'Reddit',
    twitter: 'Twitter/X',
    quora: 'Quora',
    google: 'Google',
    linkedin: 'LinkedIn',
  };
  return names[slug] || slug.charAt(0).toUpperCase() + slug.slice(1);
}

/**
 * Get status badge color
 */
export function getStatusColor(
  status: 'pending' | 'approved' | 'rejected' | 'edited' | 'posted' | 'failed'
): string {
  const colors: Record<string, string> = {
    pending: 'text-blue-600 bg-blue-100',
    approved: 'text-green-600 bg-green-100',
    rejected: 'text-red-600 bg-red-100',
    edited: 'text-purple-600 bg-purple-100',
    posted: 'text-emerald-600 bg-emerald-100',
    failed: 'text-red-700 bg-red-200',
  };
  return colors[status] || 'text-gray-600 bg-gray-100';
}
