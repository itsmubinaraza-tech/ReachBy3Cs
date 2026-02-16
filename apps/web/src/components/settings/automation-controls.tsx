'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { SettingsSection, SettingsRow, SettingsForm } from './settings-section';
import type { RiskLevel, CTALevel } from 'shared-types';

export interface AutomationSettingsData {
  enabled: boolean;
  ctsThreshold: number;
  maxDailyAutoPost: number;
  allowedRiskLevels: RiskLevel[];
  maxCtaLevel: CTALevel;
  requireReviewForHighIntensity: boolean;
  intensityThreshold: number;
}

interface AutomationControlsProps {
  initialSettings: AutomationSettingsData;
  onSave: (settings: AutomationSettingsData) => Promise<{ error: Error | null }>;
}

const riskLevelOptions: { value: RiskLevel; label: string; color: string }[] = [
  { value: 'low', label: 'Low Risk', color: 'bg-green-500' },
  { value: 'medium', label: 'Medium Risk', color: 'bg-yellow-500' },
  { value: 'high', label: 'High Risk', color: 'bg-orange-500' },
];

const ctaLevelOptions: { value: CTALevel; label: string }[] = [
  { value: 0, label: 'Level 0 - No CTA (Value only)' },
  { value: 1, label: 'Level 1 - Soft CTA (Mention)' },
  { value: 2, label: 'Level 2 - Medium CTA (Recommendation)' },
  { value: 3, label: 'Level 3 - Strong CTA (Direct link)' },
];

export function AutomationControls({
  initialSettings,
  onSave,
}: AutomationControlsProps) {
  const [settings, setSettings] = useState<AutomationSettingsData>(initialSettings);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleToggle = (field: keyof AutomationSettingsData, value: boolean) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
    setSuccess(false);
  };

  const handleChange = <K extends keyof AutomationSettingsData>(
    field: K,
    value: AutomationSettingsData[K]
  ) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
    setSuccess(false);
  };

  const handleRiskLevelToggle = (level: RiskLevel) => {
    const current = settings.allowedRiskLevels;
    const newLevels = current.includes(level)
      ? current.filter((l) => l !== level)
      : [...current, level];
    handleChange('allowedRiskLevels', newLevels);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    const result = await onSave(settings);

    if (result.error) {
      setError(result.error.message);
    } else {
      setSuccess(true);
    }

    setIsSubmitting(false);
  };

  return (
    <SettingsSection
      title="Auto-Post Settings"
      description="Configure automatic posting behavior for approved responses"
    >
      <SettingsForm onSubmit={handleSubmit} isSubmitting={isSubmitting}>
        <div className="space-y-6">
          {/* Master Toggle */}
          <SettingsRow
            label="Enable Auto-Posting"
            description="Automatically post responses that meet your criteria"
          >
            <button
              type="button"
              onClick={() => handleToggle('enabled', !settings.enabled)}
              className={cn(
                'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                settings.enabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
              )}
            >
              <span
                className={cn(
                  'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                  settings.enabled ? 'translate-x-5' : 'translate-x-0'
                )}
              />
            </button>
          </SettingsRow>

          {settings.enabled && (
            <>
              {/* CTS Threshold */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  CTS (Clear-to-Send) Threshold
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={settings.ctsThreshold}
                    onChange={(e) => handleChange('ctsThreshold', parseFloat(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="w-16 text-center font-medium text-gray-900 dark:text-white">
                    {(settings.ctsThreshold * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Only auto-post responses with CTS score above this threshold
                </p>
              </div>

              {/* Daily Limit */}
              <div>
                <label
                  htmlFor="dailyLimit"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Maximum Daily Auto-Posts
                </label>
                <input
                  type="number"
                  id="dailyLimit"
                  min="1"
                  max="100"
                  value={settings.maxDailyAutoPost}
                  onChange={(e) => handleChange('maxDailyAutoPost', parseInt(e.target.value) || 1)}
                  className="w-32 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Limit the number of automatic posts per day
                </p>
              </div>

              {/* Allowed Risk Levels */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Allowed Risk Levels for Auto-Post
                </label>
                <div className="flex flex-wrap gap-2">
                  {riskLevelOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleRiskLevelToggle(option.value)}
                      className={cn(
                        'flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors',
                        settings.allowedRiskLevels.includes(option.value)
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                          : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                      )}
                    >
                      <span className={cn('w-3 h-3 rounded-full', option.color)} />
                      <span>{option.label}</span>
                    </button>
                  ))}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Blocked risk level always requires manual review
                </p>
              </div>

              {/* Max CTA Level */}
              <div>
                <label
                  htmlFor="maxCtaLevel"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Maximum CTA Level for Auto-Post
                </label>
                <select
                  id="maxCtaLevel"
                  value={settings.maxCtaLevel}
                  onChange={(e) => handleChange('maxCtaLevel', parseInt(e.target.value) as CTALevel)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {ctaLevelOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Higher CTA levels will require manual review
                </p>
              </div>

              {/* High Intensity Review */}
              <SettingsRow
                label="Require Review for High Emotional Intensity"
                description="Always require manual review for emotionally charged conversations"
              >
                <button
                  type="button"
                  onClick={() => handleToggle('requireReviewForHighIntensity', !settings.requireReviewForHighIntensity)}
                  className={cn(
                    'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                    settings.requireReviewForHighIntensity ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                  )}
                >
                  <span
                    className={cn(
                      'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                      settings.requireReviewForHighIntensity ? 'translate-x-5' : 'translate-x-0'
                    )}
                  />
                </button>
              </SettingsRow>

              {settings.requireReviewForHighIntensity && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Intensity Threshold
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={settings.intensityThreshold}
                      onChange={(e) => handleChange('intensityThreshold', parseFloat(e.target.value))}
                      className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="w-16 text-center font-medium text-gray-900 dark:text-white">
                      {(settings.intensityThreshold * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Require review when emotional intensity exceeds this level
                  </p>
                </div>
              )}
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
                Automation settings saved successfully!
              </p>
            </div>
          )}
        </div>
      </SettingsForm>
    </SettingsSection>
  );
}
