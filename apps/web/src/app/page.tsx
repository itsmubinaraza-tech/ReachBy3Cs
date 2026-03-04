'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  MessageSquare,
  Users,
  Zap,
  ArrowRight,
  CheckCircle2,
  BarChart3,
  Shield,
  Clock,
  Sparkles
} from 'lucide-react';
import { AnimatedTagline } from '@/components/landing/animated-tagline';
import { SearchForm } from '@/components/landing/search-form';
import { DashboardPreview } from '@/components/landing/dashboard-preview';
import { useLandingSearch } from '@/hooks/use-landing-search';
import {
  mockPreviewQueueItems,
  mockRecentActivity,
  mockTrendingClusters,
  mockChartData,
} from '@/lib/landing/mock-preview-data';

export default function LandingPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const { search, results, isSearching, hasSearched, error } = useLandingSearch();

  const handleTryDemo = () => {
    // Track trial usage and redirect to dashboard
    const trialData = localStorage.getItem('reachby3cs_trial');
    const trial = trialData ? JSON.parse(trialData) : { uses: 0, startedAt: new Date().toISOString() };

    if (trial.uses < 10) {
      trial.uses += 1;
      localStorage.setItem('reachby3cs_trial', JSON.stringify(trial));
      router.push('/dashboard?tour=true');
    } else {
      router.push('/signup?reason=trial_expired');
    }
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      router.push(`/signup?email=${encodeURIComponent(email)}`);
    }
  };

  // Use search results if available, otherwise mock data
  const previewItems = hasSearched ? results : mockPreviewQueueItems;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">3C</span>
              </div>
              <span className="font-bold text-xl">ReachBy3Cs</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition">Features</a>
              <a href="#how-it-works" className="text-gray-600 hover:text-gray-900 transition">How It Works</a>
              <Link href="/pricing" className="text-gray-600 hover:text-gray-900 transition">Pricing</Link>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-gray-600 hover:text-gray-900 font-medium transition"
              >
                Sign In
              </Link>
              <button
                onClick={handleTryDemo}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
              >
                Try Free Demo
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section with Animated Tagline */}
      <section className="pt-32 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              AI-Powered Engagement Platform
            </div>

            <AnimatedTagline />

            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8 mb-8">
              <button
                onClick={handleTryDemo}
                className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-700 transition shadow-lg shadow-blue-600/25"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5" />
              </button>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-2 bg-white text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg border-2 border-gray-200 hover:border-gray-300 transition"
              >
                See How It Works
              </a>
            </div>

            <div className="flex items-center justify-center gap-8 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                10 free trial uses
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                No credit card required
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Guided walkthrough
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Two-Column Search & Preview Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Search Form (sticky on desktop) */}
            <div className="lg:sticky lg:top-24 lg:self-start">
              <SearchForm
                onSearch={search}
                isLoading={isSearching}
                error={error}
              />
            </div>

            {/* Right Column - Dashboard Preview */}
            <div>
              <DashboardPreview
                items={previewItems}
                activities={mockRecentActivity}
                clusters={mockTrendingClusters}
                chartData={mockChartData}
                isLiveMode={hasSearched}
                isLoading={isSearching}
              />
            </div>
          </div>
        </div>
      </section>

      {/* The 3Cs Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              The Power of 3Cs
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our AI-powered platform helps you master the three pillars of authentic engagement
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Communicate */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                <MessageSquare className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Communicate</h3>
              <p className="text-gray-600 mb-6">
                Our AI detects high-intent conversations where people need exactly what you offer.
                Generate authentic, value-first responses that resonate.
              </p>
              <ul className="space-y-3">
                {['Signal detection across platforms', 'Context-aware response generation', 'Risk scoring to avoid missteps'].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-gray-700">
                    <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Connect */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition">
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                <Zap className="w-7 h-7 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Connect</h3>
              <p className="text-gray-600 mb-6">
                Engage at scale without being spammy. Our smart CTA system ensures 30% of responses
                are pure value - building trust before any ask.
              </p>
              <ul className="space-y-3">
                {['Human-like posting delays', 'CTA level control (0-3)', 'Auto-post for low-risk responses'].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-gray-700">
                    <CheckCircle2 className="w-5 h-5 text-purple-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Community */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition">
              <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center mb-6">
                <Users className="w-7 h-7 text-indigo-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Community</h3>
              <p className="text-gray-600 mb-6">
                Turn scattered conversations into organized communities. AI clusters similar
                discussions to identify recurring themes and growth opportunities.
              </p>
              <ul className="space-y-3">
                {['Automatic community clustering', 'Trending topic detection', 'Community health analytics'].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-gray-700">
                    <CheckCircle2 className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From detection to engagement in minutes, not hours
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: '1',
                title: 'Detect',
                description: 'AI crawls Reddit, Twitter, Quora & more to find conversations matching your problem categories',
                icon: BarChart3,
              },
              {
                step: '2',
                title: 'Analyze',
                description: 'Each post is scored for intent, risk, and engagement opportunity',
                icon: Shield,
              },
              {
                step: '3',
                title: 'Generate',
                description: 'AI creates multiple response variants - value-first, soft CTA, and contextual',
                icon: Sparkles,
              },
              {
                step: '4',
                title: 'Engage',
                description: 'Review, approve, or auto-post. Track results and build community',
                icon: Clock,
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="relative mb-6">
                  <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-blue-600/25">
                    <item.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {item.step}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-600 to-purple-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Engagement?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Start your free trial today. No credit card required.
          </p>

          <form onSubmit={handleSignUp} className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="flex-1 px-6 py-4 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-white/25"
              required
            />
            <button
              type="submit"
              className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold hover:bg-blue-50 transition shadow-lg"
            >
              Get Started
            </button>
          </form>

          <p className="mt-6 text-blue-200 text-sm">
            Join 500+ businesses already using ReachBy3Cs
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">3C</span>
              </div>
              <span className="font-bold text-xl text-white">ReachBy3Cs</span>
            </div>
            <div className="flex items-center gap-8 text-gray-400">
              <a href="#" className="hover:text-white transition">Privacy</a>
              <a href="#" className="hover:text-white transition">Terms</a>
              <a href="#" className="hover:text-white transition">Contact</a>
            </div>
            <p className="text-gray-500 text-sm">
              &copy; 2026 ReachBy3Cs. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
