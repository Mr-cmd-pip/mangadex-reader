'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, SlidersHorizontal, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import MangaGrid from '@/components/MangaGrid';
import FilterDrawer from '@/components/FilterDrawer';
import { getPreferences } from '@/lib/storage';

const PAGE_SIZE = 24;
const MAX_OFFSET_LIMIT = 10000;

function BrowseContent() {
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [debouncedQuery, setDebouncedQuery] = useState(searchParams.get('q') || '');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Filters state
  const [filters, setFilters] = useState({
    sort: 'relevance',
    originalLanguage: [],
    status: [],
    demographic: [],
    includedTags: [],
    excludedTags: [],
    allowMature: false,
  });

  const [page, setPage] = useState(1);
  const [results, setResults] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const prefs = getPreferences();
    const q = searchParams.get('q') || '';
    setSearchQuery(q);
    setDebouncedQuery(q);
    setFilters((prev) => ({
      ...prev,
      allowMature: Boolean(prefs.allowMature),
    }));
  }, [searchParams]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchManga = useCallback(async () => {
    setLoading(true);
    const offset = (page - 1) * PAGE_SIZE;

    const params = new URLSearchParams();
    params.set('limit', PAGE_SIZE.toString());
    params.set('offset', offset.toString());

    if (debouncedQuery.trim()) {
      params.set('title', debouncedQuery.trim());
    }

    if (filters.sort === 'relevance' && !debouncedQuery.trim()) {
      params.set('order[followedCount]', 'desc');
    } else if (filters.sort === 'followedCount') {
      params.set('order[followedCount]', 'desc');
    } else if (filters.sort === 'latestUploadedChapter') {
      params.set('order[latestUploadedChapter]', 'desc');
    } else if (filters.sort === 'rating') {
      params.set('order[rating]', 'desc');
    } else if (filters.sort === 'createdAt') {
      params.set('order[createdAt]', 'desc');
    } else {
      params.set('order[relevance]', 'desc');
    }

    filters.originalLanguage.forEach((lang) => params.append('originalLanguage[]', lang));
    filters.status.forEach((st) => params.append('status[]', st));
    filters.demographic.forEach((demo) => params.append('publicationDemographic[]', demo));
    filters.includedTags.forEach((t) => params.append('includedTags[]', t));
    filters.excludedTags.forEach((t) => params.append('excludedTags[]', t));

    params.append('contentRating[]', 'safe');
    params.append('contentRating[]', 'suggestive');
    if (filters.allowMature) {
      params.append('contentRating[]', 'erotica');
    }

    try {
      const res = await fetch(`/api/manga?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setResults(json.data || []);
        setTotalCount(json.total || 0);
      } else {
        setResults([]);
        setTotalCount(0);
      }
    } catch (err) {
      console.error('[Browse fetch error]', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, filters, page]);

  useEffect(() => {
    fetchManga();
  }, [fetchManga]);

  const handleResetFilters = () => {
    setFilters({
      sort: 'relevance',
      originalLanguage: [],
      status: [],
      demographic: [],
      includedTags: [],
      excludedTags: [],
      allowMature: getPreferences().allowMature,
    });
    setSearchQuery('');
    setDebouncedQuery('');
    setPage(1);
  };

  const currentOffset = (page - 1) * PAGE_SIZE;
  const isCappedAt10k = currentOffset + PAGE_SIZE >= MAX_OFFSET_LIMIT;
  const maxPossiblePages = Math.min(
    Math.ceil(totalCount / PAGE_SIZE),
    Math.floor(MAX_OFFSET_LIMIT / PAGE_SIZE)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Search Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-text-main text-pretty">
            Browse Manga Catalog
          </h1>
          <p className="text-xs md:text-sm text-text-muted mt-1">
            {loading ? 'Searching catalog…' : `${totalCount.toLocaleString()} titles available`}
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="w-4 h-4 text-text-faint absolute left-3 top-2.5 pointer-events-none" aria-hidden="true" />
            <input
              type="search"
              name="catalog_search"
              autoComplete="off"
              spellCheck={false}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by title…"
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg bg-surface border border-subtle text-text-main placeholder-text-faint focus:outline-none focus:border-accent-brand focus-visible:ring-2 focus-visible:ring-accent-brand/40"
              aria-label="Filter catalog by title"
            />
          </div>

          <button
            type="button"
            onClick={() => setMobileFilterOpen(true)}
            className="lg:hidden flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface border border-subtle text-sm font-medium text-text-main hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-accent-brand"
          >
            <SlidersHorizontal className="w-4 h-4 text-accent-brand" aria-hidden="true" />
            Filters
          </button>
        </div>
      </div>

      {/* Main Browse Layout (Sidebar + Results) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1">
          <FilterDrawer
            filters={filters}
            onChange={(newFilters) => {
              setFilters(newFilters);
              setPage(1);
            }}
            onReset={handleResetFilters}
            isOpen={mobileFilterOpen}
            onClose={() => setMobileFilterOpen(false)}
          />
        </div>

        {/* Results Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* 10k Boundary Cap Notice */}
          {isCappedAt10k && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-orange-100 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/60 text-orange-900 dark:text-orange-200 text-xs">
              <AlertCircle className="w-4 h-4 text-accent-brand shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="font-semibold">MangaDex 10,000 Result Boundary Reached</p>
                <p className="text-text-muted mt-0.5">
                  To protect API stability, catalog browsing terminates at 10,000 items. Please refine
                  your tags, language, or search keywords to view other titles.
                </p>
              </div>
            </div>
          )}

          {/* Manga Grid */}
          <MangaGrid mangaList={results} loading={loading} count={PAGE_SIZE} />

          {/* Pagination Controls */}
          {maxPossiblePages > 1 && (
            <div className="flex items-center justify-between pt-6 border-t border-subtle">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => {
                  setPage((p) => Math.max(1, p - 1));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-surface border border-subtle text-sm font-medium text-text-main hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-visible:ring-2 focus-visible:ring-accent-brand"
              >
                <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                Previous
              </button>

              <span className="text-xs text-text-muted font-mono">
                Page <span className="text-text-main font-semibold">{page}</span> of {maxPossiblePages}
              </span>

              <button
                type="button"
                disabled={page >= maxPossiblePages || isCappedAt10k || loading}
                onClick={() => {
                  setPage((p) => p + 1);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-surface border border-subtle text-sm font-medium text-text-main hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-visible:ring-2 focus-visible:ring-accent-brand"
              >
                Next
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BrowsePage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-12 text-center text-text-faint">
          Loading catalog…
        </div>
      }
    >
      <BrowseContent />
    </Suspense>
  );
}
