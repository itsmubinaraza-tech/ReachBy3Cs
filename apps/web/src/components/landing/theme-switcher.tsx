'use client';

import { useState } from 'react';
import { Palette, Check, Sparkles } from 'lucide-react';
import { useTheme, themes, ThemeName } from '@/contexts/theme-context';

const themePreviewColors: Record<ThemeName, string[]> = {
  logo: ['bg-cyan-500', 'bg-pink-500', 'bg-orange-500'],
  dark: ['bg-cyan-500', 'bg-purple-500', 'bg-blue-500'],
  earthy: ['bg-amber-500', 'bg-orange-500', 'bg-yellow-500'],
  calm: ['bg-teal-500', 'bg-emerald-500', 'bg-sky-500'],
  neon: ['bg-fuchsia-500', 'bg-violet-500', 'bg-lime-400'],
};

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const isDark = theme === 'dark' || theme === 'neon';

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded-xl transition-all ${
          theme === 'neon'
            ? 'bg-fuchsia-500/20 hover:bg-fuchsia-500/30 text-fuchsia-300'
            : isDark
            ? 'bg-white/10 hover:bg-white/20 text-white'
            : 'bg-white/50 hover:bg-white/70 text-gray-700'
        }`}
        aria-label="Change theme"
      >
        {theme === 'neon' ? (
          <Sparkles className="w-5 h-5" />
        ) : (
          <Palette className="w-5 h-5" />
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className={`absolute right-0 mt-2 w-56 rounded-2xl shadow-2xl z-50 p-2 ${
            theme === 'neon'
              ? 'bg-gray-950 border border-fuchsia-500/30 shadow-fuchsia-500/20'
              : isDark
              ? 'bg-gray-900 border border-white/10'
              : 'bg-white border border-gray-200'
          }`}>
            <div className={`px-3 py-2 text-xs font-medium ${
              theme === 'neon' ? 'text-fuchsia-300' : isDark ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Choose Theme
            </div>

            {(Object.keys(themes) as ThemeName[]).map((themeName) => {
              const themeData = themes[themeName];
              const isActive = theme === themeName;
              const isNeonOption = themeName === 'neon';

              return (
                <button
                  key={themeName}
                  onClick={() => {
                    setTheme(themeName);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                    isActive
                      ? theme === 'neon'
                        ? 'bg-fuchsia-500/20'
                        : isDark
                        ? 'bg-white/10'
                        : 'bg-gray-100'
                      : theme === 'neon'
                        ? 'hover:bg-fuchsia-500/10'
                        : isDark
                        ? 'hover:bg-white/5'
                        : 'hover:bg-gray-50'
                  }`}
                >
                  {/* Color Preview */}
                  <div className="flex -space-x-1">
                    {themePreviewColors[themeName].map((color, i) => (
                      <div
                        key={i}
                        className={`w-4 h-4 rounded-full ${color} ring-2 ${
                          isNeonOption ? 'ring-gray-950' : isDark ? 'ring-gray-900' : 'ring-white'
                        } ${isNeonOption && !isDark ? 'shadow-lg shadow-fuchsia-500/50' : ''}`}
                      />
                    ))}
                  </div>

                  {/* Theme Info */}
                  <div className="flex-1 text-left">
                    <div className={`text-sm font-medium flex items-center gap-1.5 ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                      {themeData.name}
                      {isNeonOption && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-500 text-white font-bold">
                          NEW
                        </span>
                      )}
                    </div>
                    <div className={`text-xs ${
                      theme === 'neon' ? 'text-purple-300' : isDark ? 'text-gray-500' : 'text-gray-500'
                    }`}>
                      {themeData.description}
                    </div>
                  </div>

                  {/* Check Mark */}
                  {isActive && (
                    <Check className={`w-4 h-4 ${
                      theme === 'neon' ? 'text-fuchsia-400' : isDark ? 'text-cyan-400' : 'text-cyan-600'
                    }`} />
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
