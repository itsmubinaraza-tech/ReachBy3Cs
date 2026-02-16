'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useOnboarding } from '@/hooks/use-onboarding';

/**
 * Onboarding landing/router page
 * Redirects users to the appropriate onboarding step or dashboard
 */
export default function OnboardingPage() {
  const router = useRouter();
  const { status, isLoading, goToCurrentStep } = useOnboarding();

  useEffect(() => {
    if (!isLoading) {
      if (status?.completed) {
        router.push('/dashboard');
      } else {
        goToCurrentStep();
      }
    }
  }, [isLoading, status, router, goToCurrentStep]);

  // Show loading state while determining where to redirect
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4">
          <svg
            className="animate-spin w-full h-full text-blue-600"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Setting up your account...
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Please wait while we prepare your onboarding experience.
        </p>
      </div>
    </div>
  );
}
