'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bookmark,
  Clock,
  Trash2,
  BookOpen,
  ArrowRight,
} from 'lucide-react';
import {
  getBookmarks,
  toggleBookmark,
  getReadingHistory,
  clearReadingHistory,
} from '@/lib/storage';
import { getProxiedCoverUrl } from '@/lib/mangadex-api';

export default function LibraryPage() {
  const [activeTab, setActiveTab] = useState('bookmarks'); // 'bookmarks' | 'history'
  const [bookmarks, setBookmarks] = useState([]);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    setBookmarks(getBookmarks());
    setHistory(getReadingHistory());

    const onStorage = () => {
      setBookmarks(getBookmarks());
      setHistory(getReadingHistory());
    };

    window.addEventListener('mangaverse_storage_change', onStorage);
    return () => window.removeEventListener('mangaverse_storage_change', onStorage);
  }, []);

  const handleRemoveBookmark = (mangaId) => {
    toggleBookmark({ id: mangaId });
  };

  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear your reading history?')) {
      clearReadingHistory();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-subtle pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-text-main">
            My Library
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Stored locally in your browser. No account required.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 bg-surface p-1 rounded-xl border border-subtle self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('bookmarks')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-accent-brand ${
              activeTab === 'bookmarks'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'text-text-muted hover:text-text-main'
            }`}
          >
            <Bookmark className="w-4 h-4" aria-hidden="true" />
            Bookmarks ({bookmarks.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-accent-brand ${
              activeTab === 'history'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'text-text-muted hover:text-text-main'
            }`}
          >
            <Clock className="w-4 h-4" aria-hidden="true" />
            History ({history.length})
          </button>
        </div>
      </div>

      {/* Bookmarks Tab */}
      {activeTab === 'bookmarks' && (
        <section className="space-y-6">
          {bookmarks.length === 0 ? (
            <div className="text-center py-20 px-4 rounded-2xl border border-dashed border-subtle bg-surface space-y-3">
              <Bookmark className="w-8 h-8 text-text-faint mx-auto" aria-hidden="true" />
              <p className="text-text-main font-semibold text-base">No bookmarked titles yet</p>
              <p className="text-xs text-text-muted max-w-sm mx-auto">
                Explore the catalog and bookmark titles to follow your favorite manga.
              </p>
              <Link
                href="/browse"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-hover border border-subtle hover:border-strong text-text-main text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-accent-brand"
              >
                Browse Titles
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {bookmarks.map((b) => {
                const coverUrl = b.coverFileName
                  ? getProxiedCoverUrl(b.id, b.coverFileName, '512')
                  : '';

                return (
                  <div
                    key={b.id}
                    className="group relative flex flex-col rounded-xl overflow-hidden bg-surface border border-subtle card-hover focus-visible:ring-2 focus-visible:ring-accent-brand"
                  >
                    <Link href={`/manga/${b.id}`} className="relative aspect-[2/3] w-full bg-surface-hover">
                      {coverUrl ? (
                        <img
                          src={coverUrl}
                          alt={`Cover artwork for ${b.title}`}
                          width={256}
                          height={384}
                          className="w-full h-full object-cover cover-zoom"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-text-faint">
                          No Cover
                        </div>
                      )}
                    </Link>

                    <div className="p-3 flex flex-col justify-between flex-1 gap-2">
                      <Link
                        href={`/manga/${b.id}`}
                        className="text-xs sm:text-sm font-semibold text-text-main group-hover:text-accent-brand transition-colors line-clamp-2"
                      >
                        {b.title}
                      </Link>

                      <div className="flex items-center justify-between pt-1 border-t border-subtle">
                        <Link
                          href={`/manga/${b.id}`}
                          className="text-[11px] text-accent-brand hover:text-accent-hover font-medium"
                        >
                          Read Series
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleRemoveBookmark(b.id)}
                          className="text-text-faint hover:text-rose-500 p-1 rounded transition-colors focus-visible:ring-2 focus-visible:ring-accent-brand"
                          title="Remove bookmark"
                          aria-label={`Remove ${b.title} from bookmarks`}
                        >
                          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <section className="space-y-6">
          {history.length > 0 && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleClearHistory}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-subtle text-xs text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:border-rose-300 dark:hover:border-rose-900 transition-colors focus-visible:ring-2 focus-visible:ring-accent-brand"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                Clear All History
              </button>
            </div>
          )}

          {history.length === 0 ? (
            <div className="text-center py-20 px-4 rounded-2xl border border-dashed border-subtle bg-surface space-y-3">
              <Clock className="w-8 h-8 text-text-faint mx-auto" aria-hidden="true" />
              <p className="text-text-main font-semibold text-base">Reading history is empty</p>
              <p className="text-xs text-text-muted max-w-sm mx-auto">
                Chapters you read will automatically appear here with progress markers.
              </p>
              <Link
                href="/browse"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-hover border border-subtle hover:border-strong text-text-main text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-accent-brand"
              >
                Find Something to Read
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((entry) => {
                const coverUrl = entry.coverFileName
                  ? getProxiedCoverUrl(entry.mangaId, entry.coverFileName, '256')
                  : '';
                const progressPct =
                  entry.totalPages > 0
                    ? Math.round(((entry.pageIndex + 1) / entry.totalPages) * 100)
                    : 0;

                const dateStr = entry.updatedAt
                  ? new Date(entry.updatedAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '';

                return (
                  <div
                    key={entry.chapterId}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-surface border border-subtle gap-4 hover:border-strong transition-colors"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-12 h-16 rounded-lg overflow-hidden bg-surface-hover shrink-0">
                        {coverUrl ? (
                          <img
                            src={coverUrl}
                            alt={`Cover artwork for ${entry.mangaTitle}`}
                            width={48}
                            height={64}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-text-faint">
                            📖
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 space-y-1">
                        <Link
                          href={`/manga/${entry.mangaId}`}
                          className="text-sm font-semibold text-text-main hover:text-accent-brand transition-colors truncate block"
                        >
                          {entry.mangaTitle}
                        </Link>
                        <p className="text-xs text-text-muted">
                          Chapter {entry.chapterNumber || '—'}
                          {entry.chapterTitle ? ` • ${entry.chapterTitle}` : ''}
                        </p>
                        <div className="flex items-center gap-3 text-[11px] text-text-faint">
                          <span>
                            Page {entry.pageIndex + 1} of {entry.totalPages} ({progressPct}%)
                          </span>
                          {dateStr && <span>• {dateStr}</span>}
                        </div>
                      </div>
                    </div>

                    <Link
                      href={`/read/${entry.chapterId}`}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold transition-colors shrink-0 focus-visible:ring-2 focus-visible:ring-accent-brand"
                    >
                      <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
                      Resume
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
