'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useOrg } from '@/contexts/org-context';
import { completeOnboarding, getOnboardingStatus } from '@/lib/onboarding/actions';

export default function OnboardingCompletePage() {
  const router = useRouter();
  const { organization, refreshOrganization } = useOrg();

  const [isCompleting, setIsCompleting] = useState(true);
  const [status, setStatus] = useState<{
    profile: boolean;
    categories: boolean;
    platforms: boolean;
    team: boolean;
  } | null>(null);

  useEffect(() => {
    async function complete() {
      if (!organization?.id) return;

      // Get current status
      const statusResult = await getOnboardingStatus(organization.id);
      if (statusResult.status) {
        setStatus({
          profile: statusResult.status.profile,
          categories: statusResult.status.categories,
          platforms: statusResult.status.platforms,
          team: statusResult.status.team,
        });
      }

      // Mark onboarding as complete
      const result = await completeOnboarding(organization.id);
      if (!result.error) {
        await refreshOrganization();
      }

      setIsCompleting(false);
    }

    complete();
  }, [organization?.id, refreshOrganization]);

  const handleGoToDashboard = () => {
    router.push('/dashboard');
  };

  if (isCompleting) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4">
            <svg
              className="animate-spin w-full h-full text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Completing setup...
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-2xl mx-auto px-4 py-16">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
            <svg
              className="w-10 h-10 text-green-600 dark:text-green-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            You are all set!
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Your ReachBy3Cs account is ready to go.
          </p>
        </div>

        {/* Setup Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Setup Summary
          </h2>
          <ul className="space-y-3">
            <li className="flex items-center gap-3">
              <StatusIcon completed={status?.profile} />
              <span className="text-gray-700 dark:text-gray-300">
                Business profile configured
              </span>
            </li>
            <li className="flex items-center gap-3">
              <StatusIcon completed={status?.categories} />
              <span className="text-gray-700 dark:text-gray-300">
                Problem categories selected
              </span>
            </li>
            <li className="flex items-center gap-3">
              <StatusIcon completed={status?.platforms} />
              <span className="text-gray-700 dark:text-gray-300">
                {status?.platforms
                  ? 'Platforms connected'
                  : 'No platforms connected yet'}
              </span>
            </li>
            <li className="flex items-center gap-3">
              <StatusIcon completed={status?.team} />
              <span className="text-gray-700 dark:text-gray-300">
                {status?.team
                  ? 'Team members invited'
                  : 'No team members invited yet'}
              </span>
            </li>
          </ul>
        </div>

        {/* Next Steps */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-6 mb-8">
          <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">
            Recommended Next Steps
          </h2>
          <ul className="space-y-3 text-blue-800 dark:text-blue-200">
            {!status?.platforms && (
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-300 rounded-full flex items-center justify-center text-sm font-medium">
                  1
                </span>
                <span>
                  <Link
                    href="/dashboard/settings/platforms"
                    className="underline hover:no-underline"
                  >
                    Connect your first platform
                  </Link>{' '}
                  to start monitoring conversations
                </span>
              </li>
            )}
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-300 rounded-full flex items-center justify-center text-sm font-medium">
                {status?.platforms ? '1' : '2'}
              </span>
              <span>
                <Link
                  href="/dashboard/settings/automation"
                  className="underline hover:no-underline"
                >
                  Configure automation rules
                </Link>{' '}
                for auto-posting low-risk responses
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-300 rounded-full flex items-center justify-center text-sm font-medium">
                {status?.platforms ? '2' : '3'}
              </span>
              <span>
                Check out the{' '}
                <Link
                  href="/dashboard/queue"
                  className="underline hover:no-underline"
                >
                  review queue
                </Link>{' '}
                once posts start coming in
              </span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleGoToDashboard}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Go to Dashboard
          </button>
          <Link
            href="/dashboard/settings"
            className="px-8 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg font-medium transition-colors text-center"
          >
            Configure Settings
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatusIcon({ completed }: { completed?: boolean }) {
  if (completed) {
    return (
      <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center">
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={3}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className="w-6 h-6 bg-gray-100 dark:bg-gray-700 text-gray-400 rounded-full flex items-center justify-center">
      <svg
        className="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
        />
      </svg>
    </div>
  );
}
