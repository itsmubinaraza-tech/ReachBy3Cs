'use client';

import { useState } from 'react';
import { SettingsSection, TeamList, TeamInviteModal } from '@/components/settings';
import { useTeamMembers } from '@/hooks/use-settings';
import { hasPermission } from '@/lib/auth/rbac';

export default function TeamSettingsPage() {
  const {
    members,
    isLoading,
    error,
    currentUserId,
    currentUserRole,
    updateRole,
    removeMember,
    inviteMember,
    refresh,
  } = useTeamMembers();

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const canInvite = hasPermission(currentUserRole, 'team:invite');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading team members...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SettingsSection
        title="Team Members"
        description="Manage your organization's team members and their roles"
        action={
          canInvite && (
            <button
              onClick={() => setIsInviteModalOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <PlusIcon className="w-4 h-4" />
              <span>Invite Member</span>
            </button>
          )
        }
      >
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error.message}</p>
          </div>
        )}

        <TeamList
          members={members}
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
          onUpdateRole={updateRole}
          onRemoveMember={removeMember}
        />
      </SettingsSection>

      <TeamInviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onInvite={async (email, role) => {
          const result = await inviteMember(email, role);
          if (!result.error) {
            await refresh();
          }
          return result;
        }}
      />
    </>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}
