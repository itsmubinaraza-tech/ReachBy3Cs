'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Settings overview page - redirects to profile
 */
export default function SettingsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/settings/profile');
  }, [router]);

  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Loading settings...</p>
      </div>
    </div>
  );
}
