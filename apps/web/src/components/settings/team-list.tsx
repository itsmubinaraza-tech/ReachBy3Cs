'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { getRoleLabel, getRoleDescription, assignableRoles, canManageRole } from '@/lib/auth/rbac';
import type { UserRole } from 'shared-types';

export interface TeamMember {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  role: UserRole;
  lastActiveAt: string | null;
  createdAt: string;
}

interface TeamListProps {
  members: TeamMember[];
  currentUserId: string;
  currentUserRole: UserRole;
  onUpdateRole: (userId: string, role: UserRole) => Promise<{ error: Error | null }>;
  onRemoveMember: (userId: string) => Promise<{ error: Error | null }>;
}

export function TeamList({
  members,
  currentUserId,
  currentUserRole,
  onUpdateRole,
  onRemoveMember,
}: TeamListProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setLoadingId(userId);
    setError(null);

    const result = await onUpdateRole(userId, newRole);

    if (result.error) {
      setError(result.error.message);
    }

    setLoadingId(null);
  };

  const handleRemove = async (userId: string, memberName: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to remove ${memberName} from the team?`
    );

    if (!confirmed) return;

    setLoadingId(userId);
    setError(null);

    const result = await onRemoveMember(userId);

    if (result.error) {
      setError(result.error.message);
    }

    setLoadingId(null);
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {members.map((member) => {
          const isCurrentUser = member.id === currentUserId;
          const canManage = canManageRole(currentUserRole, member.role) && !isCurrentUser;
          const isLoading = loadingId === member.id;

          return (
            <div
              key={member.id}
              className={cn(
                'py-4 first:pt-0 last:pb-0',
                isLoading && 'opacity-50'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center overflow-hidden">
                    {member.avatarUrl ? (
                      <img
                        src={member.avatarUrl}
                        alt={member.fullName || member.email}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-blue-600 dark:text-blue-400 font-medium">
                        {(member.fullName || member.email).charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {member.fullName || member.email}
                      </p>
                      {isCurrentUser && (
                        <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded">
                          You
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {member.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Role Badge/Selector */}
                  {canManage ? (
                    <select
                      value={member.role}
                      onChange={(e) => handleRoleChange(member.id, e.target.value as UserRole)}
                      disabled={isLoading}
                      className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {assignableRoles.map((role) => (
                        <option key={role} value={role}>
                          {getRoleLabel(role)}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span
                      className={cn(
                        'px-3 py-1.5 text-sm rounded-lg font-medium',
                        getRoleBadgeColor(member.role)
                      )}
                    >
                      {getRoleLabel(member.role)}
                    </span>
                  )}

                  {/* Last Active */}
                  <div className="hidden sm:block text-right min-w-[100px]">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {member.lastActiveAt
                        ? formatRelativeTime(member.lastActiveAt)
                        : 'Never'}
                    </p>
                  </div>

                  {/* Remove Button */}
                  {canManage && (
                    <button
                      type="button"
                      onClick={() => handleRemove(member.id, member.fullName || member.email)}
                      disabled={isLoading}
                      className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                      title="Remove from team"
                    >
                      <XIcon className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {members.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">
            No team members yet. Invite your first team member to get started.
          </p>
        </div>
      )}
    </div>
  );
}

function getRoleBadgeColor(role: UserRole): string {
  const colors: Record<UserRole, string> = {
    owner: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
    admin: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    reviewer: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    member: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
  };
  return colors[role];
}

function formatRelativeTime(date: string): string {
  const now = new Date();
  const target = new Date(date);
  const diffMs = now.getTime() - target.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return target.toLocaleDateString();
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
