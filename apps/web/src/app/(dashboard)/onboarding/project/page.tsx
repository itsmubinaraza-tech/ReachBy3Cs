'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { KeywordManager } from '@/components/projects';
import type { ProjectTone } from 'shared-types';

interface ProjectFormData {
  name: string;
  description: string;
  value_proposition: string;
  target_audience: string;
  tone: ProjectTone;
  initial_keywords: string[];
}

const TONE_OPTIONS: { value: ProjectTone; label: string; description: string }[] = [
  { value: 'professional', label: 'Professional', description: 'Formal and business-appropriate' },
  { value: 'casual', label: 'Casual', description: 'Relaxed and conversational' },
  { value: 'friendly', label: 'Friendly', description: 'Warm and approachable' },
  { value: 'technical', label: 'Technical', description: 'Detailed and precise' },
  { value: 'empathetic', label: 'Empathetic', description: 'Understanding and supportive' },
];

export default function ProjectOnboardingPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    description: '',
    value_proposition: '',
    target_audience: '',
    tone: 'professional',
    initial_keywords: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get organization ID on mount
  useEffect(() => {
    async function getOrganization() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!profile?.organization_id) {
        router.push('/onboarding/organization');
        return;
      }

      setOrganizationId(profile.organization_id);
      setIsLoading(false);
    }
    getOrganization();
  }, [supabase, router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleToneChange = (tone: ProjectTone) => {
    setFormData((prev) => ({ ...prev, tone }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!organizationId) {
      setError('Organization not found. Please go back and create one.');
      return;
    }

    // Validation
    if (!formData.name.trim()) {
      setError('Project name is required');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create project
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          organization_id: organizationId,
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          value_proposition: formData.value_proposition.trim() || null,
          target_audience: formData.target_audience.trim() || null,
          tone: formData.tone,
          status: 'active',
        })
        .select()
        .single();

      if (projectError) {
        console.error('Error creating project:', projectError);
        setError('Failed to create project. Please try again.');
        setIsSubmitting(false);
        return;
      }

      // If keywords were provided, create a default search config
      if (formData.initial_keywords.length > 0) {
        await supabase.from('project_search_configs').insert({
          project_id: project.id,
          name: 'Default Search',
          keywords: formData.initial_keywords,
          excluded_keywords: [],
          matching_mode: 'semantic',
          max_post_age_days: 90,
          platforms: ['reddit'],
          reddit_subreddits: [],
          min_engagement: 0,
          crawl_frequency: 'daily',
          is_active: true,
        });
      }

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    router.push('/dashboard');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4">
            <svg className="animate-spin w-full h-full text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-2xl mx-auto px-4">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1.5">
              <span className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-xs">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </span>
              Organization
            </span>
            <span className="w-8 h-0.5 bg-green-600" />
            <span className="flex items-center gap-1.5">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-medium">2</span>
              First Project
            </span>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Create your first project
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Projects help you organize search configurations for different campaigns or products.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          {/* Error Display */}
          {error && (
            <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Project Name */}
          <div className="mb-5">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Project Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              required
              maxLength={100}
              placeholder="e.g., Relationship Communication"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Description */}
          <div className="mb-5">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={2}
              maxLength={500}
              placeholder="Brief description of what this project is about"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white resize-none"
            />
          </div>

          {/* Value Proposition */}
          <div className="mb-5">
            <label htmlFor="value_proposition" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Value Proposition
            </label>
            <textarea
              id="value_proposition"
              name="value_proposition"
              value={formData.value_proposition}
              onChange={handleChange}
              rows={2}
              maxLength={500}
              placeholder="What value does your product/service provide for this project?"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white resize-none"
            />
          </div>

          {/* Target Audience */}
          <div className="mb-5">
            <label htmlFor="target_audience" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Target Audience
            </label>
            <input
              id="target_audience"
              name="target_audience"
              type="text"
              value={formData.target_audience}
              onChange={handleChange}
              maxLength={500}
              placeholder="Who is this project targeting? e.g., Couples seeking better communication"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Tone */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Response Tone
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {TONE_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={`flex flex-col p-3 border rounded-lg cursor-pointer transition-all ${
                    formData.tone === option.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <input
                    type="radio"
                    name="tone"
                    value={option.value}
                    checked={formData.tone === option.value}
                    onChange={() => handleToneChange(option.value)}
                    className="sr-only"
                  />
                  <span className="font-medium text-gray-900 dark:text-white text-sm">
                    {option.label}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {option.description}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Initial Keywords */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Initial Search Keywords (Optional)
            </label>
            <KeywordManager
              keywords={formData.initial_keywords}
              onChange={(keywords) => setFormData((prev) => ({ ...prev, initial_keywords: keywords }))}
              placeholder="Add keywords to search for..."
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Add keywords to create a default search configuration. You can modify these later.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={handleSkip}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            >
              Skip for now
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating...
                </>
              ) : (
                <>
                  Create Project
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
