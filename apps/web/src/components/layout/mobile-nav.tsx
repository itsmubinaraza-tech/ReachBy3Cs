'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useRole } from '@/hooks/use-role';
import { hasPermission } from '@/lib/auth/rbac';
import { NavIcon } from './nav-icons';
import { mobileNavItems, type NavItem } from './nav-config';

export function MobileNav() {
  const pathname = usePathname();
  const { role } = useRole();

  const isActiveLink = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  const visibleItems = mobileNavItems.filter((item) => {
    if (!item.permission) return true;
    return hasPermission(role, item.permission);
  });

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 lg:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {visibleItems.map((item) => (
          <MobileNavItem
            key={item.href}
            item={item}
            isActive={isActiveLink(item.href)}
          />
        ))}
      </div>
    </nav>
  );
}

interface MobileNavItemProps {
  item: NavItem;
  isActive: boolean;
}

function MobileNavItem({ item, isActive }: MobileNavItemProps) {
  return (
    <Link
      href={item.href}
      className={cn(
        'flex flex-col items-center justify-center flex-1 py-2 px-1 rounded-lg transition-colors min-w-0',
        isActive
          ? 'text-blue-600 dark:text-blue-400'
          : 'text-gray-600 dark:text-gray-400 active:bg-gray-100 dark:active:bg-gray-700'
      )}
    >
      <div className="relative">
        <NavIcon name={item.icon} className="w-6 h-6" />
        {item.badge === 'queue-count' && <MobileQueueBadge />}
      </div>
      <span className={cn(
        'text-xs mt-1 truncate max-w-full',
        isActive ? 'font-medium' : 'font-normal'
      )}>
        {item.label}
      </span>
    </Link>
  );
}

function MobileQueueBadge() {
  // TODO: Connect to real queue count from context/API
  const count = 0;

  if (count === 0) return null;

  return (
    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold bg-red-500 text-white rounded-full px-1">
      {count > 99 ? '99+' : count}
    </span>
  );
}
