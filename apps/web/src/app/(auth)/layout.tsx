import type { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Needs-Matched Platform
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Engage with your audience authentically
          </p>
        </div>

        {/* Auth form container */}
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 sm:p-8">
          {children}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-6">
          &copy; {new Date().getFullYear()} WeAttuned. All rights reserved.
        </p>
      </div>
    </div>
  );
}
