'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { useOrg } from '@/contexts/org-context';
import { cn } from '@/lib/utils';
import { NavIcon } from './nav-icons';

interface HeaderProps {
  isSidebarCollapsed: boolean;
  onMenuClick: () => void;
}

export function Header({ isSidebarCollapsed, onMenuClick }: HeaderProps) {
  const { user, signOut } = useAuth();
  const { organization } = useOrg();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setIsUserMenuOpen(false);
    await signOut();
  };

  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-30 h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-all duration-300',
        'left-0 lg:left-64',
        isSidebarCollapsed && 'lg:left-16'
      )}
    >
      <div className="flex items-center justify-between h-full px-4 sm:px-6">
        {/* Left section */}
        <div className="flex items-center gap-4">
          {/* Mobile menu button */}
          <button
            onClick={onMenuClick}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 lg:hidden"
            aria-label="Open menu"
          >
            <NavIcon name="menu" className="w-6 h-6" />
          </button>

          {/* Mobile logo */}
          <Link
            href="/dashboard"
            className="font-semibold text-lg text-gray-900 dark:text-white lg:hidden"
          >
            NM Platform
          </Link>

          {/* Organization name (desktop) */}
          <div className="hidden lg:block">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {organization?.name || 'Loading...'}
            </span>
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Notifications button */}
          <button
            className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
            aria-label="Notifications"
          >
            <NavIcon name="bell" className="w-6 h-6" />
            {/* Notification badge - TODO: connect to real data */}
            {/* <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" /> */}
          </button>

          {/* User menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-expanded={isUserMenuOpen}
              aria-haspopup="true"
            >
              {/* Avatar */}
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt=""
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    {user?.fullName?.[0] || user?.email?.[0] || 'U'}
                  </span>
                )}
              </div>

              {/* Name (hidden on mobile) */}
              <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-300 max-w-[120px] truncate">
                {user?.fullName || user?.email}
              </span>
            </button>

            {/* Dropdown menu */}
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                {/* User info */}
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {user?.fullName || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user?.email}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 capitalize">
                    {user?.role}
                  </p>
                </div>

                {/* Menu items */}
                <div className="py-1">
                  <Link
                    href="/dashboard/settings/profile"
                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <NavIcon name="user" className="w-4 h-4" />
                    Profile
                  </Link>
                  <Link
                    href="/dashboard/settings"
                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <NavIcon name="settings" className="w-4 h-4" />
                    Settings
                  </Link>
                </div>

                {/* Sign out */}
                <div className="border-t border-gray-200 dark:border-gray-700 py-1">
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <NavIcon name="logout" className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
