'use client';

import { useState, useEffect, useRef } from 'react';
import { Sun, Moon, Laptop, Check } from 'lucide-react';
import {
  getSavedTheme,
  setThemeMode,
  THEME_MODES,
  applyThemeToDocument,
} from '@/lib/theme';

export default function ThemeToggle() {
  const [mode, setMode] = useState(THEME_MODES.SYSTEM);
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Sync state after mount & register live OS theme change listener
  useEffect(() => {
    const currentMode = getSavedTheme();
    setMode(currentMode);
    applyThemeToDocument(currentMode);
    setMounted(true);

    // Listen to OS system color scheme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = () => {
      const activeMode = getSavedTheme();
      if (activeMode === THEME_MODES.SYSTEM) {
        applyThemeToDocument(THEME_MODES.SYSTEM);
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemChange);
    } else {
      mediaQuery.addListener(handleSystemChange);
    }

    // Listen to custom theme change events across components
    const handleCustomChange = (e) => {
      if (e.detail?.mode) {
        setMode(e.detail.mode);
      }
    };
    window.addEventListener('mangaverse_theme_change', handleCustomChange);

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleSystemChange);
      } else {
        mediaQuery.removeListener(handleSystemChange);
      }
      window.removeEventListener('mangaverse_theme_change', handleCustomChange);
    };
  }, []);

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const selectMode = (newMode) => {
    // Add temporary transition class for smooth visual fade
    document.documentElement.classList.add('theme-transitioning');
    setThemeMode(newMode);
    setMode(newMode);
    setIsOpen(false);

    setTimeout(() => {
      document.documentElement.classList.remove('theme-transitioning');
    }, 250);
  };

  // Render placeholder before mount to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-lg border border-transparent" aria-hidden="true" />
    );
  }

  const modeLabels = {
    [THEME_MODES.LIGHT]: 'Light',
    [THEME_MODES.DARK]: 'Dark',
    [THEME_MODES.SYSTEM]: 'System',
  };

  const getActiveIcon = () => {
    if (mode === THEME_MODES.LIGHT) return <Sun className="w-4 h-4" aria-hidden="true" />;
    if (mode === THEME_MODES.DARK) return <Moon className="w-4 h-4" aria-hidden="true" />;
    return <Laptop className="w-4 h-4" aria-hidden="true" />;
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 p-2 rounded-lg text-text-muted hover:text-text-main hover:bg-surface-hover border border-subtle focus-visible:ring-2 focus-visible:ring-accent-brand transition-colors"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Current theme: ${modeLabels[mode]}. Click to change theme`}
        title={`Theme: ${modeLabels[mode]}`}
      >
        {getActiveIcon()}
        <span className="text-xs font-medium hidden sm:inline">{modeLabels[mode]}</span>
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label="Theme options"
          className="absolute right-0 mt-2 w-36 rounded-xl bg-surface border border-subtle shadow-xl py-1 z-50 focus:outline-none backdrop-blur-md"
        >
          <button
            type="button"
            role="option"
            aria-selected={mode === THEME_MODES.LIGHT}
            onClick={() => selectMode(THEME_MODES.LIGHT)}
            className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium transition-colors ${
              mode === THEME_MODES.LIGHT
                ? 'bg-surface-hover text-accent-brand font-semibold'
                : 'text-text-muted hover:text-text-main hover:bg-surface-hover'
            }`}
          >
            <span className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-500" aria-hidden="true" />
              Light
            </span>
            {mode === THEME_MODES.LIGHT && <Check className="w-3.5 h-3.5 text-accent-brand" aria-hidden="true" />}
          </button>

          <button
            type="button"
            role="option"
            aria-selected={mode === THEME_MODES.DARK}
            onClick={() => selectMode(THEME_MODES.DARK)}
            className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium transition-colors ${
              mode === THEME_MODES.DARK
                ? 'bg-surface-hover text-accent-brand font-semibold'
                : 'text-text-muted hover:text-text-main hover:bg-surface-hover'
            }`}
          >
            <span className="flex items-center gap-2">
              <Moon className="w-4 h-4 text-blue-400" aria-hidden="true" />
              Dark
            </span>
            {mode === THEME_MODES.DARK && <Check className="w-3.5 h-3.5 text-accent-brand" aria-hidden="true" />}
          </button>

          <button
            type="button"
            role="option"
            aria-selected={mode === THEME_MODES.SYSTEM}
            onClick={() => selectMode(THEME_MODES.SYSTEM)}
            className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium transition-colors ${
              mode === THEME_MODES.SYSTEM
                ? 'bg-surface-hover text-accent-brand font-semibold'
                : 'text-text-muted hover:text-text-main hover:bg-surface-hover'
            }`}
          >
            <span className="flex items-center gap-2">
              <Laptop className="w-4 h-4 text-text-muted" aria-hidden="true" />
              System
            </span>
            {mode === THEME_MODES.SYSTEM && <Check className="w-3.5 h-3.5 text-accent-brand" aria-hidden="true" />}
          </button>
        </div>
      )}
    </div>
  );
}
