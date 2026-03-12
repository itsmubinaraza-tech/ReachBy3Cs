'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  MessageSquare,
  Users,
  Zap,
  CheckCircle2,
  BarChart3,
  Shield,
  Sparkles,
  Clock,
} from 'lucide-react';
import { AnimatedTagline } from '@/components/landing/animated-tagline';
import { SearchForm } from '@/components/landing/search-form';
import { DashboardPreview } from '@/components/landing/dashboard-preview';
import { ThemeSwitcher } from '@/components/landing/theme-switcher';
import { ThemeProvider, useTheme } from '@/contexts/theme-context';
import { useLandingSearch } from '@/hooks/use-landing-search';
import { mockPreviewQueueItems } from '@/lib/landing/mock-preview-data';
import { Logo } from '@/components/ui/logo';

function LandingContent() {
  const router = useRouter();
  const { theme, colors } = useTheme();
  const { search, results, isSearching, hasSearched, error } = useLandingSearch();

  const handleTryDemo = () => {
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

  const previewItems = hasSearched ? results : mockPreviewQueueItems;

  // Theme-aware classes
  const isNeon = theme === 'neon';
  const isDark = theme === 'dark' || isNeon;
  const isEarthy = theme === 'earthy';
  const isCalm = theme === 'calm';

  const navGlass = isNeon
    ? 'bg-gray-950/90 backdrop-blur-xl border-fuchsia-500/30'
    : isDark
    ? 'bg-gray-900/80 backdrop-blur-xl border-white/10'
    : 'bg-white/25 backdrop-blur-xl border-white/30';

  const textPrimary = isDark ? 'text-white' : isEarthy ? 'text-amber-900' : isCalm ? 'text-teal-900' : 'text-gray-800';
  const textSecondary = isNeon ? 'text-purple-200' : isDark ? 'text-gray-400' : isEarthy ? 'text-amber-700' : isCalm ? 'text-teal-700' : 'text-gray-600';
  const textMuted = isNeon ? 'text-purple-300' : isDark ? 'text-gray-500' : 'text-gray-500';

  const buttonPrimary = isNeon
    ? 'from-fuchsia-500 via-purple-500 to-violet-500 shadow-fuchsia-500/40'
    : isDark
    ? 'from-cyan-500 to-cyan-600 shadow-cyan-500/30'
    : isEarthy
    ? 'from-amber-500 to-orange-500 shadow-amber-500/30'
    : isCalm
    ? 'from-teal-500 to-emerald-500 shadow-teal-500/30'
    : 'from-cyan-500 to-cyan-600 shadow-cyan-500/30';

  const cardGlass = isNeon
    ? 'bg-purple-500/10 border-fuchsia-500/30'
    : isDark
    ? 'bg-white/5 border-white/10'
    : isEarthy
    ? 'bg-amber-100/40 border-amber-200/50'
    : isCalm
    ? 'bg-teal-100/30 border-teal-200/40'
    : 'bg-white/25 border-white/30';

  const iconBg1 = isNeon ? 'bg-fuchsia-500/20' : isDark ? 'bg-cyan-500/20' : isEarthy ? 'bg-amber-500/20' : isCalm ? 'bg-teal-500/20' : 'bg-cyan-500/20';
  const iconBg2 = isNeon ? 'bg-violet-500/20' : isDark ? 'bg-purple-500/20' : isEarthy ? 'bg-orange-500/20' : isCalm ? 'bg-emerald-500/20' : 'bg-pink-500/20';
  const iconBg3 = isNeon ? 'bg-lime-500/20' : isDark ? 'bg-blue-500/20' : isEarthy ? 'bg-yellow-500/20' : isCalm ? 'bg-sky-500/20' : 'bg-orange-500/20';

  const iconColor1 = isNeon ? 'text-fuchsia-400' : isDark ? 'text-cyan-400' : isEarthy ? 'text-amber-600' : isCalm ? 'text-teal-600' : 'text-cyan-600';
  const iconColor2 = isNeon ? 'text-violet-400' : isDark ? 'text-purple-400' : isEarthy ? 'text-orange-600' : isCalm ? 'text-emerald-600' : 'text-pink-600';
  const iconColor3 = isNeon ? 'text-lime-400' : isDark ? 'text-blue-400' : isEarthy ? 'text-yellow-600' : isCalm ? 'text-sky-600' : 'text-orange-600';

  const checkColor1 = isNeon ? 'text-fuchsia-400' : isDark ? 'text-cyan-400' : isEarthy ? 'text-amber-500' : isCalm ? 'text-teal-500' : 'text-cyan-500';
  const checkColor2 = isNeon ? 'text-violet-400' : isDark ? 'text-purple-400' : isEarthy ? 'text-orange-500' : isCalm ? 'text-emerald-500' : 'text-pink-500';
  const checkColor3 = isNeon ? 'text-lime-400' : isDark ? 'text-blue-400' : isEarthy ? 'text-yellow-500' : isCalm ? 'text-sky-500' : 'text-orange-500';

  const stepBadgeBg = isNeon ? 'bg-fuchsia-500 text-white' : isDark ? 'bg-white text-gray-900' : 'bg-gray-900 text-white';

  return (
    <div className={`min-h-screen ${colors.gradient}`}>
      {/* Navigation */}
      <nav className={`fixed top-0 w-full ${navGlass} border-b z-50`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Logo size="xl" />
            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className={`${textSecondary} hover:${textPrimary} transition`}>Features</a>
              <a href="#how-it-works" className={`${textSecondary} hover:${textPrimary} transition`}>How It Works</a>
              <Link href="/pricing" className={`${textSecondary} hover:${textPrimary} transition`}>Pricing</Link>
              <Link href="/pitch" className={`${textSecondary} hover:${textPrimary} transition`}>Investors</Link>
            </div>
            <div className="flex items-center gap-3">
              <ThemeSwitcher />
              <Link
                href="/login"
                className={`${textSecondary} hover:${textPrimary} font-medium transition hidden sm:block`}
              >
                Sign In
              </Link>
              <button
                onClick={handleTryDemo}
                className={`inline-flex items-center justify-center gap-1 bg-gradient-to-r ${buttonPrimary} text-white px-4 py-2 rounded-xl font-medium hover:opacity-90 transition shadow-lg text-sm`}
              >
                Start Free Trial
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <AnimatedTagline />
          </div>
        </div>
      </section>

      {/* Two-Column Search & Preview Section */}
      <section className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Search Form */}
            <div className="h-[600px]">
              <SearchForm
                onSearch={search}
                isLoading={isSearching}
                error={error}
              />
            </div>
            {/* Right Column - Dashboard Preview */}
            <div className="h-[600px]">
              <DashboardPreview
                items={previewItems}
                isLiveMode={hasSearched}
                isLoading={isSearching}
              />
            </div>
          </div>
        </div>
      </section>

      {/* The 3Cs Section */}
      <section id="features" className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className={`text-3xl sm:text-4xl font-bold ${textPrimary} mb-4`}>
              The Power of 3Cs
            </h2>
            <p className={`text-xl ${textSecondary} max-w-2xl mx-auto`}>
              Our AI-powered platform helps you master the three pillars of authentic engagement
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Communicate */}
            <div className={`${cardGlass} backdrop-blur-xl rounded-2xl p-6 hover:shadow-xl transition border ${isNeon ? 'hover:shadow-fuchsia-500/20 neon-border' : ''}`}>
              <div className={`w-12 h-12 ${iconBg1} rounded-xl flex items-center justify-center mb-4`}>
                <MessageSquare className={`w-6 h-6 ${iconColor1}`} />
              </div>
              <h3 className={`text-xl font-bold ${textPrimary} mb-3`}>Communicate</h3>
              <p className={`${textSecondary} mb-4 text-sm`}>
                Our AI detects high-intent conversations where people need exactly what you offer.
                Generate authentic, value-first responses that resonate.
              </p>
              <ul className="space-y-2">
                {['Signal detection across platforms', 'Context-aware response generation', 'Risk scoring to avoid missteps'].map((item) => (
                  <li key={item} className={`flex items-center gap-2 text-sm ${textSecondary}`}>
                    <CheckCircle2 className={`w-4 h-4 ${checkColor1} flex-shrink-0`} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Connect */}
            <div className={`${cardGlass} backdrop-blur-xl rounded-2xl p-6 hover:shadow-xl transition border ${isNeon ? 'hover:shadow-violet-500/20 neon-border' : ''}`}>
              <div className={`w-12 h-12 ${iconBg2} rounded-xl flex items-center justify-center mb-4`}>
                <Zap className={`w-6 h-6 ${iconColor2}`} />
              </div>
              <h3 className={`text-xl font-bold ${textPrimary} mb-3`}>Connect</h3>
              <p className={`${textSecondary} mb-4 text-sm`}>
                Engage at scale without being spammy. Our smart CTA system ensures 30% of responses
                are pure value - building trust before any ask.
              </p>
              <ul className="space-y-2">
                {['Human-like posting delays', 'CTA level control (0-3)', 'Auto-post for low-risk responses'].map((item) => (
                  <li key={item} className={`flex items-center gap-2 text-sm ${textSecondary}`}>
                    <CheckCircle2 className={`w-4 h-4 ${checkColor2} flex-shrink-0`} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Community */}
            <div className={`${cardGlass} backdrop-blur-xl rounded-2xl p-6 hover:shadow-xl transition border ${isNeon ? 'hover:shadow-lime-500/20 neon-border' : ''}`}>
              <div className={`w-12 h-12 ${iconBg3} rounded-xl flex items-center justify-center mb-4`}>
                <Users className={`w-6 h-6 ${iconColor3}`} />
              </div>
              <h3 className={`text-xl font-bold ${textPrimary} mb-3`}>Community</h3>
              <p className={`${textSecondary} mb-4 text-sm`}>
                Turn scattered conversations into organized communities. AI clusters similar
                discussions to identify recurring themes and growth opportunities.
              </p>
              <ul className="space-y-2">
                {['Automatic community clustering', 'Trending topic detection', 'Community health analytics'].map((item) => (
                  <li key={item} className={`flex items-center gap-2 text-sm ${textSecondary}`}>
                    <CheckCircle2 className={`w-4 h-4 ${checkColor3} flex-shrink-0`} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className={`text-3xl sm:text-4xl font-bold ${textPrimary} mb-4`}>
              How It Works
            </h2>
            <p className={`text-xl ${textSecondary} max-w-2xl mx-auto`}>
              From detection to engagement in minutes, not hours
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: '1', title: 'Detect', description: 'AI crawls Reddit, Twitter, Quora & more to find conversations matching your problem categories', icon: BarChart3, bg: iconBg1, color: iconColor1 },
              { step: '2', title: 'Analyze', description: 'Each post is scored for intent, risk, and engagement opportunity', icon: Shield, bg: iconBg2, color: iconColor2 },
              { step: '3', title: 'Generate', description: 'AI creates multiple response variants - value-first, soft CTA, and contextual', icon: Sparkles, bg: iconBg3, color: iconColor3 },
              { step: '4', title: 'Engage', description: 'Review, approve, or auto-post. Track results and build community', icon: Clock, bg: iconBg1, color: iconColor1 },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="relative mb-4 inline-block">
                  <div className={`w-14 h-14 ${item.bg} backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg`}>
                    <item.icon className={`w-7 h-7 ${item.color}`} />
                  </div>
                  <div className={`absolute -top-1 -right-1 w-6 h-6 ${stepBadgeBg} rounded-full flex items-center justify-center font-bold text-xs`}>
                    {item.step}
                  </div>
                </div>
                <h3 className={`text-lg font-bold ${textPrimary} mb-2`}>{item.title}</h3>
                <p className={`${textSecondary} text-sm`}>{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 px-4 sm:px-6 lg:px-8 mt-auto">
        <div className="max-w-7xl mx-auto">
          <div className={`flex flex-col sm:flex-row justify-between items-center gap-4 ${cardGlass} backdrop-blur-xl rounded-xl px-6 py-4 border`}>
            <Logo size="sm" />
            <div className={`flex items-center gap-6 text-sm ${textMuted}`}>
              <a href="#" className={`hover:${textPrimary} transition`}>Privacy</a>
              <a href="#" className={`hover:${textPrimary} transition`}>Terms</a>
              <Link href="/pitch" className={`hover:${textPrimary} transition`}>Investors</Link>
              <a href="#" className={`hover:${textPrimary} transition`}>Contact</a>
            </div>
            <p className={`${textMuted} text-sm`}>
              &copy; 2026 ReachBy3Cs
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function LandingPage() {
  return (
    <ThemeProvider>
      <LandingContent />
    </ThemeProvider>
  );
}
