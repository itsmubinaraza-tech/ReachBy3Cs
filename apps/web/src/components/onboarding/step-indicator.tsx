'use client';

import { cn } from '@/lib/utils';

export interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  path: string;
}

export const onboardingSteps: OnboardingStep[] = [
  {
    id: 1,
    title: 'Business Profile',
    description: 'Tell us about your business',
    path: '/onboarding/profile',
  },
  {
    id: 2,
    title: 'Problem Categories',
    description: 'What problems does your product solve?',
    path: '/onboarding/categories',
  },
  {
    id: 3,
    title: 'Connect Platforms',
    description: 'Connect platforms to monitor',
    path: '/onboarding/platforms',
  },
  {
    id: 4,
    title: 'Invite Team',
    description: 'Invite your team members',
    path: '/onboarding/team',
  },
];

interface StepIndicatorProps {
  currentStep: number;
  className?: string;
}

export function StepIndicator({ currentStep, className }: StepIndicatorProps) {
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <ol className="flex items-center w-full max-w-2xl">
        {onboardingSteps.map((step, index) => (
          <li
            key={step.id}
            className={cn(
              'flex items-center',
              index < onboardingSteps.length - 1 && 'flex-1'
            )}
          >
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors',
                  step.id < currentStep
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : step.id === currentStep
                      ? 'bg-white border-blue-600 text-blue-600 dark:bg-gray-800'
                      : 'bg-white border-gray-300 text-gray-500 dark:bg-gray-800 dark:border-gray-600'
                )}
              >
                {step.id < currentStep ? (
                  <CheckIcon className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-semibold">{step.id}</span>
                )}
              </div>
              <div className="mt-2 text-center hidden sm:block">
                <p
                  className={cn(
                    'text-sm font-medium',
                    step.id === currentStep
                      ? 'text-blue-600 dark:text-blue-400'
                      : step.id < currentStep
                        ? 'text-gray-900 dark:text-white'
                        : 'text-gray-500 dark:text-gray-400'
                  )}
                >
                  {step.title}
                </p>
              </div>
            </div>
            {index < onboardingSteps.length - 1 && (
              <div
                className={cn(
                  'w-full h-0.5 mx-2',
                  step.id < currentStep
                    ? 'bg-blue-600'
                    : 'bg-gray-300 dark:bg-gray-600'
                )}
              />
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={3}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}
