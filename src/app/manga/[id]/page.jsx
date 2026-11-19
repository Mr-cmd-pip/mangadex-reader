'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Bookmark,
  BookmarkCheck,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Layers,
} from 'lucide-react';
import {
  getProxiedCoverUrl,
  getDisplayTitle,
  getDisplayDescription,
  extractRelationships,
} from '@/lib/mangadex-api';
import ChapterList from '@/components/ChapterList';
import {
  isBookmarked,
  toggleBookmark,
  getReadingHistory,
} from '@/lib/storage';

export default function MangaDetailPage({ params }) {
  const unwrappedParams = use(params);
  const mangaId = unwrappedParams.id;

  const [manga, setManga] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [bookmarked, setBookmarked] = useState(false);
  const [history, setHistory] = useState([]);
  const [showFullDesc, setShowFullDesc] = useState(false);

  useEffect(() => {
    setBookmarked(isBookmarked(mangaId));
    setHistory(getReadingHistory());

    const onStorage = () => {
      setBookmarked(isBookmarked(mangaId));
      setHistory(getReadingHistory());
    };
    window.addEventListener('mangaverse_storage_change', onStorage);
    return () => window.removeEventListener('mangaverse_storage_change', onStorage);
  }, [mangaId]);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [mangaRes, feedRes] = await Promise.all([
          fetch(`/api/manga/${mangaId}`),
          fetch(`/api/manga/${mangaId}/feed?limit=500&order[chapter]=desc`),
        ]);

        if (!mangaRes.ok) {
          throw new Error(
            mangaRes.status === 451
              ? 'This title is not available due to a takedown request.'
              : 'Failed to load manga details'
          );
        }

        const mangaJson = await mangaRes.json();
        const feedJson = feedRes.ok ? await feedRes.json() : { data: [] };

        if (mounted) {
          setManga(mangaJson.data);
          setChapters(feedJson.data || []);
        }
      } catch (err) {
        if (mounted) setError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      mounted = false;
    };
  }, [mangaId]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-pulse">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-56 aspect-[2/3] bg-skeleton-bg rounded-2xl shrink-0" />
          <div className="flex-1 space-y-4">
            <div className="h-8 bg-skeleton-bg rounded w-2/3" />
            <div className="h-4 bg-skeleton-bg rounded w-1/3" />
            <div className="h-24 bg-skeleton-bg rounded w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !manga) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <h1 className="text-xl font-bold text-text-main">Title Unavailable</h1>
        <p className="text-sm text-text-muted">{error || 'Manga not found'}</p>
        <Link
          href="/browse"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-surface border border-subtle text-text-main text-sm hover:bg-surface-hover transition-colors focus-visible:ring-2 focus-visible:ring-accent-brand"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Back to Browse
        </Link>
      </div>
    );
  }

  const title = getDisplayTitle(manga);
  const description = getDisplayDescription(manga);
  const rels = extractRelationships(manga);
  const coverFileName = rels.coverFileName;
  const coverUrl = coverFileName ? getProxiedCoverUrl(mangaId, coverFileName, '512') : '';

  const status = manga.attributes?.status;
  const year = manga.attributes?.year;
  const demographic = manga.attributes?.publicationDemographic;
  const contentRating = manga.attributes?.contentRating;
  const tags = (manga.attributes?.tags || []).map((t) => t.attributes?.name?.en).filter(Boolean);

  const lastReadChapter = history.find((h) => h.mangaId === mangaId);

  const sortedAscChapters = [...chapters]
    .filter((c) => !c.attributes?.externalUrl)
    .sort((a, b) => {
      const numA = parseFloat(a.attributes?.chapter) || 0;
      const numB = parseFloat(b.attributes?.chapter) || 0;
      return numA - numB;
    });
  const firstChapter = sortedAscChapters[0];

  const handleBookmarkToggle = () => {
    const nextState = toggleBookmark({
      id: mangaId,
      title,
      coverFileName,
    });
    setBookmarked(nextState);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Series Hero Header */}
      <section className="flex flex-col md:flex-row gap-8 items-start">
        {/* Cover presentation */}
        <div className="w-48 sm:w-60 md:w-64 aspect-[2/3] rounded-2xl overflow-hidden bg-surface border border-subtle shrink-0 shadow-lg relative mx-auto md:mx-0">
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={`Cover artwork for ${title}`}
              width={256}
              height={384}
              className="w-full h-full object-cover"
              loading="eager"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-text-faint">
              No Cover
            </div>
          )}
        </div>

        {/* Series Info */}
        <div className="flex-1 space-y-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              {status && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/80 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800/60 capitalize">
                  {status}
                </span>
              )}
              {demographic && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-surface text-text-muted border border-subtle capitalize">
                  {demographic}
                </span>
              )}
              {contentRating && contentRating !== 'safe' && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 capitalize">
                  {contentRating}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-text-main leading-tight text-pretty">
              {title}
            </h1>

            {(rels.authors.length > 0 || rels.artists.length > 0) && (
              <p className="text-xs sm:text-sm text-text-muted">
                By{' '}
                <span className="text-text-main font-medium">
                  {Array.from(new Set([...rels.authors, ...rels.artists])).join(', ')}
                </span>
                {year ? ` (${year})` : ''}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            {lastReadChapter ? (
              <Link
                href={`/read/${lastReadChapter.chapterId}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-semibold text-sm transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-accent-brand"
              >
                <BookOpen className="w-4 h-4" aria-hidden="true" />
                Continue Ch. {lastReadChapter.chapterNumber || '—'}
              </Link>
            ) : firstChapter ? (
              <Link
                href={`/read/${firstChapter.id}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-semibold text-sm transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-accent-brand"
              >
                <BookOpen className="w-4 h-4" aria-hidden="true" />
                Start Reading (Ch. {firstChapter.attributes?.chapter || '1'})
              </Link>
            ) : null}

            <button
              type="button"
              onClick={handleBookmarkToggle}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-accent-brand ${
                bookmarked
                  ? 'bg-surface-hover text-accent-brand border-accent-brand/40 font-semibold'
                  : 'bg-surface text-text-main border-subtle hover:bg-surface-hover hover:border-strong'
              }`}
            >
              {bookmarked ? (
                <>
                  <BookmarkCheck className="w-4 h-4 text-accent-brand" aria-hidden="true" />
                  Bookmarked
                </>
              ) : (
                <>
                  <Bookmark className="w-4 h-4 text-text-muted" aria-hidden="true" />
                  Bookmark
                </>
              )}
            </button>
          </div>

          {/* Synopsis */}
          {description && (
            <div className="space-y-1.5 pt-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-text-muted">
                Synopsis
              </h2>
              <div className="text-xs sm:text-sm text-text-main leading-relaxed relative">
                <p className={`${showFullDesc ? '' : 'line-clamp-4'} text-pretty`}>{description}</p>
                {description.length > 240 && (
                  <button
                    type="button"
                    onClick={() => setShowFullDesc(!showFullDesc)}
                    className="text-xs font-semibold text-accent-brand hover:text-accent-hover mt-1 flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-accent-brand rounded p-0.5"
                  >
                    {showFullDesc ? (
                      <>
                        Show Less <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
                      </>
                    ) : (
                      <>
                        Read More <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[11px] px-2.5 py-1 rounded-md bg-surface text-text-muted border border-subtle"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Chapter List Feed Section */}
      <section className="space-y-4 pt-6 border-t border-subtle">
        <h2 className="text-xl font-bold tracking-tight text-text-main flex items-center gap-2">
          <Layers className="w-5 h-5 text-accent-brand" aria-hidden="true" />
          Chapter Releases
        </h2>

        <ChapterList
          chapters={chapters}
          mangaId={mangaId}
          readingHistory={history}
        />
      </section>
    </div>
  );
}
