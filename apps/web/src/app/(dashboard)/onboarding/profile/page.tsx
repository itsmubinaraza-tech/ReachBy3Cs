'use client';

import { useState } from 'react';
import { Wizard, ProfileForm, validateProfileForm, type ProfileFormData } from '@/components/onboarding';
import { useOrg } from '@/contexts/org-context';
import { updateOrganizationProfile } from '@/lib/onboarding/actions';

export default function ProfileOnboardingPage() {
  const { organization, settings } = useOrg();
  const settingsObj = (settings as Record<string, unknown>) || {};

  const [formData, setFormData] = useState<ProfileFormData>({
    appName: organization?.name || '',
    website: (settingsObj.website as string) || '',
    industry: (settingsObj.industry as string) || '',
    valueProposition: (settingsObj.value_proposition as string) || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDataChange = (data: ProfileFormData) => {
    setFormData(data);
    setError(null);
  };

  const handleNext = async (): Promise<boolean> => {
    // Validate form
    const validation = validateProfileForm(formData);
    if (!validation.valid) {
      const firstError = Object.values(validation.errors)[0];
      setError(firstError || 'Please fill in all required fields');
      return false;
    }

    if (!organization?.id) {
      setError('Organization not loaded');
      return false;
    }

    setIsSubmitting(true);
    setError(null);

    const result = await updateOrganizationProfile(organization.id, formData);

    setIsSubmitting(false);

    if (result.error) {
      setError(result.error.message);
      return false;
    }

    return true;
  };

  return (
    <Wizard
      currentStep={1}
      title="Tell us about your business"
      description="Help us understand your product so we can find the right conversations for you."
      onNext={handleNext}
      isSubmitting={isSubmitting}
      nextDisabled={!formData.appName || !formData.industry || !formData.valueProposition}
    >
      <ProfileForm initialData={formData} onDataChange={handleDataChange} />

      {error && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
    </Wizard>
  );
}
