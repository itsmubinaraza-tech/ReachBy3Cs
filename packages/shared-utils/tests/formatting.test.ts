import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatRelativeTime,
  formatShortDate,
  formatFullDateTime,
  truncateText,
  formatCompactNumber,
  formatPercentage,
  formatScore,
  capitalize,
  slugToTitle,
  toSlug,
  formatRiskLevel,
  formatCTALevel,
  formatResponseStatus,
  formatPlatformName,
} from '../src/formatting';

describe('formatRelativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "just now" for times less than a minute ago', () => {
    const date = new Date('2026-01-15T11:59:30Z');
    expect(formatRelativeTime(date)).toBe('just now');
  });

  it('returns minutes ago for times less than an hour ago', () => {
    const date = new Date('2026-01-15T11:45:00Z');
    expect(formatRelativeTime(date)).toBe('15 minutes ago');
  });

  it('returns singular minute', () => {
    const date = new Date('2026-01-15T11:59:00Z');
    expect(formatRelativeTime(date)).toBe('1 minute ago');
  });

  it('returns hours ago for times less than a day ago', () => {
    const date = new Date('2026-01-15T09:00:00Z');
    expect(formatRelativeTime(date)).toBe('3 hours ago');
  });

  it('returns singular hour', () => {
    const date = new Date('2026-01-15T11:00:00Z');
    expect(formatRelativeTime(date)).toBe('1 hour ago');
  });

  it('returns days ago for times less than a week ago', () => {
    const date = new Date('2026-01-12T12:00:00Z');
    expect(formatRelativeTime(date)).toBe('3 days ago');
  });

  it('returns weeks ago for times less than a month ago', () => {
    const date = new Date('2026-01-01T12:00:00Z');
    expect(formatRelativeTime(date)).toBe('2 weeks ago');
  });

  it('returns months ago for times less than a year ago', () => {
    const date = new Date('2025-10-15T12:00:00Z');
    expect(formatRelativeTime(date)).toBe('3 months ago');
  });

  it('returns years ago for older times', () => {
    const date = new Date('2024-01-15T12:00:00Z');
    expect(formatRelativeTime(date)).toBe('2 years ago');
  });

  it('accepts string dates', () => {
    expect(formatRelativeTime('2026-01-15T11:59:30Z')).toBe('just now');
  });
});

describe('formatShortDate', () => {
  it('formats date correctly', () => {
    const date = new Date('2026-01-15T12:00:00Z');
    expect(formatShortDate(date)).toBe('Jan 15, 2026');
  });

  it('accepts string dates', () => {
    // Use midday to avoid timezone edge cases
    expect(formatShortDate('2026-12-25T12:00:00Z')).toContain('Dec');
    expect(formatShortDate('2026-12-25T12:00:00Z')).toContain('2026');
  });
});

describe('formatFullDateTime', () => {
  it('formats datetime correctly', () => {
    const date = new Date('2026-01-15T15:30:00Z');
    const result = formatFullDateTime(date);
    expect(result).toContain('January');
    expect(result).toContain('15');
    expect(result).toContain('2026');
  });
});

describe('truncateText', () => {
  it('returns original text if shorter than max length', () => {
    expect(truncateText('Hello', 10)).toBe('Hello');
  });

  it('truncates text with ellipsis', () => {
    expect(truncateText('Hello World', 8)).toBe('Hello...');
  });

  it('handles exact length', () => {
    expect(truncateText('Hello', 5)).toBe('Hello');
  });
});

describe('formatCompactNumber', () => {
  it('returns number as-is if less than 1000', () => {
    expect(formatCompactNumber(500)).toBe('500');
  });

  it('formats thousands with K suffix', () => {
    expect(formatCompactNumber(1500)).toBe('1.5K');
    expect(formatCompactNumber(1000)).toBe('1K');
  });

  it('formats millions with M suffix', () => {
    expect(formatCompactNumber(1500000)).toBe('1.5M');
    expect(formatCompactNumber(1000000)).toBe('1M');
  });

  it('formats billions with B suffix', () => {
    expect(formatCompactNumber(1500000000)).toBe('1.5B');
  });
});

