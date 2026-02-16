'use client';

import type { ReactNode } from 'react';
import { SettingsNav } from '@/components/settings';

interface SettingsLayoutProps {
  children: ReactNode;
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Manage your organization and account settings
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <SettingsNav />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
