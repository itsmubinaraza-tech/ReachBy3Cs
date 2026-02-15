'use client';

import { useState, useEffect, useCallback } from 'react';

interface TrialData {
  uses: number;
  startedAt: string;
  actions: string[];
}

const TRIAL_KEY = 'reachby3cs_trial';
const MAX_TRIAL_USES = 10;

export function useTrial() {
  const [trial, setTrial] = useState<TrialData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(TRIAL_KEY);
    if (stored) {
      setTrial(JSON.parse(stored));
    } else {
      setTrial({ uses: 0, startedAt: '', actions: [] });
    }
    setIsLoading(false);
  }, []);

  const trackAction = useCallback((action: string) => {
    setTrial((prev) => {
      if (!prev) return prev;

      const updated: TrialData = {
        ...prev,
        uses: prev.uses + 1,
        startedAt: prev.startedAt || new Date().toISOString(),
        actions: [...prev.actions, `${action}:${new Date().toISOString()}`],
      };

      localStorage.setItem(TRIAL_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const resetTrial = useCallback(() => {
    const reset: TrialData = { uses: 0, startedAt: '', actions: [] };
    localStorage.setItem(TRIAL_KEY, JSON.stringify(reset));
    setTrial(reset);
  }, []);

  const remainingUses = trial ? Math.max(0, MAX_TRIAL_USES - trial.uses) : MAX_TRIAL_USES;
  const isTrialExpired = remainingUses === 0;
  const isTrialActive = trial && trial.uses > 0 && !isTrialExpired;

  return {
    trial,
    isLoading,
    remainingUses,
    maxUses: MAX_TRIAL_USES,
    isTrialExpired,
    isTrialActive,
    trackAction,
    resetTrial,
  };
}
