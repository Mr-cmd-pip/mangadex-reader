/**
 * LocalStorage utilities for Library, Reading History, and User Preferences
 */

const STORAGE_KEYS = {
  BOOKMARKS: 'mangaverse_bookmarks',
  HISTORY: 'mangaverse_history',
  PREFS: 'mangaverse_preferences',
};

const DEFAULT_PREFERENCES = {
  theme: 'dark',
  readingMode: 'webtoon', // 'webtoon' | 'paged-rtl' | 'paged-ltr'
  dataSaver: false,
  allowMature: false, // opt-in erotica (never pornographic)
};

function safeGet(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (err) {
    console.warn(`[Storage Get Error: ${key}]`, err);
    return fallback;
  }
}

function safeSet(key, value) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`[Storage Set Error: ${key}]`, err);
  }
}

// === BOOKMARKS ===
export function getBookmarks() {
  return safeGet(STORAGE_KEYS.BOOKMARKS, []);
}

export function isBookmarked(mangaId) {
  if (!mangaId) return false;
  const bookmarks = getBookmarks();
  return bookmarks.some((b) => b.id === mangaId);
}

export function toggleBookmark(manga) {
  if (!manga || !manga.id) return false;
  const bookmarks = getBookmarks();
  const index = bookmarks.findIndex((b) => b.id === manga.id);

  let updated;
  let currentlyBookmarked = false;

  if (index >= 0) {
    updated = bookmarks.filter((b) => b.id !== manga.id);
  } else {
    updated = [
      {
        id: manga.id,
        title: manga.title,
        coverFileName: manga.coverFileName,
        savedAt: Date.now(),
      },
      ...bookmarks,
    ];
    currentlyBookmarked = true;
  }

  safeSet(STORAGE_KEYS.BOOKMARKS, updated);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('mangaverse_storage_change'));
  }
  return currentlyBookmarked;
}

// === READING HISTORY ===
export function getReadingHistory() {
  return safeGet(STORAGE_KEYS.HISTORY, []);
}

export function getChapterProgress(chapterId) {
  const history = getReadingHistory();
  return history.find((h) => h.chapterId === chapterId);
}

export function recordReadingProgress({
  mangaId,
  mangaTitle,
  coverFileName,
  chapterId,
  chapterNumber,
  chapterTitle,
  pageIndex = 0,
  totalPages = 1,
}) {
  if (!mangaId || !chapterId) return;
  const history = getReadingHistory();
  const filtered = history.filter((h) => h.chapterId !== chapterId);

  const updatedEntry = {
    mangaId,
    mangaTitle,
    coverFileName,
    chapterId,
    chapterNumber,
    chapterTitle,
    pageIndex,
    totalPages,
    updatedAt: Date.now(),
  };

  const updated = [updatedEntry, ...filtered].slice(0, 50); // keep last 50
  safeSet(STORAGE_KEYS.HISTORY, updated);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('mangaverse_storage_change'));
  }
}

export function clearReadingHistory() {
  safeSet(STORAGE_KEYS.HISTORY, []);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('mangaverse_storage_change'));
  }
}

// === USER PREFERENCES ===
export function getPreferences() {
  return { ...DEFAULT_PREFERENCES, ...safeGet(STORAGE_KEYS.PREFS, {}) };
}

export function updatePreference(key, value) {
  const current = getPreferences();
  const updated = { ...current, [key]: value };
  safeSet(STORAGE_KEYS.PREFS, updated);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('mangaverse_prefs_change'));
  }
  return updated;
}
