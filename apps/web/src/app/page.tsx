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
  Sparkles,
  TrendingUp,
  ChevronDown,
} from 'lucide-react';
import { ThemeSwitcher } from '@/components/landing/theme-switcher';
import { ThemeProvider, useTheme } from '@/contexts/theme-context';
import { Logo } from '@/components/ui/logo';

function LandingContent() {
  const router = useRouter();
  const { theme, colors } = useTheme();
  const [currentWord, setCurrentWord] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  // Animate words
  const words = ['Communicate', 'Connect', 'Community'];

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setCurrentWord((prev) => (prev + 1) % 3);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

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

  // Word colors for animation
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

  const features = [
    { icon: MessageSquare, label: 'Communicate', desc: 'AI detects high-intent conversations' },
    { icon: Zap, label: 'Connect', desc: 'Engage at scale without spam' },
    { icon: Users, label: 'Community', desc: 'Build tribes around shared needs' },
  ];

  return (
    <div className={`min-h-screen ${colors.gradient} flex flex-col`}>
      {/* Minimal Navigation */}
      <nav className={`fixed top-0 w-full ${navGlass} border-b z-50`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-14">
            <Logo size="lg" />
            <div className="flex items-center gap-2 sm:gap-3">
              <ThemeSwitcher />
              <Link
                href="/login"
                className={`${textSecondary} hover:opacity-80 font-medium transition text-sm hidden sm:block`}
              >
                Sign In
              </Link>
              <button
                onClick={handleTryDemo}
                className={`inline-flex items-center gap-1 bg-gradient-to-r ${buttonPrimary} text-white px-3 py-1.5 rounded-lg font-medium hover:opacity-90 transition shadow-lg text-xs sm:text-sm`}
              >
                Demo
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero - Full Screen */}
      <main className="flex-1 flex flex-col justify-center pt-14 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto w-full">
          {/* Animated Headline */}
          <div
            className={`text-center mb-6 sm:mb-8 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          >
            <h1 className={`text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight ${textPrimary} mb-3 sm:mb-4`}>
              <span className="relative inline-block h-[1.15em] overflow-hidden align-bottom min-w-[280px] sm:min-w-[400px]">
                {words.map((word, index) => (
                  <span
                    key={word}
                    className={`absolute inset-0 transition-all duration-500 ${wordColors[index]} ${isNeon ? 'neon-text font-black' : ''} ${
                      index === currentWord
                        ? 'opacity-100 translate-y-0'
                        : index < currentWord || (currentWord === 0 && index === 2)
                        ? 'opacity-0 -translate-y-full'
                        : 'opacity-0 translate-y-full'
                    }`}
                  >
                    {word}
                  </span>
                ))}
              </span>
            </h1>
            <p className={`text-lg sm:text-xl lg:text-2xl ${textSecondary} max-w-2xl mx-auto font-medium`}>
              AI finds people seeking your solution.
              <br className="hidden sm:block" />
              <span className="sm:hidden"> </span>
              You respond. Communities form.
            </p>
          </div>

          {/* 3Cs Feature Pills */}
          <div
            className={`flex flex-wrap justify-center gap-2 sm:gap-3 mb-6 sm:mb-8 transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          >
            {features.map((feature, index) => (
              <div
                key={feature.label}
                className={`${cardGlass} backdrop-blur-xl border rounded-full px-3 sm:px-4 py-2 flex items-center gap-2 hover:scale-105 transition-transform cursor-default group`}
              >
                <div className={`w-7 h-7 sm:w-8 sm:h-8 ${iconBgs[index]} rounded-full flex items-center justify-center`}>
                  <feature.icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${iconColors[index]}`} />
                </div>
                <div className="text-left">
                  <p className={`text-xs sm:text-sm font-bold ${textPrimary}`}>{feature.label}</p>
                  <p className={`text-[10px] sm:text-xs ${textSecondary} hidden sm:block`}>{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div
            className={`flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-6 sm:mb-8 transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          >
            <Link
              href="/demo"
              className={`group relative inline-flex items-center justify-center gap-2 bg-gradient-to-r ${buttonPrimary} text-white px-8 sm:px-10 py-4 sm:py-5 rounded-2xl font-bold text-lg sm:text-xl hover:scale-105 transition-all shadow-2xl w-full sm:w-auto`}
            >
              <Play className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform" />
              Test It Free
              <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-1 transition-transform" />
              {/* Pulse ring */}
              <span className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${buttonPrimary} opacity-50 animate-ping`} style={{ animationDuration: '2s' }} />
            </Link>
            <button
              onClick={handleTryDemo}
              className={`inline-flex items-center justify-center gap-2 ${cardGlass} backdrop-blur-xl border px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl font-semibold text-base hover:scale-105 transition-all ${textPrimary} w-full sm:w-auto`}
            >
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
              View Dashboard
            </button>
          </div>

          {/* Social Proof */}
          <div
            className={`text-center transition-all duration-1000 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          >
            <div className={`inline-flex items-center gap-2 ${cardGlass} backdrop-blur-xl border rounded-full px-4 py-2`}>
              <div className="flex -space-x-2">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 ${isDark ? 'border-gray-900' : 'border-white'} ${
                      isNeon
                        ? ['bg-fuchsia-500', 'bg-violet-500', 'bg-lime-500', 'bg-pink-500'][i]
                        : isDark
                        ? ['bg-cyan-500', 'bg-purple-500', 'bg-blue-500', 'bg-indigo-500'][i]
                        : ['bg-cyan-500', 'bg-pink-500', 'bg-orange-500', 'bg-purple-500'][i]
                    }`}
                  />
                ))}
              </div>
              <div className={`text-xs sm:text-sm ${textSecondary}`}>
                <span className={`font-bold ${textPrimary}`}>500+</span> conversations matched today
              </div>
              <TrendingUp className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isNeon ? 'text-lime-400' : isDark ? 'text-green-400' : 'text-green-600'}`} />
            </div>
          </div>
        </div>
      </main>

      {/* Scroll Indicator */}
      <div className={`text-center py-4 ${textSecondary}`}>
        <a href="#features" className="inline-flex flex-col items-center gap-1 hover:opacity-70 transition">
          <span className="text-xs">Learn more</span>
          <ChevronDown className="w-4 h-4 animate-bounce" />
        </a>
      </div>

      {/* Features Section (Below Fold) */}
      <section id="features" className="py-16 px-4 sm:px-6 border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          <h2 className={`text-2xl sm:text-3xl font-bold ${textPrimary} text-center mb-8`}>
            How ReachBy3Cs Works
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { num: '1', title: 'Detect', desc: 'AI crawls Reddit, Twitter, Quora to find high-intent conversations' },
              { num: '2', title: 'Analyze', desc: 'Each post scored for intent, risk, and engagement opportunity' },
              { num: '3', title: 'Generate', desc: 'AI creates authentic, value-first response variants' },
              { num: '4', title: 'Engage', desc: 'Review, approve, post. Track results and build community' },
            ].map((step, i) => (
              <div key={step.num} className={`${cardGlass} backdrop-blur-xl border rounded-xl p-4 hover:scale-105 transition-transform`}>
                <div className={`w-8 h-8 rounded-full ${iconBgs[i % 3]} flex items-center justify-center mb-3`}>
                  <span className={`font-bold text-sm ${iconColors[i % 3]}`}>{step.num}</span>
                </div>
                <h3 className={`font-bold ${textPrimary} mb-1`}>{step.title}</h3>
                <p className={`text-xs ${textSecondary}`}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mini Footer */}
      <footer className={`py-4 px-4 border-t ${isDark ? 'border-white/10' : 'border-gray-200/50'}`}>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2 text-xs">
          <Logo size="sm" />
          <div className={`flex items-center gap-4 ${textSecondary}`}>
            <Link href="/pitch" className="hover:opacity-80">Investors</Link>
            <Link href="/pricing" className="hover:opacity-80">Pricing</Link>
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
