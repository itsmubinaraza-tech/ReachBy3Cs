'use client';

import { AutomationControls, type AutomationSettingsData } from '@/components/settings';
import { useOrganizationSettings } from '@/hooks/use-settings';

export default function AutomationSettingsPage() {
  const { getAutomationSettings, saveAutomationSettings, organization } = useOrganizationSettings();

  const automationSettings = getAutomationSettings();

  if (!organization || !automationSettings) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading automation settings...</p>
        </div>
      </div>
    );
  }

  const handleSave = async (data: AutomationSettingsData) => {
    return saveAutomationSettings(data);
  };

  return (
    <div className="space-y-6">
      <AutomationControls
        initialSettings={automationSettings}
        onSave={handleSave}
      />

      {/* Info Card */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-6">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
          How Auto-Posting Works
        </h3>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
          <li className="flex items-start gap-2">
            <span className="flex-shrink-0 w-5 h-5 bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-300 rounded-full flex items-center justify-center text-xs font-medium">
              1
            </span>
            <span>
              Our AI analyzes each detected post and generates a response based on your problem categories and value proposition.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="flex-shrink-0 w-5 h-5 bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-300 rounded-full flex items-center justify-center text-xs font-medium">
              2
            </span>
            <span>
              The CTS (Clear-to-Send) score is calculated based on the signal strength, risk level, and CTA intensity.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="flex-shrink-0 w-5 h-5 bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-300 rounded-full flex items-center justify-center text-xs font-medium">
              3
            </span>
            <span>
              Responses meeting your criteria are automatically posted. Others go to your review queue for manual approval.
            </span>
          </li>
        </ul>
      </div>

      {/* Safety Notice */}
      <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800 p-6">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <WarningIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
              Safety First
            </h3>
            <p className="text-sm text-amber-800 dark:text-amber-200">
              We recommend starting with conservative settings and gradually increasing automation
              as you become comfortable with the quality of generated responses. Blocked risk
              items always require manual review regardless of your settings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function WarningIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}
