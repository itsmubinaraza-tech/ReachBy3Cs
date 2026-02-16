'use client';

import { OrganizationProfileForm, type OrganizationProfileData } from '@/components/settings';
import { useOrganizationSettings } from '@/hooks/use-settings';

export default function ProfileSettingsPage() {
  const { getProfileData, saveProfile, organization } = useOrganizationSettings();

  const profileData = getProfileData();

  if (!organization || !profileData) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  const handleSave = async (data: OrganizationProfileData) => {
    return saveProfile(data);
  };

  return (
    <OrganizationProfileForm
      initialData={profileData}
      onSave={handleSave}
    />
  );
}
