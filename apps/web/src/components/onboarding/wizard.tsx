'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { StepIndicator, onboardingSteps } from './step-indicator';

interface WizardProps {
  currentStep: number;
  title: string;
  description?: string;
  children: ReactNode;
  onNext?: () => Promise<boolean> | boolean;
  onBack?: () => void;
  nextLabel?: string;
  backLabel?: string;
  showSkip?: boolean;
  skipLabel?: string;
  onSkip?: () => void;
  isSubmitting?: boolean;
  nextDisabled?: boolean;
}

export function Wizard({
  currentStep,
  title,
  description,
  children,
  onNext,
  onBack,
  nextLabel = 'Next Step',
  backLabel = 'Back',
  showSkip = false,
  skipLabel = 'Skip for now',
  onSkip,
  isSubmitting = false,
  nextDisabled = false,
}: WizardProps) {
  const router = useRouter();
  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === onboardingSteps.length;

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (!isFirstStep) {
      const prevStep = onboardingSteps[currentStep - 2];
      if (prevStep) {
        router.push(prevStep.path);
      }
    }
  };

  const handleNext = async () => {
    if (onNext) {
      const success = await onNext();
      if (success && !isLastStep) {
        const nextStep = onboardingSteps[currentStep];
        if (nextStep) {
          router.push(nextStep.path);
        }
      } else if (success && isLastStep) {
        router.push('/onboarding/complete');
      }
    } else if (!isLastStep) {
      const nextStep = onboardingSteps[currentStep];
      if (nextStep) {
        router.push(nextStep.path);
      }
    }
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    } else if (!isLastStep) {
      const nextStep = onboardingSteps[currentStep];
      if (nextStep) {
        router.push(nextStep.path);
      }
    } else {
      router.push('/onboarding/complete');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-4">
            <ArrowLeftIcon className="w-4 h-4" />
            <span className="text-sm">Back to Dashboard</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome to ReachBy3Cs
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Let us set up your account
          </p>
        </div>

        {/* Step Indicator */}
        <StepIndicator currentStep={currentStep} className="mb-8" />

        {/* Content Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 md:p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {title}
            </h2>
            {description && (
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {description}
              </p>
            )}
          </div>

          <div className="mb-8">{children}</div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
            <div>
              {!isFirstStep && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                  disabled={isSubmitting}
                >
                  {backLabel}
                </button>
              )}
            </div>

            <div className="flex items-center gap-4">
              {showSkip && (
                <button
                  type="button"
                  onClick={handleSkip}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-sm transition-colors"
                  disabled={isSubmitting}
                >
                  {skipLabel}
                </button>
              )}
              <button
                type="button"
                onClick={handleNext}
                disabled={isSubmitting || nextDisabled}
                className={cn(
                  'px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2',
                  isSubmitting || nextDisabled
                    ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                )}
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner className="w-4 h-4" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <span>{isLastStep ? 'Complete Setup' : nextLabel}</span>
                    {!isLastStep && <ArrowRightIcon className="w-4 h-4" />}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
  );
}

function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg className={cn('animate-spin', className)} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}
