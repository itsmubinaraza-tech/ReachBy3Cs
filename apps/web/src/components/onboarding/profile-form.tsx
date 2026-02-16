'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

export interface ProfileFormData {
  appName: string;
  website: string;
  industry: string;
  valueProposition: string;
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

interface ProfileFormProps {
  initialData?: Partial<ProfileFormData>;
  onDataChange: (data: ProfileFormData) => void;
}

export function ProfileForm({ initialData, onDataChange }: ProfileFormProps) {
  const [formData, setFormData] = useState<ProfileFormData>({
    appName: initialData?.appName || '',
    website: initialData?.website || '',
    industry: initialData?.industry || '',
    valueProposition: initialData?.valueProposition || '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof ProfileFormData, string>>>({});

  const handleChange = (
    field: keyof ProfileFormData,
    value: string
  ) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    onDataChange(newData);

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="space-y-6">
      {/* App/Product Name */}
      <div>
        <label
          htmlFor="appName"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          App/Product Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="appName"
          value={formData.appName}
          onChange={(e) => handleChange('appName', e.target.value)}
          placeholder="e.g., WeAttuned"
          className={cn(
            'w-full px-4 py-2 rounded-lg border bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors',
            errors.appName
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 dark:border-gray-600'
          )}
        />
        {errors.appName && (
          <p className="text-red-500 text-sm mt-1">{errors.appName}</p>
        )}
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
          placeholder="https://yourapp.com"
          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        />
      </div>

      {/* Industry */}
      <div>
        <label
          htmlFor="industry"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Industry <span className="text-red-500">*</span>
        </label>
        <select
          id="industry"
          value={formData.industry}
          onChange={(e) => handleChange('industry', e.target.value)}
          className={cn(
            'w-full px-4 py-2 rounded-lg border bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors',
            errors.industry
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 dark:border-gray-600'
          )}
        >
          <option value="">Select an industry</option>
          {industries.map((industry) => (
            <option key={industry} value={industry}>
              {industry}
            </option>
          ))}
        </select>
        {errors.industry && (
          <p className="text-red-500 text-sm mt-1">{errors.industry}</p>
        )}
      </div>

      {/* Value Proposition */}
      <div>
        <label
          htmlFor="valueProposition"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Value Proposition <span className="text-red-500">*</span>
        </label>
        <textarea
          id="valueProposition"
          value={formData.valueProposition}
          onChange={(e) => handleChange('valueProposition', e.target.value)}
          placeholder="Describe what your product does and the main problems it solves for users..."
          rows={4}
          className={cn(
            'w-full px-4 py-2 rounded-lg border bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors resize-none',
            errors.valueProposition
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 dark:border-gray-600'
          )}
        />
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          This helps us understand your product better and generate more relevant responses.
        </p>
        {errors.valueProposition && (
          <p className="text-red-500 text-sm mt-1">{errors.valueProposition}</p>
        )}
      </div>
    </div>
  );
}

export function validateProfileForm(data: ProfileFormData): { valid: boolean; errors: Partial<Record<keyof ProfileFormData, string>> } {
  const errors: Partial<Record<keyof ProfileFormData, string>> = {};

  if (!data.appName.trim()) {
    errors.appName = 'App/Product name is required';
  }

  if (!data.industry) {
    errors.industry = 'Please select an industry';
  }

  if (!data.valueProposition.trim()) {
    errors.valueProposition = 'Please describe your value proposition';
  } else if (data.valueProposition.trim().length < 20) {
    errors.valueProposition = 'Please provide a more detailed description (at least 20 characters)';
  }

  if (data.website && !isValidUrl(data.website)) {
    errors.website = 'Please enter a valid URL';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
