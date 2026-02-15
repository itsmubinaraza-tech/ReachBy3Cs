'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { useOrg } from '@/contexts/org-context';
import { useRole } from '@/hooks/use-role';
import { mockQuickStats, mockRecentActivity, type RecentActivity } from '@/lib/mock-data';
import { cn, formatRelativeTime } from '@/lib/utils';

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { organization, isLoading: orgLoading } = useOrg();
  const { role, isAdmin, canReview } = useRole();

  // For demo mode, show content even without auth
  const isDemoMode = !user && !authLoading;
  const displayName = user?.fullName || user?.email || 'Demo User';
  const displayOrg = organization?.name || 'Demo Organization';
  const displayRole = isDemoMode ? 'Admin' : role.charAt(0).toUpperCase() + role.slice(1);

  if (authLoading || orgLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Demo Mode Banner */}
        {isDemoMode && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-blue-600 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Demo Mode - Using mock data. Click around to explore the interface!
              </span>
            </div>
          </div>
        )}

        {/* Welcome header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back, {displayName}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {displayOrg} &middot; {displayRole}
          </p>
        </div>

        {/* Quick stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-8">
          {mockQuickStats.map((stat) => (
            <StatCard
              key={stat.id}
              title={stat.title}
              value={stat.value}
              change={stat.change}
              changeLabel={stat.changeLabel}
              description={stat.description}
            />
          ))}
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Action cards */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(canReview || isDemoMode) && (
                <ActionCard
                  title="Review Queue"
                  description="6 responses awaiting approval"
                  href="/dashboard/queue"
                  buttonText="Go to Queue"
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                      />
                    </svg>
                  }
                  badge="6"
                />
              )}

              <ActionCard
                title="Analytics"
                description="View engagement metrics"
                href="/dashboard/analytics"
                buttonText="View Analytics"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                }
              />

              {(isAdmin || isDemoMode) && (
                <ActionCard
                  title="Settings"
                  description="Configure automation"
                  href="/dashboard/settings"
                  buttonText="Open Settings"
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  }
                />
              )}

              <ActionCard
                title="Communities"
                description="Explore clusters"
                href="/dashboard/communities"
                buttonText="View Communities"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                }
              />
            </div>
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-1">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Recent Activity
            </h2>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {mockRecentActivity.slice(0, 5).map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))}
              </ul>
              <div className="p-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
                <Link
                  href="/dashboard/activity"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  View all activity
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">System Status</h2>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                All systems operational
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <SystemService name="Signal Detection" status="operational" latency={145} />
              <SystemService name="Response Gen" status="operational" latency={890} />
              <SystemService name="Risk Analysis" status="operational" latency={234} />
              <SystemService name="Platform APIs" status="operational" latency={312} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  change,
  changeLabel,
  description,
}: {
  title: string;
  value: string;
  change?: number;
  changeLabel?: string;
  description: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-5">
      <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
      <div className="flex items-end gap-2 mt-1">
        <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
          {value}
        </p>
        {change !== undefined && (
          <span
            className={cn(
              'text-xs font-medium mb-1',
              change >= 0 ? 'text-green-600' : 'text-red-600'
            )}
          >
            {change >= 0 ? '+' : ''}
            {Math.round(change * 100)}%
          </span>
        )}
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
        {changeLabel || description}
      </p>
    </div>
  );
}

function ActionCard({
  title,
  description,
  href,
  buttonText,
  icon,
  badge,
}: {
  title: string;
  description: string;
  href: string;
  buttonText: string;
  icon: React.ReactNode;
  badge?: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-5 flex flex-col">
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
          {icon}
        </div>
        {badge && (
          <span className="px-2 py-1 text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full">
            {badge}
          </span>
        )}
      </div>
      <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 flex-grow">{description}</p>
      <Link
        href={href}
        className="inline-flex items-center gap-1 mt-4 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
      >
        {buttonText}
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
  );
}

function ActivityItem({ activity }: { activity: RecentActivity }) {
  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'approved':
        return (
          <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-full">
            <svg
              className="w-3 h-3 text-green-600 dark:text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'rejected':
        return (
          <div className="p-1.5 bg-red-100 dark:bg-red-900/30 rounded-full">
            <svg
              className="w-3 h-3 text-red-600 dark:text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      case 'auto_posted':
        return (
          <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-full">
            <svg
              className="w-3 h-3 text-blue-600 dark:text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
        );
      case 'edited':
        return (
          <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-full">
            <svg
              className="w-3 h-3 text-purple-600 dark:text-purple-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </div>
        );
      case 'flagged':
        return (
          <div className="p-1.5 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
            <svg
              className="w-3 h-3 text-yellow-600 dark:text-yellow-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        );
    }
  };

  return (
    <li className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
      <div className="flex items-start gap-3">
        {getActivityIcon(activity.type)}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-800 dark:text-gray-200 truncate">{activity.description}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-gray-500 dark:text-gray-400">{activity.platform}</span>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {formatRelativeTime(activity.timestamp)}
            </span>
            {activity.user && (
              <span className="text-xs text-gray-500 dark:text-gray-400">by {activity.user}</span>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

function SystemService({
  name,
  status,
  latency,
}: {
  name: string;
  status: 'operational' | 'degraded' | 'down';
  latency?: number;
}) {
  const statusColors = {
    operational: 'bg-green-500',
    degraded: 'bg-yellow-500',
    down: 'bg-red-500',
  };

  return (
    <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
      <div className="flex items-center gap-2">
        <span className={cn('w-2 h-2 rounded-full', statusColors[status])} />
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{name}</span>
      </div>
      {latency && <span className="text-xs text-gray-500 dark:text-gray-400">{latency}ms</span>}
    </div>
  );
}
