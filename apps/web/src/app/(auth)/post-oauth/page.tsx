'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

type PostOAuthOption = 'create' | 'join' | 'demo';

export default function PostOAuthPage() {
  const [selectedOption, setSelectedOption] = useState<PostOAuthOption | null>(null);
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  // Get user info on mount
  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata?.full_name) {
        setUserName(user.user_metadata.full_name);
      }
    }
    getUser();
  }, [supabase]);

  const handleJoinWithInvite = async () => {
    if (!inviteCode.trim()) {
      setError('Please enter an invite code');
      return;
    }

    setIsLoading(true);
    setError(null);

    // Look up the organization by invite code
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('slug', inviteCode.toLowerCase().trim())
      .single();

    if (orgError || !org) {
      setError('Invalid invite code. Please check and try again.');
      setIsLoading(false);
      return;
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('Authentication error. Please try signing in again.');
      setIsLoading(false);
      return;
    }

    // Create or update user profile with the organization
    const { error: profileError } = await supabase.from('users').upsert(
      {
        id: user.id,
        organization_id: org.id,
        email: user.email!,
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        role: 'member',
        notification_preferences: { push: true, email: true },
      },
      { onConflict: 'id' }
    );

    if (profileError) {
      setError('Failed to join organization. Please try again.');
      setIsLoading(false);
      return;
    }

    router.push('/dashboard');
  };

  const handleExploreDemo = () => {
    // Set demo mode in localStorage and redirect
    localStorage.setItem('demo_mode', 'true');
    router.push('/dashboard');
  };

  return (
    <div className="max-w-lg">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        Welcome{userName ? `, ${userName}` : ''}!
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Choose how you&apos;d like to get started with ReachBy3Cs.
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        {/* Option 1: Create Organization */}
        <div
          onClick={() => setSelectedOption('create')}
          className={`p-4 border rounded-lg cursor-pointer transition-all ${
            selectedOption === 'create'
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${selectedOption === 'create' ? 'bg-blue-100 dark:bg-blue-900' : 'bg-gray-100 dark:bg-gray-800'}`}>
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 dark:text-white">Create new organization</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                Start fresh with your own team. You&apos;ll be the owner and can invite others.
              </p>
            </div>
          </div>
        </div>

        {/* Option 2: Join via Invite */}
        <div
          onClick={() => setSelectedOption('join')}
          className={`p-4 border rounded-lg cursor-pointer transition-all ${
            selectedOption === 'join'
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${selectedOption === 'join' ? 'bg-blue-100 dark:bg-blue-900' : 'bg-gray-100 dark:bg-gray-800'}`}>
              <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 dark:text-white">Join via invite code</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                Your team admin should have shared an invite code with you.
              </p>
            </div>
          </div>

          {selectedOption === 'join' && (
            <div className="mt-4 pl-11">
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="Enter invite code"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          )}
        </div>

        {/* Option 3: Demo Mode */}
        <div
          onClick={() => setSelectedOption('demo')}
          className={`p-4 border rounded-lg cursor-pointer transition-all ${
            selectedOption === 'demo'
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${selectedOption === 'demo' ? 'bg-blue-100 dark:bg-blue-900' : 'bg-gray-100 dark:bg-gray-800'}`}>
              <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 dark:text-white">Explore demo mode</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                Try out the platform with sample data. No commitment required.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="mt-6">
        {selectedOption === 'create' && (
          <Link href="/onboarding/organization">
            <button className="w-full py-2.5 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors">
              Continue to setup
            </button>
          </Link>
        )}

        {selectedOption === 'join' && (
          <button
            onClick={handleJoinWithInvite}
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Joining...' : 'Join organization'}
          </button>
        )}

        {selectedOption === 'demo' && (
          <button
            onClick={handleExploreDemo}
            className="w-full py-2.5 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Start exploring
          </button>
        )}
      </div>

      {/* Sign out option */}
      <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
        Wrong account?{' '}
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            router.push('/login');
          }}
          className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
        >
          Sign out
        </button>
      </p>
    </div>
  );
}
