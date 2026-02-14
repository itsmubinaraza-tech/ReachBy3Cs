'use client';

import { useState, useEffect } from 'react';
import { useMediaQuery, breakpoints } from './use-media-query';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';
export type Orientation = 'portrait' | 'landscape';

interface DeviceInfo {
  type: DeviceType;
  orientation: Orientation;
  isTouchDevice: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isSafari: boolean;
}

/**
 * Hook to detect device type and capabilities
 */
export function useDeviceType(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    type: 'desktop',
    orientation: 'landscape',
    isTouchDevice: false,
    isIOS: false,
    isAndroid: false,
    isSafari: false,
  });

  const isAboveLg = useMediaQuery(`(min-width: ${breakpoints.lg}px)`);
  const isAboveSm = useMediaQuery(`(min-width: ${breakpoints.sm}px)`);
  const isLandscape = useMediaQuery('(orientation: landscape)');

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    const isSafari = /safari/.test(userAgent) && !/chrome/.test(userAgent);

    // Determine device type based on screen size and touch capability
    let type: DeviceType = 'desktop';
    if (!isAboveSm) {
      type = 'mobile';
    } else if (!isAboveLg) {
      type = 'tablet';
    }

    setDeviceInfo({
      type,
      orientation: isLandscape ? 'landscape' : 'portrait',
      isTouchDevice,
      isIOS,
      isAndroid,
      isSafari,
    });
  }, [isAboveLg, isAboveSm, isLandscape]);

  return deviceInfo;
}

/**
 * Hook to detect if the device prefers reduced motion
 */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}

/**
 * Hook to detect dark mode preference
 */
export function usePrefersDarkMode(): boolean {
  return useMediaQuery('(prefers-color-scheme: dark)');
}