describe('formatPercentage', () => {
  it('formats decimal as percentage', () => {
    expect(formatPercentage(0.75)).toBe('75%');
  });

  it('respects decimal places', () => {
    expect(formatPercentage(0.756, 1)).toBe('75.6%');
    expect(formatPercentage(0.7567, 2)).toBe('75.67%');
  });
});

describe('formatScore', () => {
  it('formats score with default decimals', () => {
    expect(formatScore(0.856)).toBe('0.86');
  });

  it('respects custom decimals', () => {
    expect(formatScore(0.8567, 3)).toBe('0.857');
  });
});

describe('capitalize', () => {
  it('capitalizes first letter', () => {
    expect(capitalize('hello')).toBe('Hello');
  });

  it('handles empty string', () => {
    expect(capitalize('')).toBe('');
  });

  it('handles already capitalized', () => {
    expect(capitalize('Hello')).toBe('Hello');
  });
});

describe('slugToTitle', () => {
  it('converts hyphenated slug to title', () => {
    expect(slugToTitle('my-slug-here')).toBe('My Slug Here');
  });

  it('converts underscored slug to title', () => {
    expect(slugToTitle('my_slug_here')).toBe('My Slug Here');
  });

  it('handles single word', () => {
    expect(slugToTitle('hello')).toBe('Hello');
  });
});

describe('toSlug', () => {
  it('converts string to slug', () => {
    expect(toSlug('Hello World')).toBe('hello-world');
  });

  it('removes special characters', () => {
    expect(toSlug('Hello! World?')).toBe('hello-world');
  });

  it('handles multiple spaces', () => {
    expect(toSlug('Hello   World')).toBe('hello-world');
  });

  it('trims leading and trailing hyphens', () => {
    expect(toSlug('  Hello World  ')).toBe('hello-world');
  });
});

describe('formatRiskLevel', () => {
  it('formats risk levels correctly', () => {
    expect(formatRiskLevel('low')).toBe('Low Risk');
    expect(formatRiskLevel('medium')).toBe('Medium Risk');
    expect(formatRiskLevel('high')).toBe('High Risk');
    expect(formatRiskLevel('blocked')).toBe('Blocked');
  });
});

describe('formatCTALevel', () => {
  it('formats CTA levels correctly', () => {
    expect(formatCTALevel(0)).toBe('No CTA');
    expect(formatCTALevel(1)).toBe('Soft CTA');
    expect(formatCTALevel(2)).toBe('Medium CTA');
    expect(formatCTALevel(3)).toBe('Direct CTA');
  });

  it('handles unknown levels', () => {
    expect(formatCTALevel(5)).toBe('CTA Level 5');
  });
});

describe('formatResponseStatus', () => {
  it('formats statuses correctly', () => {
    expect(formatResponseStatus('pending')).toBe('Pending Review');
    expect(formatResponseStatus('approved')).toBe('Approved');
    expect(formatResponseStatus('rejected')).toBe('Rejected');
    expect(formatResponseStatus('edited')).toBe('Edited');
    expect(formatResponseStatus('posted')).toBe('Posted');
    expect(formatResponseStatus('failed')).toBe('Failed');
  });
});

describe('formatPlatformName', () => {
  it('formats known platforms correctly', () => {
    expect(formatPlatformName('reddit')).toBe('Reddit');
    expect(formatPlatformName('twitter')).toBe('Twitter/X');
    expect(formatPlatformName('quora')).toBe('Quora');
    expect(formatPlatformName('linkedin')).toBe('LinkedIn');
  });

  it('capitalizes unknown platforms', () => {
    expect(formatPlatformName('unknown')).toBe('Unknown');
  });
});
