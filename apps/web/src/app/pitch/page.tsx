'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Presentation,
  MessageSquare,
  Users,
  Zap,
  Shield,
  TrendingUp,
  Database,
  Cpu,
  Globe,
  DollarSign,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Target,
  Clock,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { ThemeProvider, useTheme } from '@/contexts/theme-context';
import { ThemeSwitcher } from '@/components/landing/theme-switcher';
import { Logo } from '@/components/ui/logo';

// Slide data
const slides = [
  {
    id: 1,
    title: 'The Pain Point',
    subtitle: 'Your Customers Are Asking for Help Right Now. Are You There?',
    duration: 60,
  },
  {
    id: 2,
    title: 'The Solution',
    subtitle: 'Communicate. Connect. Community.',
    duration: 90,
  },
  {
    id: 3,
    title: 'Architecture',
    subtitle: 'Built for Scale, Designed for Safety',
    duration: 90,
  },
  {
    id: 4,
    title: 'Revenue & Business',
    subtitle: 'SaaS Pricing Based on AI Processing Volume',
    duration: 60,
  },
];

function PitchContent() {
  const { theme, colors } = useTheme();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(slides[0]?.duration ?? 60);

  const isDark = theme === 'dark' || theme === 'neon';
  const isNeon = theme === 'neon';

  // Theme-aware classes
  const textPrimary = isDark ? 'text-white' : 'text-gray-800';
  const textSecondary = isDark ? 'text-gray-300' : 'text-gray-600';
  const textMuted = isDark ? 'text-gray-500' : 'text-gray-500';

  const cardBg = isNeon
    ? 'bg-purple-900/30 border-fuchsia-500/30'
    : isDark
    ? 'bg-gray-800/50 border-gray-700/50'
    : 'bg-white/60 border-white/40';

  const accentColor = isNeon
    ? 'text-fuchsia-400'
    : isDark
    ? 'text-cyan-400'
    : 'text-cyan-600';

  const buttonPrimary = isNeon
    ? 'bg-gradient-to-r from-fuchsia-500 to-violet-500 hover:from-fuchsia-600 hover:to-violet-600'
    : isDark
    ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700'
    : 'bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700';

  const progressBg = isNeon ? 'bg-fuchsia-500' : isDark ? 'bg-cyan-500' : 'bg-cyan-500';

  // Navigation functions
  const nextSlide = useCallback(() => {
    const next = (currentSlide + 1) % slides.length;
    setCurrentSlide(next);
    setTimeRemaining(slides[next]?.duration ?? 60);
  }, [currentSlide]);

  const prevSlide = useCallback(() => {
    const prev = currentSlide === 0 ? slides.length - 1 : currentSlide - 1;
    setCurrentSlide(prev);
    setTimeRemaining(slides[prev]?.duration ?? 60);
  }, [currentSlide]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setTimeRemaining(slides[index]?.duration ?? 60);
  };

  // Auto-play timer
  useEffect(() => {
    if (!isAutoPlay) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          nextSlide();
          return slides[(currentSlide + 1) % slides.length]?.duration ?? 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isAutoPlay, currentSlide, nextSlide]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        nextSlide();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevSlide();
      } else if (e.key === 'p') {
        setIsAutoPlay((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide]);

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Total time
  const totalTime = slides.reduce((acc, s) => acc + s.duration, 0);
  const currentSlideDuration = slides[currentSlide]?.duration ?? 60;
  const elapsedTime = slides.slice(0, currentSlide).reduce((acc, s) => acc + s.duration, 0) + (currentSlideDuration - timeRemaining);

  return (
    <div className={`min-h-screen ${colors.gradient}`}>
      {/* Navigation Bar */}
      <nav className={`fixed top-0 w-full ${isDark ? 'bg-gray-900/90' : 'bg-white/80'} backdrop-blur-xl border-b ${isDark ? 'border-white/10' : 'border-gray-200'} z-50`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <Link href="/" className="flex items-center gap-2">
              <Logo size="sm" />
            </Link>

            <div className="flex items-center gap-2">
              <span className={`text-sm ${textMuted} hidden sm:block`}>
                Investor Pitch Deck
              </span>
              <Presentation className={`w-5 h-5 ${accentColor}`} />
            </div>

            <div className="flex items-center gap-3">
              <ThemeSwitcher />
              <Link
                href="/"
                className={`text-sm ${textSecondary} hover:${textPrimary} transition hidden sm:block`}
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-20 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Slide Header */}
          <div className="text-center mb-8">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${cardBg} backdrop-blur-sm border mb-4`}>
              <span className={`text-sm font-medium ${accentColor}`}>
                Slide {currentSlide + 1} of {slides.length}
              </span>
              <span className={textMuted}>|</span>
              <Clock className={`w-4 h-4 ${textMuted}`} />
              <span className={`text-sm ${textMuted}`}>
                {formatTime(Math.floor(elapsedTime))} / {formatTime(totalTime)}
              </span>
            </div>
            <h1 className={`text-3xl sm:text-4xl lg:text-5xl font-bold ${textPrimary} mb-2`}>
              {slides[currentSlide]?.title ?? 'Slide'}
            </h1>
            <p className={`text-lg sm:text-xl ${textSecondary}`}>
              {slides[currentSlide]?.subtitle ?? ''}
            </p>
          </div>

          {/* Slide Content */}
          <div className={`${cardBg} backdrop-blur-xl rounded-2xl border p-6 sm:p-8 lg:p-10 min-h-[500px]`}>
            {currentSlide === 0 && <SlideOne isDark={isDark} isNeon={isNeon} accentColor={accentColor} textPrimary={textPrimary} textSecondary={textSecondary} />}
            {currentSlide === 1 && <SlideTwo isDark={isDark} isNeon={isNeon} accentColor={accentColor} textPrimary={textPrimary} textSecondary={textSecondary} />}
            {currentSlide === 2 && <SlideThree isDark={isDark} isNeon={isNeon} accentColor={accentColor} textPrimary={textPrimary} textSecondary={textSecondary} />}
            {currentSlide === 3 && <SlideFour isDark={isDark} isNeon={isNeon} accentColor={accentColor} textPrimary={textPrimary} textSecondary={textSecondary} />}
          </div>

          {/* Slide Progress Dots */}
          <div className="flex justify-center gap-2 mt-6">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-all ${
                  index === currentSlide
                    ? `${progressBg} scale-110`
                    : index < currentSlide
                    ? `${progressBg} opacity-50`
                    : `${isDark ? 'bg-gray-600' : 'bg-gray-300'}`
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </main>

      {/* Bottom Controls */}
      <div className={`fixed bottom-0 left-0 right-0 ${isDark ? 'bg-gray-900/95' : 'bg-white/95'} backdrop-blur-xl border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
        {/* Progress Bar */}
        <div className="h-1 bg-gray-200 dark:bg-gray-800">
          <div
            className={`h-full ${progressBg} transition-all duration-300`}
            style={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }}
          />
        </div>

        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left: Timer */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsAutoPlay(!isAutoPlay)}
                className={`p-2 rounded-lg ${cardBg} border transition hover:scale-105`}
                title={isAutoPlay ? 'Pause (P)' : 'Auto-play (P)'}
              >
                {isAutoPlay ? (
                  <Pause className={`w-5 h-5 ${accentColor}`} />
                ) : (
                  <Play className={`w-5 h-5 ${accentColor}`} />
                )}
              </button>
              {isAutoPlay && (
                <span className={`text-sm ${textMuted}`}>
                  Next slide in {timeRemaining}s
                </span>
              )}
            </div>

            {/* Center: Navigation */}
            <div className="flex items-center gap-3">
              <button
                onClick={prevSlide}
                className={`p-2 rounded-lg ${cardBg} border transition hover:scale-105`}
                title="Previous (Left Arrow)"
              >
                <ChevronLeft className={`w-5 h-5 ${textPrimary}`} />
              </button>
              <span className={`text-sm font-medium ${textPrimary} min-w-[80px] text-center`}>
                {currentSlide + 1} / {slides.length}
              </span>
              <button
                onClick={nextSlide}
                className={`p-2 rounded-lg ${cardBg} border transition hover:scale-105`}
                title="Next (Right Arrow / Space)"
              >
                <ChevronRight className={`w-5 h-5 ${textPrimary}`} />
              </button>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
              <span className={`text-xs ${textMuted} hidden sm:block`}>
                Use arrow keys or space to navigate
              </span>
              <Link
                href="/"
                className={`${buttonPrimary} text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2`}
              >
                Live Demo
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Slide Components
interface SlideProps {
  isDark: boolean;
  isNeon: boolean;
  accentColor: string;
  textPrimary: string;
  textSecondary: string;
}

function SlideOne({ isDark, isNeon, accentColor, textPrimary, textSecondary }: SlideProps) {
  const problemBg = isNeon
    ? 'bg-red-900/30 border-red-500/30'
    : isDark
    ? 'bg-red-900/20 border-red-500/30'
    : 'bg-red-50 border-red-200';

  const statBg = isNeon
    ? 'bg-purple-800/30 border-fuchsia-500/20'
    : isDark
    ? 'bg-gray-800/50 border-gray-700/50'
    : 'bg-gray-50 border-gray-200';

  return (
    <div className="space-y-8">
      {/* Problem Statement */}
      <div>
        <h3 className={`text-lg font-semibold ${textPrimary} mb-4`}>
          Every day, thousands of high-intent conversations happen online:
        </h3>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            '"My partner and I keep fighting about the same things..."',
            '"Looking for an app that helps with emotional awareness..."',
            '"Anyone know a good couples communication tool?"',
          ].map((quote, i) => (
            <div
              key={i}
              className={`${statBg} border rounded-xl p-4 text-center`}
            >
              <MessageSquare className={`w-8 h-8 ${accentColor} mx-auto mb-2`} />
              <p className={`text-sm italic ${textSecondary}`}>{quote}</p>
            </div>
          ))}
        </div>
      </div>

      {/* The Challenges */}
      <div className={`${problemBg} border rounded-xl p-6`}>
        <h3 className={`text-lg font-semibold ${textPrimary} mb-4 flex items-center gap-2`}>
          <AlertTriangle className="w-5 h-5 text-red-500" />
          The Challenge
        </h3>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { icon: Globe, title: 'Discovery is impossible at scale', desc: 'Relevant conversations scattered across Reddit, Quora, Twitter, HackerNews' },
            { icon: Clock, title: 'Manual monitoring doesn\'t scale', desc: 'A human can monitor ~50-100 posts/day; 10,000+ conversations happening' },
            { icon: Target, title: 'Generic responses get ignored', desc: 'Copy-paste marketing responses are spotted instantly and downvoted' },
            { icon: Shield, title: 'Risk of brand damage', desc: 'One overly promotional response can get your brand banned' },
          ].map((item, i) => (
            <div key={i} className="flex gap-3">
              <item.icon className={`w-5 h-5 ${accentColor} flex-shrink-0 mt-0.5`} />
              <div>
                <p className={`font-medium ${textPrimary}`}>{item.title}</p>
                <p className={`text-sm ${textSecondary}`}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Market Reality */}
      <div>
        <h3 className={`text-lg font-semibold ${textPrimary} mb-4`}>Market Reality</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { stat: '78%', label: 'of consumers trust peer recommendations over ads' },
            { stat: '52M', label: 'daily active Reddit users seeking advice' },
            { stat: '$10K+', label: '/month spent on community managers covering fraction of conversations' },
          ].map((item, i) => (
            <div key={i} className={`${statBg} border rounded-xl p-4 text-center`}>
              <p className={`text-3xl font-bold ${accentColor}`}>{item.stat}</p>
              <p className={`text-sm ${textSecondary} mt-1`}>{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SlideTwo({ isDark, isNeon, accentColor, textPrimary, textSecondary }: SlideProps) {
  const cardBg = isNeon
    ? 'bg-purple-800/30 border-fuchsia-500/20'
    : isDark
    ? 'bg-gray-800/50 border-gray-700/50'
    : 'bg-white/80 border-gray-200';

  const pillars = [
    {
      icon: MessageSquare,
      name: 'Communicate',
      what: 'AI detects high-intent conversations',
      how: 'Signal detection + risk scoring prevents brand damage',
      color: isNeon ? 'text-fuchsia-400' : isDark ? 'text-cyan-400' : 'text-cyan-600',
      bg: isNeon ? 'bg-fuchsia-500/20' : isDark ? 'bg-cyan-500/20' : 'bg-cyan-100',
    },
    {
      icon: Users,
      name: 'Connect',
      what: 'Generates authentic, helpful responses',
      how: '3 response variants with smart CTA controls (0-3 levels)',
      color: isNeon ? 'text-violet-400' : isDark ? 'text-purple-400' : 'text-pink-600',
      bg: isNeon ? 'bg-violet-500/20' : isDark ? 'bg-purple-500/20' : 'bg-pink-100',
    },
    {
      icon: Zap,
      name: 'Community',
      what: 'Clusters recurring issues',
      how: 'Identifies trending pain points for product insights',
      color: isNeon ? 'text-lime-400' : isDark ? 'text-blue-400' : 'text-orange-600',
      bg: isNeon ? 'bg-lime-500/20' : isDark ? 'bg-blue-500/20' : 'bg-orange-100',
    },
  ];

  const differentiators = [
    { icon: Shield, text: 'Risk-aware - Each response gets a risk score (low/medium/high/blocked)' },
    { icon: TrendingUp, text: 'Confidence-to-Send (CTS) score - 0-1 score determines auto-post eligibility' },
    { icon: Database, text: 'Multi-tenant - One platform serves multiple brands/products' },
    { icon: BarChart3, text: 'Full audit trail - Every action logged for compliance' },
  ];

  return (
    <div className="space-y-8">
      {/* The 3Cs Framework */}
      <div>
        <h3 className={`text-lg font-semibold ${textPrimary} mb-4`}>The 3Cs Framework</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          {pillars.map((pillar, i) => (
            <div key={i} className={`${cardBg} border rounded-xl p-5`}>
              <div className={`${pillar.bg} w-12 h-12 rounded-xl flex items-center justify-center mb-3`}>
                <pillar.icon className={`w-6 h-6 ${pillar.color}`} />
              </div>
              <h4 className={`font-bold text-lg ${pillar.color} mb-2`}>{pillar.name}</h4>
              <p className={`font-medium ${textPrimary} text-sm mb-1`}>{pillar.what}</p>
              <p className={`text-sm ${textSecondary}`}>{pillar.how}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Phase 1 Workflow */}
      <div className={`${cardBg} border rounded-xl p-6`}>
        <h3 className={`text-lg font-semibold ${textPrimary} mb-4`}>Phase 1 Workflow (Human-in-the-Loop)</h3>
        <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
          {['SerpAPI finds posts', 'AI analyzes intent', 'AI generates response', 'Human reviews', 'Human posts manually'].map((step, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className={`${cardBg} border px-3 py-1.5 rounded-lg ${textPrimary} font-medium`}>
                {step}
              </span>
              {i < 4 && <ArrowRight className={`w-4 h-4 ${accentColor}`} />}
            </div>
          ))}
        </div>
      </div>

      {/* Key Differentiators */}
      <div>
        <h3 className={`text-lg font-semibold ${textPrimary} mb-4`}>Key Differentiators</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          {differentiators.map((item, i) => (
            <div key={i} className="flex gap-3">
              <item.icon className={`w-5 h-5 ${accentColor} flex-shrink-0 mt-0.5`} />
              <p className={`text-sm ${textSecondary}`}>{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SlideThree({ isDark, isNeon, accentColor, textPrimary, textSecondary }: SlideProps) {
  const cardBg = isNeon
    ? 'bg-purple-800/30 border-fuchsia-500/20'
    : isDark
    ? 'bg-gray-800/50 border-gray-700/50'
    : 'bg-gray-50 border-gray-200';

  const codeBg = isNeon
    ? 'bg-gray-950 border-fuchsia-500/30'
    : isDark
    ? 'bg-gray-950 border-gray-700'
    : 'bg-gray-900 border-gray-700';

  const skills = [
    { name: 'Signal Detection', desc: 'Identifies pain points, keywords, emotional intensity' },
    { name: 'Risk Scoring', desc: 'low/medium/high/blocked classification' },
    { name: 'Response Generation', desc: '3 variants (value-first, soft-CTA, contextual)' },
    { name: 'CTA Classifier', desc: 'Level 0 (none) to 3 (direct promotion)' },
    { name: 'CTS Decision', desc: 'Confidence score for auto-posting (Phase 2)' },
  ];

  const deployment = [
    { label: 'Web App', value: 'Vercel (reachby3cs.com)' },
    { label: 'Database', value: 'Supabase with Row-Level Security' },
    { label: 'Agent Service', value: 'Render (Python FastAPI)' },
    { label: 'First Tenant', value: 'WeAttuned (emotional intelligence app)' },
  ];

  return (
    <div className="space-y-6">
      {/* Architecture Diagram */}
      <div className={`${codeBg} border rounded-xl p-4 font-mono text-xs sm:text-sm overflow-x-auto`}>
        <pre className="text-green-400 whitespace-pre">
{`┌─────────────────────────────────────────────────────────────────┐
│                    REACHBY3CS ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐    ┌─────────────────┐    ┌─────────────┐     │
│  │  SerpAPI    │───▶│  Python Agent   │───▶│  Supabase   │     │
│  │  (Search)   │    │  (FastAPI +     │    │  (Postgres) │     │
│  │             │    │   LangGraph)    │    │             │     │
│  │ Google CSE  │    │                 │    │ • Posts     │     │
│  │ for Reddit, │    │ AI Skills:      │    │ • Signals   │     │
│  │ Quora, X,   │    │ • Signal Detect │    │ • Responses │     │
│  │ HN          │    │ • Risk Score    │    │ • Queue     │     │
│  └─────────────┘    │ • Response Gen  │    │ • Audit Log │     │
│                     │ • CTA Classify  │    └─────────────┘     │
│                     │ • CTS Decision  │           │             │
│                     └─────────────────┘           │             │
│                            │                      │             │
│                            ▼                      ▼             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              VERCEL (Next.js Web App)                     │  │
│  │  Dashboard → Queue (Approve/Reject) → Analytics           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            │                                    │
│                            ▼                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  HUMAN REVIEWER: Review → Approve → Copy → Paste & Post   │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘`}
        </pre>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* AI Pipeline */}
        <div className={`${cardBg} border rounded-xl p-5`}>
          <div className="flex items-center gap-2 mb-4">
            <Cpu className={`w-5 h-5 ${accentColor}`} />
            <h3 className={`font-semibold ${textPrimary}`}>AI Pipeline (5 Skills)</h3>
          </div>
          <div className="space-y-3">
            {skills.map((skill, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className={`${accentColor} font-bold text-sm`}>{i + 1}.</span>
                <div>
                  <span className={`font-medium ${textPrimary} text-sm`}>{skill.name}</span>
                  <span className={`${textSecondary} text-sm`}> - {skill.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Deployment */}
        <div className={`${cardBg} border rounded-xl p-5`}>
          <div className="flex items-center gap-2 mb-4">
            <Globe className={`w-5 h-5 ${accentColor}`} />
            <h3 className={`font-semibold ${textPrimary}`}>Deployment</h3>
          </div>
          <div className="space-y-3">
            {deployment.map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <CheckCircle2 className={`w-4 h-4 ${accentColor} mt-0.5 flex-shrink-0`} />
                <div>
                  <span className={`font-medium ${textPrimary} text-sm`}>{item.label}:</span>
                  <span className={`${textSecondary} text-sm`}> {item.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SlideFour({ isDark, isNeon, accentColor, textPrimary, textSecondary }: SlideProps) {
  const cardBg = isNeon
    ? 'bg-purple-800/30 border-fuchsia-500/20'
    : isDark
    ? 'bg-gray-800/50 border-gray-700/50'
    : 'bg-white/80 border-gray-200';

  const highlightBg = isNeon
    ? 'bg-fuchsia-500/20 border-fuchsia-500/30'
    : isDark
    ? 'bg-cyan-500/20 border-cyan-500/30'
    : 'bg-cyan-50 border-cyan-200';

  const plans = [
    {
      name: 'Starter',
      price: '$49',
      responses: '500',
      detections: '1,000',
      target: 'Solo founders, small startups',
      highlight: false,
    },
    {
      name: 'Professional',
      price: '$149',
      responses: '2,500',
      detections: '10,000',
      target: 'Growing SaaS, marketing teams',
      highlight: true,
    },
    {
      name: 'Enterprise',
      price: '$399',
      responses: '10,000',
      detections: '50,000',
      target: 'Large brands, agencies',
      highlight: false,
    },
  ];

  const projections = [
    { year: 'Y1', customers: '50', mrr: '$7,500', arr: '$90K' },
    { year: 'Y2', customers: '250', mrr: '$37,500', arr: '$450K' },
    { year: 'Y3', customers: '1,000', mrr: '$150,000', arr: '$1.8M' },
  ];

  const unitEconomics = [
    { label: 'SerpAPI cost', value: '~$0.005/search' },
    { label: 'OpenAI GPT-4 cost', value: '~$0.02/response' },
    { label: 'Gross margin at scale', value: '70-80%' },
  ];

  return (
    <div className="space-y-6">
      {/* Pricing Table */}
      <div>
        <h3 className={`text-lg font-semibold ${textPrimary} mb-4`}>3-Tier Pricing Model</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          {plans.map((plan, i) => (
            <div
              key={i}
              className={`${plan.highlight ? highlightBg : cardBg} border rounded-xl p-4 ${plan.highlight ? 'ring-2 ring-offset-2 ' + (isNeon ? 'ring-fuchsia-500' : isDark ? 'ring-cyan-500' : 'ring-cyan-500') : ''}`}
            >
              {plan.highlight && (
                <span className={`text-xs font-semibold ${accentColor} uppercase tracking-wide`}>
                  Most Popular
                </span>
              )}
              <h4 className={`font-bold text-lg ${textPrimary} ${plan.highlight ? '' : 'mt-5'}`}>{plan.name}</h4>
              <p className={`text-2xl font-bold ${accentColor} mt-1`}>{plan.price}<span className={`text-sm font-normal ${textSecondary}`}>/mo</span></p>
              <div className={`mt-3 pt-3 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} space-y-1 text-sm`}>
                <p className={textSecondary}>{plan.responses} responses/mo</p>
                <p className={textSecondary}>{plan.detections} detections/mo</p>
                <p className={`${textPrimary} font-medium mt-2`}>{plan.target}</p>
              </div>
            </div>
          ))}
        </div>
        <p className={`text-sm ${textSecondary} mt-3`}>
          Overage rates: $0.05/response, $0.01/detection
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Unit Economics */}
        <div className={`${cardBg} border rounded-xl p-5`}>
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className={`w-5 h-5 ${accentColor}`} />
            <h3 className={`font-semibold ${textPrimary}`}>Unit Economics</h3>
          </div>
          <div className="space-y-2">
            {unitEconomics.map((item, i) => (
              <div key={i} className="flex justify-between">
                <span className={`text-sm ${textSecondary}`}>{item.label}</span>
                <span className={`text-sm font-medium ${i === 2 ? accentColor : textPrimary}`}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue Projections */}
        <div className={`${cardBg} border rounded-xl p-5`}>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className={`w-5 h-5 ${accentColor}`} />
            <h3 className={`font-semibold ${textPrimary}`}>Revenue Projections</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={textSecondary}>
                  <th className="text-left pb-2">Year</th>
                  <th className="text-center pb-2">Customers</th>
                  <th className="text-center pb-2">MRR</th>
                  <th className="text-right pb-2">ARR</th>
                </tr>
              </thead>
              <tbody>
                {projections.map((row, i) => (
                  <tr key={i} className={`border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                    <td className={`py-2 font-medium ${textPrimary}`}>{row.year}</td>
                    <td className={`py-2 text-center ${textSecondary}`}>{row.customers}</td>
                    <td className={`py-2 text-center ${textSecondary}`}>{row.mrr}</td>
                    <td className={`py-2 text-right font-semibold ${accentColor}`}>{row.arr}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Closing Statement */}
      <div className={`${highlightBg} border rounded-xl p-5 text-center`}>
        <p className={`text-lg ${textPrimary} italic`}>
          &ldquo;ReachBy3Cs turns the chaos of online conversations into organized community engagement.
          We find the needles in the haystack, help you respond authentically, and prevent brand damage.&rdquo;
        </p>
        <div className="flex flex-wrap justify-center gap-4 mt-4">
          <Link
            href="/"
            className={`inline-flex items-center gap-2 ${isNeon ? 'bg-fuchsia-500 hover:bg-fuchsia-600' : 'bg-cyan-500 hover:bg-cyan-600'} text-white px-4 py-2 rounded-lg text-sm font-medium transition`}
          >
            Live Demo at reachby3cs.com
            <ExternalLink className="w-4 h-4" />
          </Link>
          <span className={`text-sm ${textSecondary} self-center`}>
            First 3 customers get 50% off for 6 months
          </span>
        </div>
      </div>
    </div>
  );
}

export default function PitchPage() {
  return (
    <ThemeProvider>
      <PitchContent />
    </ThemeProvider>
  );
}
