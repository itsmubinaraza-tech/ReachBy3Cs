'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useOrg } from '@/contexts/org-context';
import { getOnboardingStatus } from '@/lib/onboarding/actions';

export interface OnboardingStatus {
  currentStep: number;
  completed: boolean;
  profile: boolean;
  categories: boolean;
  platforms: boolean;
  team: boolean;
}

export function useOnboarding() {
  const { organization } = useOrg();
  const router = useRouter();
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!organization?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const result = await getOnboardingStatus(organization.id);

    if (result.error) {
      setError(result.error);
    } else if (result.status) {
      setStatus(result.status);
    }

    setIsLoading(false);
  }, [organization?.id]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  /**
   * Navigate to the appropriate onboarding step
   */
  const goToCurrentStep = useCallback(() => {
    if (!status) return;

    if (status.completed) {
      router.push('/dashboard');
      return;
    }

    const stepPaths = [
      '/onboarding/profile',
      '/onboarding/categories',
      '/onboarding/platforms',
      '/onboarding/team',
      '/onboarding/complete',
    ];

    const path = stepPaths[status.currentStep - 1] || stepPaths[0];
    router.push(path);
  }, [status, router]);

  /**
   * Check if onboarding should be shown
   */
  const shouldShowOnboarding = useCallback(() => {
    if (!organization || !status) return false;
    return !status.completed;
  }, [organization, status]);

  /**
   * Get the step number for a given path
   */
  const getStepFromPath = useCallback((path: string): number => {
    const stepMap: Record<string, number> = {
      '/onboarding/profile': 1,
      '/onboarding/categories': 2,
      '/onboarding/platforms': 3,
      '/onboarding/team': 4,
      '/onboarding/complete': 5,
    };
    return stepMap[path] || 1;
  }, []);

  /**
   * Get completion percentage
   */
  const getCompletionPercentage = useCallback(() => {
    if (!status) return 0;

    let completed = 0;
    if (status.profile) completed++;
    if (status.categories) completed++;
    if (status.platforms) completed++;
    if (status.team) completed++;

    return (completed / 4) * 100;
  }, [status]);

  return {
    status,
    isLoading,
    error,
    refresh: fetchStatus,
    goToCurrentStep,
    shouldShowOnboarding,
    getStepFromPath,
    getCompletionPercentage,
  };
}

/**
 * Hook to require onboarding completion
 * Redirects to onboarding if not completed
 */
export function useRequireOnboarding() {
  const { shouldShowOnboarding, goToCurrentStep, isLoading, status } = useOnboarding();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && shouldShowOnboarding()) {
      goToCurrentStep();
    }
  }, [isLoading, shouldShowOnboarding, goToCurrentStep]);

  return {
    isOnboarded: status?.completed ?? false,
    isLoading,
  };
}

/**
 * Hook to skip onboarding if already completed
 * Redirects to dashboard if completed
 */
export function useSkipIfOnboarded() {
  const { status, isLoading } = useOnboarding();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && status?.completed) {
      router.push('/dashboard');
    }
  }, [isLoading, status, router]);

  return {
    isOnboarded: status?.completed ?? false,
    isLoading,
  };
}
