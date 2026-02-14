import { describe, it, expect } from 'vitest';
import { cn, truncate, formatRelativeTime, getRiskColor, getCTAColor } from '@/lib/utils';

describe('utils', () => {
  describe('cn', () => {
    it('should merge class names', () => {
      expect(cn('foo', 'bar')).toBe('foo bar');
    });

    it('should handle conditional classes', () => {
      expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
    });

    it('should merge tailwind classes correctly', () => {
      expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
    });
  });

  describe('truncate', () => {
    it('should not truncate short text', () => {
      expect(truncate('hello', 10)).toBe('hello');
    });

    it('should truncate long text with ellipsis', () => {
      expect(truncate('hello world', 8)).toBe('hello...');
    });

    it('should handle exact length', () => {
      expect(truncate('hello', 5)).toBe('hello');
    });
  });

  describe('formatRelativeTime', () => {
    it('should format recent time as just now', () => {
      const now = new Date();
      expect(formatRelativeTime(now)).toBe('just now');
    });

    it('should format minutes ago', () => {
      const date = new Date(Date.now() - 5 * 60 * 1000);
      expect(formatRelativeTime(date)).toBe('5m ago');
    });

    it('should format hours ago', () => {
      const date = new Date(Date.now() - 3 * 60 * 60 * 1000);
      expect(formatRelativeTime(date)).toBe('3h ago');
    });

    it('should format days ago', () => {
      const date = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      expect(formatRelativeTime(date)).toBe('2d ago');
    });
  });

  describe('getRiskColor', () => {
    it('should return correct color for low risk', () => {
      expect(getRiskColor('low')).toContain('green');
    });

    it('should return correct color for medium risk', () => {
      expect(getRiskColor('medium')).toContain('yellow');
    });

    it('should return correct color for high risk', () => {
      expect(getRiskColor('high')).toContain('orange');
    });

    it('should return correct color for blocked', () => {
      expect(getRiskColor('blocked')).toContain('red');
    });
  });

  describe('getCTAColor', () => {
    it('should return correct color for CTA level 0', () => {
      expect(getCTAColor(0)).toContain('green');
    });

    it('should return correct color for CTA level 1', () => {
      expect(getCTAColor(1)).toContain('blue');
    });

    it('should return correct color for CTA level 2', () => {
      expect(getCTAColor(2)).toContain('yellow');
    });

    it('should return correct color for CTA level 3', () => {
      expect(getCTAColor(3)).toContain('red');
    });
  });
});
