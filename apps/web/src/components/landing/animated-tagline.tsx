'use client';

import { useEffect, useState } from 'react';
import { useTheme, ThemeName } from '@/contexts/theme-context';

const getThemeWords = (theme: ThemeName) => {
  switch (theme) {
    case 'neon':
      return [
        { text: 'Communicate', color: 'text-fuchsia-400 neon-text' },
        { text: 'Connect', color: 'text-violet-400 neon-text' },
        { text: 'Community', color: 'text-lime-400 neon-text' },
      ];
    case 'dark':
      return [
        { text: 'Communicate', color: 'text-cyan-400' },
        { text: 'Connect', color: 'text-purple-400' },
        { text: 'Community', color: 'text-blue-400' },
      ];
    case 'earthy':
      return [
        { text: 'Communicate', color: 'text-amber-600' },
        { text: 'Connect', color: 'text-orange-600' },
        { text: 'Community', color: 'text-yellow-600' },
      ];
    case 'calm':
      return [
        { text: 'Communicate', color: 'text-teal-600' },
        { text: 'Connect', color: 'text-emerald-600' },
        { text: 'Community', color: 'text-sky-600' },
      ];
    default:
      return [
        { text: 'Communicate', color: 'text-cyan-500' },
        { text: 'Connect', color: 'text-pink-500' },
        { text: 'Community', color: 'text-orange-500' },
      ];
  }
};

export function AnimatedTagline() {
  const { theme, colors } = useTheme();
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const words = getThemeWords(theme);
  const isNeon = theme === 'neon';

  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  if (prefersReducedMotion) {
    // Static version for reduced motion
    const word0 = words[0] ?? { text: 'Communicate', color: 'text-cyan-500' };

    return (
      <div className="text-center px-4">
        <h1 className={`text-4xl sm:text-5xl md:text-6xl font-bold ${colors.text} mb-4`}>
          <span className={word0.color}>{word0.text}</span>
        </h1>
        <p className={`text-xl sm:text-2xl ${colors.textMuted}`}>
          to match the needs of people seeking your solution
        </p>
      </div>
    );
  }

  return (
    <div className="text-center px-4">
      <h1 className={`text-4xl sm:text-5xl md:text-6xl font-bold ${colors.text} mb-4`}>
        <span className="inline-block h-[1.2em] overflow-hidden align-bottom">
          <span className="flex flex-col animate-text-rotate">
            {words.map((word) => (
              <span
                key={word.text}
                className={`block h-[1.2em] ${word.color} ${isNeon ? 'font-extrabold' : ''}`}
              >
                {word.text}
              </span>
            ))}
          </span>
        </span>
      </h1>
      <p className={`text-xl sm:text-2xl ${colors.textMuted}`}>
        to match the needs of people seeking your solution
      </p>
    </div>
  );
}
