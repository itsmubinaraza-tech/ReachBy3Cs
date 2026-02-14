'use client';

import { useAuth } from '@/contexts/auth-context';
import {
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  isRoleAtLeast,
  getPermissions,
  type Permission,
} from '@/lib/auth/rbac';
import type { UserRole } from 'shared-types';

/**
 * Hook for role-based access control
 */
export function useRole() {
  const { user } = useAuth();
  const role = user?.role ?? 'member';

  return {
    role,

    /**
     * Check if user has a specific permission
     */
    can: (permission: Permission) => hasPermission(role, permission),

    /**
     * Check if user has all of the specified permissions
     */
    canAll: (permissions: Permission[]) => hasAllPermissions(role, permissions),

    /**
     * Check if user has any of the specified permissions
     */
    canAny: (permissions: Permission[]) => hasAnyPermission(role, permissions),

    /**
     * Check if user's role is at least the specified role
     */
    isAtLeast: (minRole: UserRole) => isRoleAtLeast(role, minRole),

    /**
     * Get all permissions for the user's role
     */
    permissions: getPermissions(role),

    /**
     * Check if user is an owner
     */
    isOwner: role === 'owner',

    /**
     * Check if user is an admin or owner
     */
    isAdmin: role === 'admin' || role === 'owner',

    /**
     * Check if user can review (approve/reject)
     */
    canReview: hasPermission(role, 'queue:approve'),
  };
}
