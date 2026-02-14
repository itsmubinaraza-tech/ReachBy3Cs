'use client';

import { type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/hooks/use-sidebar';
import { useNavigationShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { Sidebar } from './sidebar';
import { MobileNav } from './mobile-nav';
import { MobileSidebar } from './mobile-sidebar';
import { Header } from './header';

interface ResponsiveLayoutProps {
  children: ReactNode;
}

export function ResponsiveLayout({ children }: ResponsiveLayoutProps) {
  const router = useRouter();
  const {
    isCollapsed,
    isMobileOpen,
    toggleCollapsed,
    closeMobile,
    openMobile,
  } = useSidebar();

  // Navigation keyboard shortcuts
  useNavigationShortcuts({
    onGoToDashboard: () => router.push('/dashboard'),
    onGoToQueue: () => router.push('/dashboard/queue'),
    onGoToAnalytics: () => router.push('/dashboard/analytics'),
    onGoToCommunities: () => router.push('/dashboard/communities'),
    onGoToSettings: () => router.push('/dashboard/settings'),
    onToggleSidebar: toggleCollapsed,
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Desktop sidebar */}
      <Sidebar isCollapsed={isCollapsed} onToggleCollapse={toggleCollapsed} />

      {/* Mobile sidebar overlay */}
      <MobileSidebar isOpen={isMobileOpen} onClose={closeMobile} />

      {/* Header */}
      <Header isSidebarCollapsed={isCollapsed} onMenuClick={openMobile} />

      {/* Main content */}
      <main
        className={cn(
          'pt-16 pb-20 lg:pb-0 transition-all duration-300 min-h-screen',
          'lg:ml-64',
          isCollapsed && 'lg:ml-16'
        )}
      >
        {children}
      </main>

      {/* Mobile bottom navigation */}
      <MobileNav />
    </div>
  );
}
