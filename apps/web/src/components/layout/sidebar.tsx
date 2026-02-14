'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useRole } from '@/hooks/use-role';
import { hasPermission } from '@/lib/auth/rbac';
import { NavIcon } from './nav-icons';
import { sidebarSections, type NavItem } from './nav-config';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ isCollapsed, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  const { role } = useRole();

  const isActiveLink = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  const filterByPermission = (items: NavItem[]) => {
    return items.filter((item) => {
      if (!item.permission) return true;
      return hasPermission(role, item.permission);
    });
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 hidden lg:flex flex-col',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
        {!isCollapsed && (
          <Link href="/dashboard" className="font-semibold text-lg text-gray-900 dark:text-white">
            NM Platform
          </Link>
        )}
        <button
          onClick={onToggleCollapse}
          className={cn(
            'p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400',
            isCollapsed && 'mx-auto'
          )}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <NavIcon
            name={isCollapsed ? 'chevronRight' : 'chevronLeft'}
            className="w-5 h-5"
          />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        {sidebarSections.map((section, sectionIndex) => {
          const visibleItems = filterByPermission(section.items);
          if (visibleItems.length === 0) return null;

          return (
            <div key={sectionIndex} className="mb-4">
              {section.title && !isCollapsed && (
                <h3 className="px-4 mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {section.title}
                </h3>
              )}
              <ul className="space-y-1 px-2">
                {visibleItems.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                        isActiveLink(item.href)
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700',
                        isCollapsed && 'justify-center px-2'
                      )}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <NavIcon name={item.icon} className="w-5 h-5 flex-shrink-0" />
                      {!isCollapsed && (
                        <span className="flex-1 truncate">{item.label}</span>
                      )}
                      {item.badge === 'queue-count' && !isCollapsed && (
                        <QueueBadge />
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* Keyboard shortcut hint */}
      {!isCollapsed && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Press <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">?</kbd> for shortcuts
          </p>
        </div>
      )}
    </aside>
  );
}

function QueueBadge() {
  // TODO: Connect to real queue count from context/API
  const count = 0;

  if (count === 0) return null;

  return (
    <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-full">
      {count > 99 ? '99+' : count}
    </span>
  );
}
