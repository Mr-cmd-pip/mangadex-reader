/**
 * Theme Management Utilities (Light, Dark, System)
 * Strictly client-side safe with robust fallback & media query listening
 */

export const THEME_STORAGE_KEY = 'mangaverse_theme';

export const THEME_MODES = {
  SYSTEM: 'system',
  LIGHT: 'light',
  DARK: 'dark',
};

/**
 * Gets saved theme setting from localStorage (or 'system' default)
 */
export function getSavedTheme() {
  if (typeof window === 'undefined') return THEME_MODES.SYSTEM;
  try {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === THEME_MODES.LIGHT || saved === THEME_MODES.DARK || saved === THEME_MODES.SYSTEM) {
      return saved;
    }
  } catch (err) {
    console.warn('[Theme Storage Read Error]', err);
  }
  return THEME_MODES.SYSTEM;
}

/**
 * Resolves the effective theme ('light' or 'dark') given a mode
 */
export function resolveEffectiveTheme(mode) {
  if (mode === THEME_MODES.LIGHT) return 'light';
  if (mode === THEME_MODES.DARK) return 'dark';
  // System mode
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'dark'; // safe default
}

/**
 * Applies the effective theme to document.documentElement
 */
export function applyThemeToDocument(mode) {
  if (typeof document === 'undefined') return;
  const effective = resolveEffectiveTheme(mode);
  const root = document.documentElement;

  root.setAttribute('data-theme', effective);
  root.style.colorScheme = effective;
}

/**
 * Saves theme setting and updates DOM
 */
export function setThemeMode(mode) {
  if (typeof window === 'undefined') return;
  const validMode =
    mode === THEME_MODES.LIGHT || mode === THEME_MODES.DARK ? mode : THEME_MODES.SYSTEM;

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, validMode);
  } catch (err) {
    console.warn('[Theme Storage Write Error]', err);
  }

  applyThemeToDocument(validMode);
  window.dispatchEvent(new CustomEvent('mangaverse_theme_change', { detail: { mode: validMode } }));
}

/**
 * Small inline script to be injected into <head> for zero-FOUC initialization
 */
export const themeInitScript = `(function() {
  try {
    var key = '${THEME_STORAGE_KEY}';
    var saved = localStorage.getItem(key);
    var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = 'dark';
    if (saved === 'light') {
      theme = 'light';
    } else if (saved === 'dark') {
      theme = 'dark';
    } else {
      theme = prefersDark ? 'dark' : 'light';
    }
    var root = document.documentElement;
    root.setAttribute('data-theme', theme);
    root.style.colorScheme = theme;
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.style.colorScheme = 'dark';
  }
})();`;
