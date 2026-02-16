'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { SettingsSection, SettingsRow, SettingsForm } from './settings-section';

export interface NotificationPreferencesData {
  push: {
    enabled: boolean;
    newPendingItems: boolean;
    highRiskFlags: boolean;
    autoPostConfirmations: boolean;
    dailySummary: boolean;
    summaryTime: string;
  };
  email: {
    enabled: boolean;
    dailyDigest: boolean;
    weeklyReport: boolean;
  };
}

interface NotificationTogglesProps {
  initialPreferences: NotificationPreferencesData;
  onSave: (preferences: NotificationPreferencesData) => Promise<{ error: Error | null }>;
}

export function NotificationToggles({
  initialPreferences,
  onSave,
}: NotificationTogglesProps) {
  const [preferences, setPreferences] = useState<NotificationPreferencesData>(initialPreferences);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handlePushToggle = (field: keyof NotificationPreferencesData['push'], value: boolean | string) => {
    setPreferences((prev) => ({
      ...prev,
      push: { ...prev.push, [field]: value },
    }));
    setSuccess(false);
  };

  const handleEmailToggle = (field: keyof NotificationPreferencesData['email'], value: boolean) => {
    setPreferences((prev) => ({
      ...prev,
      email: { ...prev.email, [field]: value },
    }));
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    const result = await onSave(preferences);

    if (result.error) {
      setError(result.error.message);
    } else {
      setSuccess(true);
    }

    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6">
      {/* Push Notifications */}
      <SettingsSection
        title="Push Notifications"
        description="Configure browser and mobile push notifications"
      >
        <SettingsForm onSubmit={handleSubmit} isSubmitting={isSubmitting}>
          <div className="space-y-4">
            <SettingsRow
              label="Enable Push Notifications"
              description="Receive instant notifications in your browser or mobile app"
            >
              <Toggle
                checked={preferences.push.enabled}
                onChange={(v) => handlePushToggle('enabled', v)}
              />
            </SettingsRow>

            {preferences.push.enabled && (
              <>
                <SettingsRow
                  label="New Pending Items"
                  description="Get notified when new items are added to your review queue"
                >
                  <Toggle
                    checked={preferences.push.newPendingItems}
                    onChange={(v) => handlePushToggle('newPendingItems', v)}
                  />
                </SettingsRow>

                <SettingsRow
                  label="High Risk Alerts"
                  description="Immediate notification for high-risk or blocked items"
                >
                  <Toggle
                    checked={preferences.push.highRiskFlags}
                    onChange={(v) => handlePushToggle('highRiskFlags', v)}
                  />
                </SettingsRow>

                <SettingsRow
                  label="Auto-Post Confirmations"
                  description="Get notified when responses are automatically posted"
                >
                  <Toggle
                    checked={preferences.push.autoPostConfirmations}
                    onChange={(v) => handlePushToggle('autoPostConfirmations', v)}
                  />
                </SettingsRow>

                <SettingsRow
                  label="Daily Summary"
                  description="Receive a daily summary of your engagement metrics"
                >
                  <div className="flex items-center gap-3">
                    <Toggle
                      checked={preferences.push.dailySummary}
                      onChange={(v) => handlePushToggle('dailySummary', v)}
                    />
                    {preferences.push.dailySummary && (
                      <input
                        type="time"
                        value={preferences.push.summaryTime}
                        onChange={(e) => handlePushToggle('summaryTime', e.target.value)}
                        className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    )}
                  </div>
                </SettingsRow>
              </>
            )}
          </div>
        </SettingsForm>
      </SettingsSection>

      {/* Email Notifications */}
      <SettingsSection
        title="Email Notifications"
        description="Configure email digest and report settings"
      >
        <SettingsForm onSubmit={handleSubmit} isSubmitting={isSubmitting}>
          <div className="space-y-4">
            <SettingsRow
              label="Enable Email Notifications"
              description="Receive email updates about your account activity"
            >
              <Toggle
                checked={preferences.email.enabled}
                onChange={(v) => handleEmailToggle('enabled', v)}
              />
            </SettingsRow>

            {preferences.email.enabled && (
              <>
                <SettingsRow
                  label="Daily Digest"
                  description="Receive a daily email summary of pending items and activity"
                >
                  <Toggle
                    checked={preferences.email.dailyDigest}
                    onChange={(v) => handleEmailToggle('dailyDigest', v)}
                  />
                </SettingsRow>

                <SettingsRow
                  label="Weekly Report"
                  description="Receive a weekly analytics report with insights and recommendations"
                >
                  <Toggle
                    checked={preferences.email.weeklyReport}
                    onChange={(v) => handleEmailToggle('weeklyReport', v)}
                  />
                </SettingsRow>
              </>
            )}

            {/* Error/Success Messages */}
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}
            {success && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-sm text-green-600 dark:text-green-400">
                  Notification preferences saved successfully!
                </p>
              </div>
            )}
          </div>
        </SettingsForm>
      </SettingsSection>
    </div>
  );
}

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

function Toggle({ checked, onChange, disabled = false }: ToggleProps) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={cn(
        'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        checked ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
          checked ? 'translate-x-5' : 'translate-x-0'
        )}
      />
    </button>
  );
}
