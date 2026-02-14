import type { Permission } from '@/lib/auth/rbac';

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  permission?: Permission;
  badge?: 'queue-count';
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

/**
 * Main navigation items
 */
export const mainNavItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: 'home',
  },
  {
    label: 'Queue',
    href: '/dashboard/queue',
    icon: 'inbox',
    permission: 'queue:view',
    badge: 'queue-count',
  },
  {
    label: 'Analytics',
    href: '/dashboard/analytics',
    icon: 'chart',
    permission: 'analytics:view',
  },
  {
    label: 'Communities',
    href: '/dashboard/communities',
    icon: 'users',
    permission: 'cluster:view',
  },
];

/**
 * Settings navigation items
 */
export const settingsNavItems: NavItem[] = [
  {
    label: 'Settings',
    href: '/dashboard/settings',
    icon: 'settings',
    permission: 'settings:view',
  },
  {
    label: 'Team',
    href: '/dashboard/settings/team',
    icon: 'team',
    permission: 'team:view',
  },
  {
    label: 'Platforms',
    href: '/dashboard/settings/platforms',
    icon: 'platforms',
    permission: 'platforms:view',
  },
  {
    label: 'Automation',
    href: '/dashboard/settings/automation',
    icon: 'automation',
    permission: 'automation:view',
  },
];

/**
 * Mobile bottom navigation items (subset of main items)
 */
export const mobileNavItems: NavItem[] = [
  {
    label: 'Home',
    href: '/dashboard',
    icon: 'home',
  },
  {
    label: 'Queue',
    href: '/dashboard/queue',
    icon: 'inbox',
    permission: 'queue:view',
    badge: 'queue-count',
  },
  {
    label: 'Analytics',
    href: '/dashboard/analytics',
    icon: 'chart',
    permission: 'analytics:view',
  },
  {
    label: 'Settings',
    href: '/dashboard/settings',
    icon: 'settings',
    permission: 'settings:view',
  },
];

/**
 * Full sidebar navigation sections
 */
export const sidebarSections: NavSection[] = [
  {
    items: mainNavItems,
  },
  {
    title: 'Configuration',
    items: settingsNavItems,
  },
];
