'use client';

import Link from 'next/link';
import { X, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useTrial } from '@/hooks/use-trial';

export function TrialBanner() {
  const { remainingUses, maxUses, isTrialExpired, isTrialActive, isLoading } = useTrial();
  const [dismissed, setDismissed] = useState(false);

  if (isLoading || dismissed) return null;

  // Show upgrade prompt if trial expired
  if (isTrialExpired) {
    return (
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5" />
              <p className="text-sm font-medium">
                Your free trial has ended. Sign up to continue using ReachBy3Cs.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/signup"
                className="bg-white text-orange-600 px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-orange-50 transition"
              >
                Sign Up Now
              </Link>
              <button
                onClick={() => setDismissed(true)}
                className="text-white/80 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show remaining uses during trial
  if (isTrialActive) {
    const progressPercent = ((maxUses - remainingUses) / maxUses) * 100;

    return (
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Sparkles className="w-5 h-5" />
              <div className="flex items-center gap-3">
                <p className="text-sm font-medium">
                  Free Trial: <span className="font-bold">{remainingUses}</span> of {maxUses} uses remaining
                </p>
                <div className="hidden sm:block w-32 h-2 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-all duration-300"
                    style={{ width: `${100 - progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/signup"
                className="bg-white text-blue-600 px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-blue-50 transition"
              >
                Upgrade
              </Link>
              <button
                onClick={() => setDismissed(true)}
                className="text-white/80 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
