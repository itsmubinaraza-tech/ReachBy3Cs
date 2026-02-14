'use client';

import { useState, useEffect, useCallback } from 'react';

const SIDEBAR_STORAGE_KEY = 'sidebar-collapsed';

/**
 * Hook to manage sidebar collapsed state with localStorage persistence
 */
export function useSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Load initial state from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    if (stored !== null) {
      setIsCollapsed(stored === 'true');
    }
  }, []);

  // Persist collapsed state to localStorage
  const toggleCollapsed = useCallback(() => {
    setIsCollapsed((prev) => {
      const newValue = !prev;
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(newValue));
      return newValue;
    });
  }, []);

  const setCollapsed = useCallback((value: boolean) => {
    setIsCollapsed(value);
    localStorage.setItem(SIDEBAR_STORAGE_KEY, String(value));
  }, []);

  const toggleMobileOpen = useCallback(() => {
    setIsMobileOpen((prev) => !prev);
  }, []);

  const closeMobile = useCallback(() => {
    setIsMobileOpen(false);
  }, []);

  const openMobile = useCallback(() => {
    setIsMobileOpen(true);
  }, []);

  return {
    isCollapsed,
    isMobileOpen,
    toggleCollapsed,
    setCollapsed,
    toggleMobileOpen,
    closeMobile,
    openMobile,
  };
}
