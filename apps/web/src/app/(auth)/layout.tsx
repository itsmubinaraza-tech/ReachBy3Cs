'use client';

import { Logo } from '@/components/ui/logo';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo - links back to home */}
        <div className="text-center mb-8 flex flex-col items-center">
          <Logo size="xl" href="/" />
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Communicate. Connect. Community.
          </p>
        </div>

        {/* Auth form container */}
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 sm:p-8">
          {children}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-6">
          &copy; {new Date().getFullYear()} ReachBy3Cs. All rights reserved.
        </p>
      </div>
    </div>
  );
}
