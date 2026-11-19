import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  THEME_MODES,
  resolveEffectiveTheme,
  getSavedTheme,
  setThemeMode,
  THEME_STORAGE_KEY,
  themeInitScript,
} from '../src/lib/theme.js';

describe('Theme Logic & Persistence', () => {
  let mockStorage = {};

  beforeEach(() => {
    mockStorage = {};
    globalThis.window = {
      localStorage: {
        getItem: vi.fn((k) => mockStorage[k] || null),
        setItem: vi.fn((k, v) => {
          mockStorage[k] = v;
        }),
        removeItem: vi.fn((k) => {
          delete mockStorage[k];
        }),
      },
      matchMedia: vi.fn((q) => ({
        matches: q.includes('dark'),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
      dispatchEvent: vi.fn(),
    };
    globalThis.document = {
      documentElement: {
        setAttribute: vi.fn(),
        style: {},
        classList: {
          add: vi.fn(),
          remove: vi.fn(),
        },
      },
    };
  });

  afterEach(() => {
    delete globalThis.window;
    delete globalThis.document;
    vi.restoreAllMocks();
  });

  it('should resolve explicit light and dark themes correctly', () => {
    expect(resolveEffectiveTheme(THEME_MODES.LIGHT)).toBe('light');
    expect(resolveEffectiveTheme(THEME_MODES.DARK)).toBe('dark');
  });

  it('should resolve system theme based on matchMedia', () => {
    globalThis.window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query.includes('dark'),
    }));
    expect(resolveEffectiveTheme(THEME_MODES.SYSTEM)).toBe('dark');

    globalThis.window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: false,
    }));
    expect(resolveEffectiveTheme(THEME_MODES.SYSTEM)).toBe('light');
  });

  it('should fallback to system when localStorage is unavailable or corrupt', () => {
    globalThis.window.localStorage.removeItem(THEME_STORAGE_KEY);
    expect(getSavedTheme()).toBe(THEME_MODES.SYSTEM);

    mockStorage[THEME_STORAGE_KEY] = 'invalid_theme';
    expect(getSavedTheme()).toBe(THEME_MODES.SYSTEM);
  });

  it('should persist valid theme modes to localStorage', () => {
    setThemeMode(THEME_MODES.LIGHT);
    expect(mockStorage[THEME_STORAGE_KEY]).toBe(THEME_MODES.LIGHT);

    setThemeMode(THEME_MODES.DARK);
    expect(mockStorage[THEME_STORAGE_KEY]).toBe(THEME_MODES.DARK);

    setThemeMode(THEME_MODES.SYSTEM);
    expect(mockStorage[THEME_STORAGE_KEY]).toBe(THEME_MODES.SYSTEM);
  });

  it('themeInitScript should contain critical anti-FOUC checks', () => {
    expect(themeInitScript).toContain(THEME_STORAGE_KEY);
    expect(themeInitScript).toContain('data-theme');
    expect(themeInitScript).toContain('colorScheme');
    expect(themeInitScript).toContain('prefers-color-scheme');
  });
});
