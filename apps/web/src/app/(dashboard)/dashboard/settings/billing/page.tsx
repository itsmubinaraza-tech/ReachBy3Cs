'use client';

import { SettingsSection, SettingsRow } from '@/components/settings';
import { useOrg } from '@/contexts/org-context';

export default function BillingSettingsPage() {
  const { organization } = useOrg();

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <SettingsSection
        title="Current Plan"
        description="View your subscription details and usage"
      >
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Current Plan</p>
              <h3 className="text-2xl font-bold">Pro Trial</h3>
              <p className="text-blue-100 mt-1">14 days remaining</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">$0</p>
              <p className="text-blue-100 text-sm">/month</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <SettingsRow label="Organization" description="Your organization name">
            <span className="text-gray-900 dark:text-white font-medium">
              {organization?.name || 'Loading...'}
            </span>
          </SettingsRow>

          <SettingsRow label="Plan Started" description="When your trial began">
            <span className="text-gray-900 dark:text-white">
              {organization?.created_at
                ? new Date(organization.created_at).toLocaleDateString()
                : 'N/A'}
            </span>
          </SettingsRow>

          <SettingsRow label="Trial Ends" description="When your trial period expires">
            <span className="text-gray-900 dark:text-white">
              {organization?.created_at
                ? new Date(
                    new Date(organization.created_at).getTime() +
                      14 * 24 * 60 * 60 * 1000
                  ).toLocaleDateString()
                : 'N/A'}
            </span>
          </SettingsRow>
        </div>
      </SettingsSection>

      {/* Usage */}
      <SettingsSection
        title="Usage This Period"
        description="Your current usage and limits"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <UsageCard
            label="Posts Detected"
            current={0}
            limit={1000}
            unit="posts"
          />
          <UsageCard
            label="Responses Generated"
            current={0}
            limit={500}
            unit="responses"
          />
          <UsageCard
            label="Auto-Posts"
            current={0}
            limit={100}
            unit="posts"
          />
        </div>
      </SettingsSection>

      {/* Upgrade CTA */}
      <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-xl p-6 text-white">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold mb-1">
              Upgrade to ReachBy3Cs Pro
            </h3>
            <p className="text-indigo-100">
              Get unlimited posts, advanced analytics, and priority support.
            </p>
          </div>
          <button className="px-6 py-3 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-indigo-50 transition-colors whitespace-nowrap">
            Upgrade Now
          </button>
        </div>
      </div>

      {/* Plans Comparison */}
      <SettingsSection
        title="Available Plans"
        description="Compare plans and choose the right one for you"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <PlanCard
            name="Starter"
            price="$49"
            description="For small teams getting started"
            features={[
              '500 posts/month',
              '100 responses/month',
              '2 platforms',
              'Email support',
            ]}
            current={false}
          />
          <PlanCard
            name="Pro"
            price="$149"
            description="For growing teams with higher volume"
            features={[
              '5,000 posts/month',
              '1,000 responses/month',
              '5 platforms',
              'Priority support',
              'Advanced analytics',
            ]}
            current={true}
            highlighted
          />
          <PlanCard
            name="Enterprise"
            price="Custom"
            description="For large organizations"
            features={[
              'Unlimited posts',
              'Unlimited responses',
              'Unlimited platforms',
              'Dedicated support',
              'Custom integrations',
              'SLA guarantee',
            ]}
            current={false}
          />
        </div>
      </SettingsSection>

      {/* Billing History - Placeholder */}
      <SettingsSection
        title="Billing History"
        description="View your past invoices and payments"
      >
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <ReceiptIcon className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            No billing history yet
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
            Your invoices will appear here once you upgrade to a paid plan.
          </p>
        </div>
      </SettingsSection>
    </div>
  );
}

interface UsageCardProps {
  label: string;
  current: number;
  limit: number;
  unit: string;
}

function UsageCard({ label, current, limit, unit }: UsageCardProps) {
  const percentage = Math.min((current / limit) * 100, 100);

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{label}</p>
      <div className="flex items-baseline gap-1 mb-2">
        <span className="text-2xl font-bold text-gray-900 dark:text-white">
          {current.toLocaleString()}
        </span>
        <span className="text-gray-500 dark:text-gray-400">
          / {limit.toLocaleString()} {unit}
        </span>
      </div>
      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

interface PlanCardProps {
  name: string;
  price: string;
  description: string;
  features: string[];
  current: boolean;
  highlighted?: boolean;
}

function PlanCard({
  name,
  price,
  description,
  features,
  current,
  highlighted,
}: PlanCardProps) {
  return (
    <div
      className={`p-6 rounded-xl border ${
        highlighted
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
      }`}
    >
      {highlighted && (
        <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-500 text-white rounded mb-4">
          Current Plan
        </span>
      )}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        {name}
      </h3>
      <div className="mt-2 mb-4">
        <span className="text-3xl font-bold text-gray-900 dark:text-white">
          {price}
        </span>
        {price !== 'Custom' && (
          <span className="text-gray-500 dark:text-gray-400">/month</span>
        )}
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        {description}
      </p>
      <ul className="space-y-2 mb-6">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center gap-2 text-sm">
            <CheckIcon className="w-4 h-4 text-green-500" />
            <span className="text-gray-700 dark:text-gray-300">{feature}</span>
          </li>
        ))}
      </ul>
      {!current && (
        <button
          className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
            highlighted
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          {price === 'Custom' ? 'Contact Sales' : 'Upgrade'}
        </button>
      )}
    </div>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function ReceiptIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
    </svg>
  );
}
