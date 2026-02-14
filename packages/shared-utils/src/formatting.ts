/**
 * Formatting utilities shared across web and mobile apps
 */

/**
 * Format a date as relative time (e.g., "2 hours ago", "3 days ago")
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
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSeconds < 60) {
    return 'just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  } else if (diffWeeks < 4) {
    return `${diffWeeks} ${diffWeeks === 1 ? 'week' : 'weeks'} ago`;
  } else if (diffMonths < 12) {
    return `${diffMonths} ${diffMonths === 1 ? 'month' : 'months'} ago`;
  } else {
    return `${diffYears} ${diffYears === 1 ? 'year' : 'years'} ago`;
  }
}

/**
 * Format a date as a short date string (e.g., "Jan 15, 2026")
 */
export function formatShortDate(date: Date | string): string {
  const target = typeof date === 'string' ? new Date(date) : date;
  return target.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format a date as a full datetime string (e.g., "January 15, 2026 at 3:30 PM")
 */
export function formatFullDateTime(date: Date | string): string {
  const target = typeof date === 'string' ? new Date(date) : date;
  return target.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Truncate text to a maximum length with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength - 3).trim() + '...';
}

/**
 * Format a number as a compact string (e.g., 1500 -> "1.5K")
 */
export function formatCompactNumber(num: number): string {
  if (num < 1000) {
    return num.toString();
  } else if (num < 1000000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  } else if (num < 1000000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  } else {
    return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
  }
}

/**
 * Format a percentage (e.g., 0.75 -> "75%")
 */
export function formatPercentage(value: number, decimals = 0): string {
  return (value * 100).toFixed(decimals) + '%';
}

/**
 * Format a decimal score (e.g., 0.856 -> "0.86")
 */
export function formatScore(score: number, decimals = 2): string {
  return score.toFixed(decimals);
}

/**
 * Capitalize the first letter of a string
 */
export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Convert a slug to a readable title (e.g., "my-slug-here" -> "My Slug Here")
 */
export function slugToTitle(slug: string): string {
  return slug
    .split(/[-_]/)
    .map(capitalize)
    .join(' ');
}

/**
 * Convert a string to a URL-safe slug
 */
export function toSlug(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Format risk level for display
 */
export function formatRiskLevel(level: 'low' | 'medium' | 'high' | 'blocked'): string {
  const labels: Record<string, string> = {
    low: 'Low Risk',
    medium: 'Medium Risk',
    high: 'High Risk',
    blocked: 'Blocked',
  };
  return labels[level] || level;
}

/**
 * Format CTA level for display
 */
export function formatCTALevel(level: number): string {
  const labels: Record<number, string> = {
    0: 'No CTA',
    1: 'Soft CTA',
    2: 'Medium CTA',
    3: 'Direct CTA',
  };
  return labels[level] ?? `CTA Level ${level}`;
}

/**
 * Format response status for display
 */
export function formatResponseStatus(
  status: 'pending' | 'approved' | 'rejected' | 'edited' | 'posted' | 'failed'
): string {
  const labels: Record<string, string> = {
    pending: 'Pending Review',
    approved: 'Approved',
    rejected: 'Rejected',
    edited: 'Edited',
    posted: 'Posted',
    failed: 'Failed',
  };
  return labels[status] || status;
}

/**
 * Format platform name for display
 */
export function formatPlatformName(slug: string): string {
  const names: Record<string, string> = {
    reddit: 'Reddit',
    twitter: 'Twitter/X',
    quora: 'Quora',
    google: 'Google Search',
    linkedin: 'LinkedIn',
    facebook: 'Facebook',
  };
  return names[slug] || capitalize(slug);
}
