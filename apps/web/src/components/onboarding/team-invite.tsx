'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { UserRole } from 'shared-types';

export interface TeamInvite {
  id: string;
  email: string;
  role: UserRole;
}

const roleOptions: { value: UserRole; label: string; description: string }[] = [
  { value: 'reviewer', label: 'Reviewer', description: 'Can approve and reject responses' },
  { value: 'admin', label: 'Admin', description: 'Can manage team, settings, and automation' },
  { value: 'member', label: 'Member', description: 'Can view queue and analytics only' },
];

interface TeamInviteFormProps {
  invites: TeamInvite[];
  onInvitesChange: (invites: TeamInvite[]) => void;
  maxInvites?: number;
}

export function TeamInviteForm({
  invites,
  onInvitesChange,
  maxInvites = 10,
}: TeamInviteFormProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('reviewer');
  const [error, setError] = useState<string | null>(null);

  const handleAddInvite = () => {
    setError(null);

    // Validate email
    if (!email.trim()) {
      setError('Please enter an email address');
      return;
    }

    if (!isValidEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    // Check for duplicates
    if (invites.some((invite) => invite.email.toLowerCase() === email.toLowerCase())) {
      setError('This email has already been added');
      return;
    }

    // Check max invites
    if (invites.length >= maxInvites) {
      setError(`You can only invite up to ${maxInvites} team members at once`);
      return;
    }

    // Add invite
    const newInvite: TeamInvite = {
      id: crypto.randomUUID(),
      email: email.trim().toLowerCase(),
      role,
    };

    onInvitesChange([...invites, newInvite]);
    setEmail('');
    setRole('reviewer');
  };

  const handleRemoveInvite = (id: string) => {
    onInvitesChange(invites.filter((invite) => invite.id !== id));
  };

  const handleRoleChange = (id: string, newRole: UserRole) => {
    onInvitesChange(
      invites.map((invite) =>
        invite.id === id ? { ...invite, role: newRole } : invite
      )
    );
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Invite team members to help review and approve responses.
        They will receive an email invitation to join your organization.
      </p>

      {/* Add Invite Form */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError(null);
            }}
            placeholder="teammate@company.com"
            className={cn(
              'w-full px-4 py-2 rounded-lg border bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500',
              error
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 dark:border-gray-600'
            )}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddInvite();
              }
            }}
          />
        </div>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as UserRole)}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {roleOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleAddInvite}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
        >
          <PlusIcon className="w-4 h-4" />
          <span>Add</span>
        </button>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {/* Pending Invites List */}
      {invites.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Pending Invitations ({invites.length})
          </h4>
          <ul className="space-y-2">
            {invites.map((invite) => (
              <li
                key={invite.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {invite.email}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {roleOptions.find((r) => r.value === invite.role)?.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={invite.role}
                    onChange={(e) => handleRoleChange(invite.id, e.target.value as UserRole)}
                    className="text-sm px-2 py-1 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {roleOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => handleRemoveInvite(invite.id)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    title="Remove"
                  >
                    <XIcon className="w-5 h-5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Role Descriptions */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Role Permissions
        </h4>
        <ul className="space-y-2">
          {roleOptions.map((option) => (
            <li key={option.value} className="flex items-start gap-2 text-sm">
              <span className="font-medium text-gray-700 dark:text-gray-300 w-20">
                {option.label}:
              </span>
              <span className="text-gray-500 dark:text-gray-400">
                {option.description}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}
