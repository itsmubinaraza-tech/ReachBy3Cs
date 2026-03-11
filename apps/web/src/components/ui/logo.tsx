'use client';

import Image from 'next/image';
import { useTheme, themes } from '@/contexts/theme-context';

export type LogoSize = 'sm' | 'md' | 'lg' | 'xl';
export type LogoVariant = 'full' | 'icon';

interface LogoProps {
  size?: LogoSize;
  variant?: LogoVariant;
  className?: string;
  showText?: boolean;
}

// Height-based sizing for icon logo
const sizeConfig: Record<LogoSize, { height: number; width: number }> = {
  sm: { height: 28, width: 28 },
  md: { height: 36, width: 36 },
  lg: { height: 44, width: 44 },
  xl: { height: 52, width: 52 },
};

// Tailwind classes for responsive sizing
const responsiveHeightClasses: Record<LogoSize, string> = {
  sm: 'h-7',
  md: 'h-9',
  lg: 'h-11',
  xl: 'h-[52px]',
};

// Text size classes
const textSizeClasses: Record<LogoSize, string> = {
  sm: 'text-base',
  md: 'text-lg',
  lg: 'text-xl',
  xl: 'text-2xl',
};

export function Logo({ size = 'md', variant = 'full', className = '', showText = true }: LogoProps) {
  // Use SSR-safe theme hook
  const themeContext = useThemeSafe();
  const theme = themeContext.theme;
  const isDark = theme === 'dark' || theme === 'neon';

  const heightClass = responsiveHeightClasses[size];
  const textClass = textSizeClasses[size];
  const { width, height } = sizeConfig[size];

  // Text color based on theme
  const textColor = isDark ? 'text-white' : 'text-gray-800';
  const accentColor = theme === 'neon'
    ? 'text-fuchsia-400'
    : theme === 'dark'
    ? 'text-cyan-400'
    : theme === 'earthy'
    ? 'text-amber-600'
    : theme === 'calm'
    ? 'text-teal-600'
    : 'text-cyan-500';

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <div className={`relative ${heightClass} w-auto flex-shrink-0`}>
        <Image
          src="/3cs-logo.png"
          alt="ReachBy3Cs"
          width={width}
          height={height}
          className="h-full w-auto object-contain"
          priority
        />
      </div>
      {showText && (
        <span className={`font-bold ${textClass} ${textColor} tracking-tight leading-none`}>
          Reach<span className={accentColor}>By3Cs</span>
        </span>
      )}
    </div>
  );
}

// SSR-safe version of useTheme that returns defaults when context unavailable
function useThemeSafe() {
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useTheme();
  } catch {
    // Return safe defaults when context is not available (SSR/build)
    return {
      theme: 'logo' as const,
      colors: themes.logo,
      setTheme: () => {},
    };
  }
}

export { useThemeSafe };
