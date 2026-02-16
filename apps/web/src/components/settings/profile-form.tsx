'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { SettingsSection, SettingsForm } from './settings-section';

export interface OrganizationProfileData {
  name: string;
  slug: string;
  website: string;
  industry: string;
  description: string;
  logoUrl: string;
}

const industries = [
  'Wellness & Mental Health',
  'Education & Learning',
  'Finance & FinTech',
  'Healthcare',
  'SaaS & Productivity',
  'E-commerce',
  'Gaming & Entertainment',
  'Social Media',
  'Real Estate',
  'Travel & Hospitality',
  'Food & Beverage',
  'Fitness & Sports',
  'Marketing & Advertising',
  'HR & Recruitment',
  'Legal & Compliance',
  'Other',
];

interface OrganizationProfileFormProps {
  initialData: OrganizationProfileData;
  onSave: (data: OrganizationProfileData) => Promise<{ error: Error | null }>;
}

export function OrganizationProfileForm({
  initialData,
  onSave,
}: OrganizationProfileFormProps) {
  const [formData, setFormData] = useState<OrganizationProfileData>(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (field: keyof OrganizationProfileData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    const result = await onSave(formData);

    if (result.error) {
      setError(result.error.message);
    } else {
      setSuccess(true);
    }

    setIsSubmitting(false);
  };

  return (
    <SettingsSection
      title="Organization Profile"
      description="Update your organization's public profile information"
    >
      <SettingsForm onSubmit={handleSubmit} isSubmitting={isSubmitting}>
        <div className="space-y-6">
          {/* Logo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Organization Logo
            </label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                {formData.logoUrl ? (
                  <img
                    src={formData.logoUrl}
                    alt="Organization logo"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <BuildingIcon className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <button
                type="button"
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Change Logo
              </button>
            </div>
          </div>

          {/* Organization Name */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Organization Name
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Slug */}
          <div>
            <label
              htmlFor="slug"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              URL Slug
            </label>
            <div className="flex items-center">
              <span className="text-sm text-gray-500 dark:text-gray-400 mr-1">
                reachby3cs.com/org/
              </span>
              <input
                type="text"
                id="slug"
                value={formData.slug}
                onChange={(e) => handleChange('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Website */}
          <div>
            <label
              htmlFor="website"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Website
            </label>
            <input
              type="url"
              id="website"
              value={formData.website}
              onChange={(e) => handleChange('website', e.target.value)}
              placeholder="https://yourcompany.com"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Industry */}
          <div>
            <label
              htmlFor="industry"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Industry
            </label>
            <select
              id="industry"
              value={formData.industry}
              onChange={(e) => handleChange('industry', e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select an industry</option>
              {industries.map((industry) => (
                <option key={industry} value={industry}>
                  {industry}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Description
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={4}
              placeholder="Tell us about your organization and the problems you solve..."
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
          {success && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm text-green-600 dark:text-green-400">
                Profile updated successfully!
              </p>
            </div>
          )}
        </div>
      </SettingsForm>
    </SettingsSection>
  );
}

function BuildingIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );
}
