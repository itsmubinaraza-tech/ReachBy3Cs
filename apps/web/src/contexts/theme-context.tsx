'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ThemeName = 'logo' | 'dark' | 'earthy' | 'calm' | 'neon';

interface ThemeColors {
  name: string;
  description: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  glass: string;
  glassBorder: string;
  text: string;
  textMuted: string;
  gradient: string;
  buttonGradient: string;
  buttonShadow: string;
  inputBg: string;
  inputBorder: string;
  inputFocus: string;
  cardGlow: string;
}

export const themes: Record<ThemeName, ThemeColors> = {
  logo: {
    name: 'Vibrant',
    description: 'Cyan, Pink & Orange',
    primary: 'cyan',
    secondary: 'pink',
    accent: 'orange',
    background: 'from-slate-50 to-white',
    glass: 'bg-white/25',
    glassBorder: 'border-white/30',
    text: 'text-gray-800',
    textMuted: 'text-gray-600',
    gradient: 'gradient-mesh-logo',
    buttonGradient: 'from-cyan-500 to-cyan-600',
    buttonShadow: 'shadow-cyan-500/30',
    inputBg: 'bg-white/50',
    inputBorder: 'border-white/40',
    inputFocus: 'focus:ring-cyan-400 focus:border-cyan-400',
    cardGlow: '',
  },
  dark: {
    name: 'Dark',
    description: 'Sleek & Modern',
    primary: 'cyan',
    secondary: 'purple',
    accent: 'blue',
    background: 'from-gray-950 to-gray-900',
    glass: 'bg-white/10',
    glassBorder: 'border-white/10',
    text: 'text-white',
    textMuted: 'text-gray-400',
    gradient: 'gradient-mesh-dark',
    buttonGradient: 'from-cyan-500 to-purple-600',
    buttonShadow: 'shadow-cyan-500/40',
    inputBg: 'bg-white/10',
    inputBorder: 'border-white/20',
    inputFocus: 'focus:ring-cyan-400 focus:border-cyan-400',
    cardGlow: '',
  },
  earthy: {
    name: 'Earthy',
    description: 'Warm & Natural',
    primary: 'amber',
    secondary: 'orange',
    accent: 'yellow',
    background: 'from-amber-50 to-orange-50',
    glass: 'bg-amber-100/40',
    glassBorder: 'border-amber-200/50',
    text: 'text-amber-900',
    textMuted: 'text-amber-700',
    gradient: 'gradient-mesh-earthy',
    buttonGradient: 'from-amber-500 to-orange-500',
    buttonShadow: 'shadow-amber-500/30',
    inputBg: 'bg-white/60',
    inputBorder: 'border-amber-200/50',
    inputFocus: 'focus:ring-amber-400 focus:border-amber-400',
    cardGlow: '',
  },
  calm: {
    name: 'Calm',
    description: 'Soothing & Serene',
    primary: 'teal',
    secondary: 'emerald',
    accent: 'sky',
    background: 'from-teal-50 to-emerald-50',
    glass: 'bg-teal-100/30',
    glassBorder: 'border-teal-200/40',
    text: 'text-teal-900',
    textMuted: 'text-teal-700',
    gradient: 'gradient-mesh-calm',
    buttonGradient: 'from-teal-500 to-emerald-500',
    buttonShadow: 'shadow-teal-500/30',
    inputBg: 'bg-white/60',
    inputBorder: 'border-teal-200/40',
    inputFocus: 'focus:ring-teal-400 focus:border-teal-400',
    cardGlow: '',
  },
  neon: {
    name: 'Neon',
    description: 'Electric & Bold',
    primary: 'fuchsia',
    secondary: 'violet',
    accent: 'lime',
    background: 'from-gray-950 via-purple-950 to-gray-950',
    glass: 'bg-purple-500/10',
    glassBorder: 'border-fuchsia-500/30',
    text: 'text-white',
    textMuted: 'text-purple-200',
    gradient: 'gradient-mesh-neon',
    buttonGradient: 'from-fuchsia-500 via-purple-500 to-violet-500',
    buttonShadow: 'shadow-fuchsia-500/50',
    inputBg: 'bg-purple-900/30',
    inputBorder: 'border-fuchsia-500/40',
    inputFocus: 'focus:ring-fuchsia-400 focus:border-fuchsia-400',
    cardGlow: 'neon-glow',
  },
};

interface ThemeContextValue {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>('logo');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('reachby3cs-theme') as ThemeName | null;
    if (saved && themes[saved]) {
      setThemeState(saved);
    }
  }, []);

  const setTheme = (newTheme: ThemeName) => {
    setThemeState(newTheme);
    localStorage.setItem('reachby3cs-theme', newTheme);
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, colors: themes[theme] }}>
      <div data-theme={theme} className="contents">
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    // Return safe defaults when context is not available (SSR/build)
    // This prevents build errors when useTheme is called outside ThemeProvider
    return {
      theme: 'logo' as ThemeName,
      colors: themes.logo,
      setTheme: () => {},
    };
  }
  return context;
}
