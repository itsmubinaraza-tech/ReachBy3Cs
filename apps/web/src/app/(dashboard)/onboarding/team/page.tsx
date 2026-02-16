'use client';

import { useState } from 'react';
import { Wizard, TeamInviteForm, type TeamInvite } from '@/components/onboarding';
import { useOrg } from '@/contexts/org-context';
import { inviteTeamMembers } from '@/lib/onboarding/actions';

export default function TeamOnboardingPage() {
  const { organization } = useOrg();

  const [invites, setInvites] = useState<TeamInvite[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNext = async (): Promise<boolean> => {
    // Team invites are optional
    if (invites.length === 0) {
      return true;
    }

    if (!organization?.id) {
      setError('Organization not loaded');
      return false;
    }

    setIsSubmitting(true);
    setError(null);

    const result = await inviteTeamMembers(
      organization.id,
      invites.map((i) => ({ email: i.email, role: i.role }))
    );

    setIsSubmitting(false);

    if (result.error) {
      // Show partial errors
      const failedInvites = result.results
        .filter((r) => !r.success)
        .map((r) => `${r.email}: ${r.error}`)
        .join(', ');
      setError(`Some invitations failed: ${failedInvites}`);
      return false;
    }

    return true;
  };

  return (
    <Wizard
      currentStep={4}
      title="Invite your team"
      description="Add team members who will help review and approve responses."
      onNext={handleNext}
      isSubmitting={isSubmitting}
      nextLabel="Complete Setup"
      showSkip
      skipLabel="Skip for now"
    >
      <TeamInviteForm
        invites={invites}
        onInvitesChange={setInvites}
        maxInvites={10}
      />

      {error && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg">
        <h4 className="font-medium text-gray-900 dark:text-white mb-2">
          Why invite team members?
        </h4>
        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li>- Distribute the review workload across your team</li>
          <li>- Get multiple perspectives on response quality</li>
          <li>- Speed up the approval process</li>
          <li>- Maintain brand voice consistency with reviewer guidelines</li>
        </ul>
      </div>
    </Wizard>
  );
}
