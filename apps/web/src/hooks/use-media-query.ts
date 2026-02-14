'use client';

import { useState, useEffect } from 'react';

/**
 * Hook to detect if a media query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

/**
 * Tailwind breakpoint values
 */
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

/**
 * Predefined media query hooks matching Tailwind breakpoints
 */
export function useIsMobile(): boolean {
  return !useMediaQuery(`(min-width: ${breakpoints.sm}px)`);
}

export function useIsTablet(): boolean {
  const isAboveSm = useMediaQuery(`(min-width: ${breakpoints.sm}px)`);
  const isBelowLg = !useMediaQuery(`(min-width: ${breakpoints.lg}px)`);
  return isAboveSm && isBelowLg;
}

export function useIsDesktop(): boolean {
  return useMediaQuery(`(min-width: ${breakpoints.lg}px)`);
}

export function useIsLargeDesktop(): boolean {
  return useMediaQuery(`(min-width: ${breakpoints.xl}px)`);
}

/**
 * Hook to get current breakpoint name
 */
export type Breakpoint = 'mobile' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export function useBreakpoint(): Breakpoint {
  const is2xl = useMediaQuery(`(min-width: ${breakpoints['2xl']}px)`);
  const isXl = useMediaQuery(`(min-width: ${breakpoints.xl}px)`);
  const isLg = useMediaQuery(`(min-width: ${breakpoints.lg}px)`);
  const isMd = useMediaQuery(`(min-width: ${breakpoints.md}px)`);
  const isSm = useMediaQuery(`(min-width: ${breakpoints.sm}px)`);

  if (is2xl) return '2xl';
  if (isXl) return 'xl';
  if (isLg) return 'lg';
  if (isMd) return 'md';
  if (isSm) return 'sm';
  return 'mobile';
}
