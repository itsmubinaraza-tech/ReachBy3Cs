'use client';

import { useAuth } from '@/contexts/auth-context';
import { useOrg } from '@/contexts/org-context';
import { useRole } from '@/hooks/use-role';

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { organization, isLoading: orgLoading } = useOrg();
  const { role, isAdmin, canReview } = useRole();

  if (authLoading || orgLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white" />
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 lg:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Welcome header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user?.fullName || user?.email}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {organization?.name} &middot; {role.charAt(0).toUpperCase() + role.slice(1)}
          </p>
        </div>

        {/* Quick stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <StatCard title="Pending Reviews" value="--" description="Responses awaiting review" />
          <StatCard title="Auto-Posted Today" value="--" description="Automatically posted" />
          <StatCard title="Total Engagements" value="--" description="This week" />
          <StatCard title="Active Clusters" value="--" description="Community clusters" />
        </div>

        {/* Action cards based on role */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {canReview && (
            <ActionCard
              title="Review Queue"
              description="Approve or reject pending responses"
              href="/dashboard/queue"
              buttonText="Go to Queue"
            />
          )}

          <ActionCard
            title="Analytics"
            description="View engagement metrics and trends"
            href="/dashboard/analytics"
            buttonText="View Analytics"
          />

          {isAdmin && (
            <ActionCard
              title="Settings"
              description="Configure platforms and automation"
              href="/dashboard/settings"
              buttonText="Open Settings"
            />
          )}

          <ActionCard
            title="Communities"
            description="Explore detected community clusters"
            href="/dashboard/communities"
            buttonText="View Communities"
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
      <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{description}</p>
    </div>
  );
}

function ActionCard({
  title,
  description,
  href,
  buttonText,
}: {
  title: string;
  description: string;
  href: string;
  buttonText: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{description}</p>
      <a
        href={href}
        className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
      >
        {buttonText}
      </a>
    </div>
  );
}
