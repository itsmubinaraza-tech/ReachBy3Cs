'use client';

import { useEffect, useState } from 'react';

const words = [
  { text: 'Communicate', color: 'text-blue-600' },
  { text: 'Connect', color: 'text-purple-600' },
  { text: 'Community', color: 'text-indigo-600' },
];

export function AnimatedTagline() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

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
    return (
      <div className="text-center">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-4">
          <span className="text-blue-600">Communicate.</span>{' '}
          <span className="text-purple-600">Connect.</span>{' '}
          <span className="text-indigo-600">Community.</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          To match the needs of people seeking your solution
        </p>
      </div>
    );
  }

  return (
    <div className="text-center">
      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-4">
        <span className="inline-block h-[1.2em] overflow-hidden align-bottom">
          <span className="flex flex-col animate-text-rotate">
            {words.map((word) => (
              <span
                key={word.text}
                className={`block h-[1.2em] ${word.color}`}
              >
                {word.text}.
              </span>
            ))}
          </span>
        </span>
      </h1>
      <p className="text-xl text-gray-600 max-w-2xl mx-auto">
        To match the needs of people seeking your solution
      </p>
    </div>
  );
}
