import type { UserRole } from 'shared-types';

/**
 * Permission definitions for the application
 */
export type Permission =
  // Queue permissions
  | 'queue:view'
  | 'queue:approve'
  | 'queue:reject'
  | 'queue:edit'
  | 'queue:bulk_action'
  // Response permissions
  | 'response:view'
  | 'response:create'
  | 'response:edit'
  | 'response:delete'
  | 'response:post'
  // Analytics permissions
  | 'analytics:view'
  | 'analytics:export'
  // Community/cluster permissions
  | 'cluster:view'
  | 'cluster:manage'
  // Settings permissions
  | 'settings:view'
  | 'settings:edit'
  // Team permissions
  | 'team:view'
  | 'team:invite'
  | 'team:remove'
  | 'team:edit_roles'
  // Automation permissions
  | 'automation:view'
  | 'automation:manage'
  // Platform connection permissions
  | 'platforms:view'
  | 'platforms:manage'
  // Billing permissions
  | 'billing:view'
  | 'billing:manage';

/**
 * Role hierarchy - higher index means more permissions
 */
const roleHierarchy: Record<UserRole, number> = {
  member: 0,
  reviewer: 1,
  admin: 2,
  owner: 3,
};

/**
 * Permission mappings for each role
 */
const rolePermissions: Record<UserRole, Permission[]> = {
  member: [
    'queue:view',
    'response:view',
    'analytics:view',
    'cluster:view',
    'settings:view',
  ],
  reviewer: [
    'queue:view',
    'queue:approve',
    'queue:reject',
    'queue:edit',
    'response:view',
    'response:edit',
    'analytics:view',
    'cluster:view',
    'settings:view',
    'team:view',
  ],
  admin: [
    'queue:view',
    'queue:approve',
    'queue:reject',
    'queue:edit',
    'queue:bulk_action',
    'response:view',
    'response:create',
    'response:edit',
    'response:delete',
    'response:post',
    'analytics:view',
    'analytics:export',
    'cluster:view',
    'cluster:manage',
    'settings:view',
    'settings:edit',
    'team:view',
    'team:invite',
    'team:remove',
    'automation:view',
    'automation:manage',
    'platforms:view',
    'platforms:manage',
  ],
  owner: [
    'queue:view',
    'queue:approve',
    'queue:reject',
    'queue:edit',
    'queue:bulk_action',
    'response:view',
    'response:create',
    'response:edit',
    'response:delete',
    'response:post',
    'analytics:view',
    'analytics:export',
    'cluster:view',
    'cluster:manage',
    'settings:view',
    'settings:edit',
    'team:view',
    'team:invite',
    'team:remove',
    'team:edit_roles',
    'automation:view',
    'automation:manage',
    'platforms:view',
    'platforms:manage',
    'billing:view',
    'billing:manage',
  ],
};

/**
 * Check if a user has a specific permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return rolePermissions[role]?.includes(permission) ?? false;
}

/**
 * Check if a user has all of the specified permissions
 */
export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every((permission) => hasPermission(role, permission));
}

/**
 * Check if a user has any of the specified permissions
 */
export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some((permission) => hasPermission(role, permission));
}

/**
 * Check if a role is at least as high as another role in the hierarchy
 */
export function isRoleAtLeast(role: UserRole, minRole: UserRole): boolean {
  return roleHierarchy[role] >= roleHierarchy[minRole];
}

/**
 * Check if a user can manage another user's role
 * (users can only manage roles below their own)
 */
export function canManageRole(userRole: UserRole, targetRole: UserRole): boolean {
  // Only owners can manage roles
  if (userRole !== 'owner') {
    return false;
  }
  // Can't change another owner's role
  return targetRole !== 'owner';
}

/**
 * Get all permissions for a role
 */
export function getPermissions(role: UserRole): Permission[] {
  return rolePermissions[role] ?? [];
}

/**
 * Get a human-readable label for a role
 */
export function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    member: 'Member',
    reviewer: 'Reviewer',
    admin: 'Admin',
    owner: 'Owner',
  };
  return labels[role];
}

/**
 * Get a description for a role
 */
export function getRoleDescription(role: UserRole): string {
  const descriptions: Record<UserRole, string> = {
    member: 'Can view queue and analytics',
    reviewer: 'Can approve and reject responses',
    admin: 'Can manage team, settings, and automation',
    owner: 'Full access including billing and ownership transfer',
  };
  return descriptions[role];
}

/**
 * Available roles for assignment (excludes owner)
 */
export const assignableRoles: UserRole[] = ['member', 'reviewer', 'admin'];

/**
 * All roles
 */
export const allRoles: UserRole[] = ['member', 'reviewer', 'admin', 'owner'];
