'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Flame, Clock, Sparkles, BookOpen, ArrowRight } from 'lucide-react';
import MangaGrid from '@/components/MangaGrid';
import { getReadingHistory } from '@/lib/storage';
import { getProxiedCoverUrl } from '@/lib/mangadex-api';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('popular');
  const [mangaData, setMangaData] = useState({
    popular: [],
    latest: [],
    recentlyAdded: [],
  });
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const hist = getReadingHistory();
    setHistory(hist);

    const onStorage = () => setHistory(getReadingHistory());
    window.addEventListener('mangaverse_storage_change', onStorage);
    return () => window.removeEventListener('mangaverse_storage_change', onStorage);
  }, []);

  useEffect(() => {
    let mounted = true;
    async function loadCollections() {
      setLoading(true);
      try {
        const [popRes, latestRes, newRes] = await Promise.all([
          fetch('/api/manga?limit=12&order[followedCount]=desc'),
          fetch('/api/manga?limit=12&order[latestUploadedChapter]=desc'),
          fetch('/api/manga?limit=12&order[createdAt]=desc'),
        ]);

        const [popJson, latestJson, newJson] = await Promise.all([
          popRes.ok ? popRes.json() : { data: [] },
          latestRes.ok ? latestRes.json() : { data: [] },
          newRes.ok ? newRes.json() : { data: [] },
        ]);

        if (mounted) {
          setMangaData({
            popular: popJson.data || [],
            latest: latestJson.data || [],
            recentlyAdded: newJson.data || [],
          });
        }
      } catch (err) {
        console.error('[Home Load Error]', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadCollections();
    return () => {
      mounted = false;
    };
  }, []);

  const featured = mangaData.popular[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Hero Section */}
      <section className="relative rounded-2xl overflow-hidden bg-surface border border-subtle p-6 md:p-10 shadow-sm">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-950/80 border border-orange-200 dark:border-orange-800/60 text-orange-700 dark:text-orange-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Ad-free Manga, Manhwa &amp; Manhua</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-text-main leading-tight text-pretty">
            Read without clutter. <br />
            <span className="text-text-muted font-medium text-2xl md:text-4xl">
              Strictly proxied. Powered by MangaDex.
            </span>
          </h1>
          <p className="text-sm md:text-base text-text-muted leading-relaxed text-pretty">
            High-speed chapter streaming, zero tracking, volume grouping, and full keyboard
            navigation for manga enthusiasts.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <Link
              href="/browse"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-medium text-sm transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-accent-brand"
            >
              <BookOpen className="w-4 h-4" aria-hidden="true" />
              Explore All Titles
            </Link>
            {featured && (
              <Link
                href={`/manga/${featured.id}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-surface-hover hover:border-strong text-text-main font-medium text-sm transition-colors border border-subtle focus-visible:ring-2 focus-visible:ring-accent-brand"
              >
                Featured Title
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Continue Reading Shelf (Conditional) */}
      {history.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight text-text-main flex items-center gap-2">
              <Clock className="w-5 h-5 text-accent-brand" aria-hidden="true" />
              Continue Reading
            </h2>
            <Link
              href="/library"
              className="text-xs font-medium text-accent-brand hover:text-accent-hover focus-visible:ring-2 focus-visible:ring-accent-brand rounded p-1 transition-colors"
            >
              View Full History →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {history.slice(0, 4).map((entry) => {
              const coverUrl = entry.coverFileName
                ? getProxiedCoverUrl(entry.mangaId, entry.coverFileName, '256')
                : '';

              return (
                <Link
                  key={entry.chapterId}
                  href={`/read/${entry.chapterId}`}
                  className="flex items-center gap-3 p-3 rounded-xl bg-surface border border-subtle hover:border-strong card-hover group focus-visible:ring-2 focus-visible:ring-accent-brand"
                >
                  <div className="w-12 h-16 rounded-md overflow-hidden bg-surface-hover shrink-0">
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
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-text-main group-hover:text-accent-brand transition-colors truncate">
                      {entry.mangaTitle}
                    </h3>
                    <p className="text-xs text-text-muted truncate mt-0.5">
                      Chapter {entry.chapterNumber || '—'}{' '}
                      {entry.chapterTitle ? `• ${entry.chapterTitle}` : ''}
                    </p>
                    <p className="text-[11px] text-text-faint mt-1">
                      Page {entry.pageIndex + 1} of {entry.totalPages}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Main Catalog Tabs */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-subtle pb-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('popular')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium focus-visible:ring-2 focus-visible:ring-accent-brand transition-colors ${
                activeTab === 'popular'
                  ? 'bg-orange-600 text-white'
                  : 'text-text-muted hover:text-text-main hover:bg-surface-hover'
              }`}
            >
              <Flame className="w-4 h-4" aria-hidden="true" />
              Popular
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('latest')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium focus-visible:ring-2 focus-visible:ring-accent-brand transition-colors ${
                activeTab === 'latest'
                  ? 'bg-orange-600 text-white'
                  : 'text-text-muted hover:text-text-main hover:bg-surface-hover'
              }`}
            >
              <Clock className="w-4 h-4" aria-hidden="true" />
              Latest Updates
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('new')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium focus-visible:ring-2 focus-visible:ring-accent-brand transition-colors ${
                activeTab === 'new'
                  ? 'bg-orange-600 text-white'
                  : 'text-text-muted hover:text-text-main hover:bg-surface-hover'
              }`}
            >
              <Sparkles className="w-4 h-4" aria-hidden="true" />
              Recently Added
            </button>
          </div>

          <Link
            href="/browse"
            className="text-xs font-semibold text-accent-brand hover:text-accent-hover focus-visible:ring-2 focus-visible:ring-accent-brand rounded p-1 self-end sm:self-auto"
          >
            Browse All with Filters →
          </Link>
        </div>

        {/* Catalog Grid */}
        <MangaGrid
          mangaList={
            activeTab === 'popular'
              ? mangaData.popular
              : activeTab === 'latest'
              ? mangaData.latest
              : mangaData.recentlyAdded
          }
          loading={loading}
          count={12}
        />
      </section>
    </div>
  );
}
