'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  ArrowRight,
  MessageSquare,
  Users,
  Zap,
  Play,
  TrendingUp,
  ChevronDown,
  BarChart3,
  Shield,
  Sparkles,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { ThemeSwitcher } from '@/components/landing/theme-switcher';
import { ThemeProvider, useTheme } from '@/contexts/theme-context';
import { Logo } from '@/components/ui/logo';

function LandingContent() {
  const router = useRouter();
  const { theme, colors } = useTheme();
  const [isVisible, setIsVisible] = useState(false);
  const [currentWord, setCurrentWord] = useState(0);

  const words = ['Communicate', 'Connect', 'Community'];

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setCurrentWord((prev) => (prev + 1) % 3);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleViewDashboard = () => {
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

  // Theme-aware classes
  const isNeon = theme === 'neon';
  const isDark = theme === 'dark' || isNeon;
  const isEarthy = theme === 'earthy';
  const isCalm = theme === 'calm';

  const navGlass = isNeon
    ? 'bg-gray-950/80 backdrop-blur-xl border-fuchsia-500/30'
    : isDark
    ? 'bg-gray-900/70 backdrop-blur-xl border-white/10'
    : 'bg-white/20 backdrop-blur-xl border-white/30';

  const textPrimary = isDark ? 'text-white' : isEarthy ? 'text-amber-900' : isCalm ? 'text-teal-900' : 'text-gray-900';
  const textSecondary = isNeon ? 'text-purple-200' : isDark ? 'text-gray-400' : isEarthy ? 'text-amber-700' : isCalm ? 'text-teal-700' : 'text-gray-600';
  const textMuted = isNeon ? 'text-purple-300' : isDark ? 'text-gray-500' : 'text-gray-500';

  const buttonPrimary = isNeon
    ? 'from-fuchsia-500 via-purple-500 to-violet-500 shadow-fuchsia-500/50'
    : isDark
    ? 'from-cyan-400 to-cyan-600 shadow-cyan-500/40'
    : isEarthy
    ? 'from-amber-500 to-orange-500 shadow-amber-500/40'
    : isCalm
    ? 'from-teal-500 to-emerald-500 shadow-teal-500/40'
    : 'from-cyan-500 to-cyan-600 shadow-cyan-500/40';

  const cardGlass = isNeon
    ? 'bg-purple-500/10 border-fuchsia-500/30'
    : isDark
    ? 'bg-white/5 border-white/10'
    : isEarthy
    ? 'bg-amber-100/30 border-amber-200/40'
    : isCalm
    ? 'bg-teal-100/20 border-teal-200/30'
    : 'bg-white/20 border-white/30';

  const accentColor = isNeon ? 'text-fuchsia-400' : isDark ? 'text-cyan-400' : isEarthy ? 'text-amber-600' : isCalm ? 'text-teal-600' : 'text-cyan-500';

  const wordColors = isNeon
    ? ['text-fuchsia-400', 'text-violet-400', 'text-lime-400']
    : isDark
    ? ['text-cyan-400', 'text-purple-400', 'text-blue-400']
    : isEarthy
    ? ['text-amber-600', 'text-orange-600', 'text-yellow-600']
    : isCalm
    ? ['text-teal-600', 'text-emerald-600', 'text-sky-600']
    : ['text-cyan-500', 'text-pink-500', 'text-orange-500'];

  const iconColors = isNeon
    ? ['text-fuchsia-400', 'text-violet-400', 'text-lime-400']
    : isDark
    ? ['text-cyan-400', 'text-purple-400', 'text-blue-400']
    : isEarthy
    ? ['text-amber-600', 'text-orange-600', 'text-yellow-600']
    : isCalm
    ? ['text-teal-600', 'text-emerald-600', 'text-sky-600']
    : ['text-cyan-600', 'text-pink-600', 'text-orange-600'];

  const iconBgs = isNeon
    ? ['bg-fuchsia-500/20', 'bg-violet-500/20', 'bg-lime-500/20']
    : isDark
    ? ['bg-cyan-500/20', 'bg-purple-500/20', 'bg-blue-500/20']
    : isEarthy
    ? ['bg-amber-500/15', 'bg-orange-500/15', 'bg-yellow-500/15']
    : isCalm
    ? ['bg-teal-500/15', 'bg-emerald-500/15', 'bg-sky-500/15']
    : ['bg-cyan-500/15', 'bg-pink-500/15', 'bg-orange-500/15'];

  const checkColors = isNeon
    ? ['text-fuchsia-400', 'text-violet-400', 'text-lime-400']
    : isDark
    ? ['text-cyan-400', 'text-purple-400', 'text-blue-400']
    : isEarthy
    ? ['text-amber-500', 'text-orange-500', 'text-yellow-500']
    : isCalm
    ? ['text-teal-500', 'text-emerald-500', 'text-sky-500']
    : ['text-cyan-500', 'text-pink-500', 'text-orange-500'];

  return (
    <div className={`min-h-screen ${colors.gradient}`}>
      {/* Navigation */}
      <nav className={`fixed top-0 w-full ${navGlass} border-b z-50`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-14">
            <Logo size="lg" href="/" />
            <div className="flex items-center gap-4 sm:gap-6">
              <Link href="/pricing" className={`${textSecondary} hover:opacity-80 font-medium transition text-sm hidden sm:block`}>
                Pricing
              </Link>
              <ThemeSwitcher />
              <Link
                href="/login"
                className={`${textSecondary} hover:opacity-80 font-medium transition text-sm`}
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - First Screen */}
      <section className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 relative">
        <div className="max-w-5xl mx-auto w-full text-center">
          {/* All content centered */}
          <div
            className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          >
            {/* Problem statement */}
            <p className={`text-lg sm:text-xl lg:text-2xl ${textSecondary} mb-1`}>
              You build products that solve <span className={`${textPrimary} font-medium`}>real problems</span>.
            </p>
            <p className={`text-lg sm:text-xl lg:text-2xl ${textSecondary} mb-8 sm:mb-12`}>
              But your users don&apos;t know if that solution exists.
            </p>

            {/* Centered animated words */}
            <div className="mb-6 sm:mb-8">
              <div className="relative h-14 sm:h-20 lg:h-24 flex items-center justify-center overflow-hidden">
                {words.map((word, index) => (
                  <span
                    key={word}
                    className={`absolute text-4xl sm:text-6xl lg:text-7xl font-bold transition-all duration-700 ease-in-out ${wordColors[index]} ${
                      currentWord === index
                        ? 'opacity-100 translate-y-0'
                        : 'opacity-0 translate-y-6'
                    }`}
                  >
                    {word}
                  </span>
                ))}
              </div>
            </div>

            {/* Value proposition */}
            <p className={`text-lg sm:text-xl lg:text-2xl ${textPrimary} mb-3`}>
              ReachBy3Cs finds people seeking your solution.
            </p>

            {/* Flow description */}
            <p className={`text-base sm:text-lg ${textSecondary} mb-10 sm:mb-12`}>
              You respond <span className={accentColor}>&gt;</span> Communities form <span className={accentColor}>&gt;</span> Your products get to the people seeking those solutions
            </p>
          </div>

          {/* CTA Buttons */}
          <div
            className={`flex flex-col sm:flex-row items-center justify-center gap-4 mb-4 transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          >
            <Link
              href="/demo"
              className={`group relative inline-flex items-center justify-center gap-2 bg-gradient-to-r ${buttonPrimary} text-white px-8 sm:px-10 py-4 sm:py-5 rounded-2xl font-bold text-lg sm:text-xl hover:scale-105 transition-all shadow-2xl w-full sm:w-auto`}
            >
              <Play className="w-5 h-5 sm:w-6 sm:h-6" />
              Try It Free Now
              <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-1 transition-transform" />
            </Link>
            <button
              onClick={handleViewDashboard}
              className={`inline-flex items-center justify-center gap-2 ${
                isNeon
                  ? 'bg-gradient-to-r from-violet-600 to-purple-700 text-white shadow-violet-500/40'
                  : isDark
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-purple-500/40'
                  : isEarthy
                  ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-orange-500/40'
                  : isCalm
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-emerald-500/40'
                  : 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-purple-500/40'
              } px-8 py-4 rounded-2xl font-semibold text-base hover:scale-105 transition-all shadow-lg w-full sm:w-auto`}
            >
              <Sparkles className="w-5 h-5" />
              Review Demo
            </button>
          </div>
          <p className={`${textMuted} text-sm mb-8 transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
            No credit card required. See results in seconds.
          </p>

          {/* Social Proof */}
          <div
            className={`transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          >
            <div className={`inline-flex items-center gap-3 ${cardGlass} backdrop-blur-xl border rounded-full px-5 py-2.5`}>
              <div className="flex -space-x-2">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 ${isDark ? 'border-gray-900' : 'border-white'} ${
                      isNeon
                        ? ['bg-fuchsia-500', 'bg-violet-500', 'bg-lime-500', 'bg-pink-500'][i]
                        : isDark
                        ? ['bg-cyan-500', 'bg-purple-500', 'bg-blue-500', 'bg-indigo-500'][i]
                        : ['bg-cyan-500', 'bg-pink-500', 'bg-orange-500', 'bg-purple-500'][i]
                    }`}
                  />
                ))}
              </div>
              <div className={`text-sm ${textSecondary}`}>
                <span className={`font-bold ${textPrimary}`}>500+</span> conversations matched today
              </div>
              <TrendingUp className={`w-4 h-4 ${isNeon ? 'text-lime-400' : isDark ? 'text-green-400' : 'text-green-600'}`} />
            </div>
          </div>
        </div>

        {/* Scroll Indicator - centered at bottom */}
        <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 text-center ${textSecondary}`}>
          <a href="#features" className="inline-flex flex-col items-center gap-1 hover:opacity-70 transition">
            <span className="text-sm">Learn more</span>
            <ChevronDown className="w-5 h-5 animate-bounce" />
          </a>
        </div>
      </section>

      {/* The 3Cs Section - Second Screen */}
      <section id="features" className="min-h-screen flex items-center py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto w-full">
          <div className="text-center mb-12">
            <h2 className={`text-3xl sm:text-4xl lg:text-5xl font-bold ${textPrimary} mb-4`}>
              The Power of <span className={accentColor}>3Cs</span>
            </h2>
            <p className={`text-lg sm:text-xl ${textSecondary} max-w-2xl mx-auto`}>
              Master the three pillars of authentic engagement
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {/* Communicate */}
            <div className={`${cardGlass} backdrop-blur-xl rounded-2xl p-6 lg:p-8 hover:scale-105 transition-transform border`}>
              <div className={`w-14 h-14 ${iconBgs[0]} rounded-2xl flex items-center justify-center mb-5`}>
                <MessageSquare className={`w-7 h-7 ${iconColors[0]}`} />
              </div>
              <h3 className={`text-xl lg:text-2xl font-bold ${textPrimary} mb-3`}>Communicate</h3>
              <p className={`${textSecondary} mb-5`}>
                AI detects high-intent conversations where people need exactly what you offer.
                Generate authentic, value-first responses that resonate.
              </p>
              <ul className="space-y-2">
                {['Signal detection across platforms', 'Context-aware response generation', 'Risk scoring to avoid missteps'].map((item) => (
                  <li key={item} className={`flex items-center gap-2 text-sm ${textSecondary}`}>
                    <CheckCircle2 className={`w-4 h-4 ${checkColors[0]} flex-shrink-0`} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Connect */}
            <div className={`${cardGlass} backdrop-blur-xl rounded-2xl p-6 lg:p-8 hover:scale-105 transition-transform border`}>
              <div className={`w-14 h-14 ${iconBgs[1]} rounded-2xl flex items-center justify-center mb-5`}>
                <Zap className={`w-7 h-7 ${iconColors[1]}`} />
              </div>
              <h3 className={`text-xl lg:text-2xl font-bold ${textPrimary} mb-3`}>Connect</h3>
              <p className={`${textSecondary} mb-5`}>
                Engage at scale without being spammy. Our smart CTA system ensures 30% of responses
                are pure value — building trust before any ask.
              </p>
              <ul className="space-y-2">
                {['Human-like posting delays', 'CTA level control (0-3)', 'Auto-post for low-risk responses'].map((item) => (
                  <li key={item} className={`flex items-center gap-2 text-sm ${textSecondary}`}>
                    <CheckCircle2 className={`w-4 h-4 ${checkColors[1]} flex-shrink-0`} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Community */}
            <div className={`${cardGlass} backdrop-blur-xl rounded-2xl p-6 lg:p-8 hover:scale-105 transition-transform border`}>
              <div className={`w-14 h-14 ${iconBgs[2]} rounded-2xl flex items-center justify-center mb-5`}>
                <Users className={`w-7 h-7 ${iconColors[2]}`} />
              </div>
              <h3 className={`text-xl lg:text-2xl font-bold ${textPrimary} mb-3`}>Community</h3>
              <p className={`${textSecondary} mb-5`}>
                Turn scattered conversations into organized communities. AI clusters similar
                discussions to identify recurring themes and growth opportunities.
              </p>
              <ul className="space-y-2">
                {['Automatic community clustering', 'Trending topic detection', 'Community health analytics'].map((item) => (
                  <li key={item} className={`flex items-center gap-2 text-sm ${textSecondary}`}>
                    <CheckCircle2 className={`w-4 h-4 ${checkColors[2]} flex-shrink-0`} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Scroll to How It Works */}
          <div className={`text-center mt-12 ${textSecondary}`}>
            <a href="#how-it-works" className="inline-flex flex-col items-center gap-1 hover:opacity-70 transition">
              <span className="text-sm">See how it works</span>
              <ChevronDown className="w-5 h-5 animate-bounce" />
            </a>
          </div>
        </div>
      </section>

      {/* How It Works - Third Screen */}
      <section id="how-it-works" className="min-h-screen flex items-center py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto w-full">
          <div className="text-center mb-12">
            <h2 className={`text-3xl sm:text-4xl lg:text-5xl font-bold ${textPrimary} mb-4`}>
              How <span className={accentColor}>ReachBy3Cs</span> Works
            </h2>
            <p className={`text-lg sm:text-xl ${textSecondary} max-w-2xl mx-auto`}>
              From detection to engagement in minutes, not hours
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {[
              {
                num: '1',
                title: 'Detect',
                description: 'AI crawls Reddit, Twitter, Quora & more to find conversations matching your problem categories',
                icon: BarChart3
              },
              {
                num: '2',
                title: 'Analyze',
                description: 'Each post is scored for intent, risk, and engagement opportunity',
                icon: Shield
              },
              {
                num: '3',
                title: 'Generate',
                description: 'AI creates multiple response variants — value-first, soft CTA, and contextual',
                icon: Sparkles
              },
              {
                num: '4',
                title: 'Engage',
                description: 'Review, approve, or auto-post. Track results and build community',
                icon: Clock
              },
            ].map((step, i) => (
              <div key={step.num} className={`${cardGlass} backdrop-blur-xl border rounded-2xl p-6 text-center hover:scale-105 transition-transform`}>
                <div className="relative inline-block mb-4">
                  <div className={`w-16 h-16 ${iconBgs[i % 3]} rounded-2xl flex items-center justify-center`}>
                    <step.icon className={`w-8 h-8 ${iconColors[i % 3]}`} />
                  </div>
                  <div className={`absolute -top-2 -right-2 w-7 h-7 ${isDark ? 'bg-white text-gray-900' : 'bg-gray-900 text-white'} rounded-full flex items-center justify-center font-bold text-sm`}>
                    {step.num}
                  </div>
                </div>
                <h3 className={`text-xl font-bold ${textPrimary} mb-2`}>{step.title}</h3>
                <p className={`text-sm ${textSecondary}`}>{step.description}</p>
              </div>
            ))}
          </div>

          {/* Final CTA */}
          <div className="text-center mt-16">
            <Link
              href="/demo"
              className={`inline-flex items-center justify-center gap-2 bg-gradient-to-r ${buttonPrimary} text-white px-10 py-5 rounded-2xl font-bold text-xl hover:scale-105 transition-all shadow-2xl`}
            >
              <Play className="w-6 h-6" />
              Try It Free Now
              <ArrowRight className="w-6 h-6" />
            </Link>
            <p className={`mt-4 ${textMuted} text-sm`}>
              No credit card required. See results in seconds.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`py-6 px-4 border-t ${isDark ? 'border-white/10' : 'border-gray-200/50'}`}>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-sm">
          <Logo size="sm" href="/" />
          <div className={`flex items-center gap-6 ${textMuted}`}>
            <Link href="/pricing" className="hover:opacity-80 transition">Pricing</Link>
            <Link href="/pitch" className="hover:opacity-80 transition">Investors</Link>
            <span>&copy; 2026 ReachBy3Cs</span>
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
