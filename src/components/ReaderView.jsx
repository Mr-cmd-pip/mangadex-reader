'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  RotateCw,
  ExternalLink,
  Users,
} from 'lucide-react';
import { getProxiedPageUrl } from '@/lib/mangadex-api';
import {
  getPreferences,
  updatePreference,
  recordReadingProgress,
} from '@/lib/storage';

export default function ReaderView({
  chapterId,
  chapterData,
  atHomeData,
  prevChapterId,
  nextChapterId,
  mangaId,
  mangaTitle,
  coverFileName,
}) {
  const router = useRouter();

  // At-Home state (can be refreshed on error)
  const [baseUrl, setBaseUrl] = useState(atHomeData?.baseUrl || '');
  const [hash, setHash] = useState(atHomeData?.chapter?.hash || '');
  const [dataFiles, setDataFiles] = useState(atHomeData?.chapter?.data || []);
  const [dataSaverFiles, setDataSaverFiles] = useState(atHomeData?.chapter?.dataSaver || []);

  // Preferences
  const [readingMode, setReadingMode] = useState('webtoon'); // 'webtoon' | 'paged-rtl' | 'paged-ltr'
  const [quality, setQuality] = useState('data'); // 'data' | 'data-saver'
  const [currentPage, setCurrentPage] = useState(0);

  // UI state
  const [menuVisible, setMenuVisible] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [failedPages, setFailedPages] = useState(new Set());
  const [isRefreshingServer, setIsRefreshingServer] = useState(false);

  const containerRef = useRef(null);

  // Active file list based on quality
  const pages = quality === 'data-saver' ? dataSaverFiles : dataFiles;
  const totalPages = pages.length;

  useEffect(() => {
    const prefs = getPreferences();
    setReadingMode(prefs.readingMode || 'webtoon');
    setQuality(prefs.dataSaver ? 'data-saver' : 'data');
  }, []);

  // Record reading progress in localStorage
  useEffect(() => {
    if (chapterId && mangaId && totalPages > 0) {
      recordReadingProgress({
        mangaId,
        mangaTitle: mangaTitle || 'Untitled',
        coverFileName,
        chapterId,
        chapterNumber: chapterData?.attributes?.chapter || '—',
        chapterTitle: chapterData?.attributes?.title || '',
        pageIndex: currentPage,
        totalPages,
      });
    }
  }, [chapterId, mangaId, mangaTitle, coverFileName, chapterData, currentPage, totalPages]);

  // Preload next 2 pages in memory
  useEffect(() => {
    if (!baseUrl || !hash || totalPages === 0) return;

    const preloadIndices = [currentPage + 1, currentPage + 2].filter((i) => i < totalPages);
    preloadIndices.forEach((idx) => {
      const filename = pages[idx];
      if (filename) {
        const url = getProxiedPageUrl({
          baseUrl,
          quality,
          hash,
          filename,
        });
        const img = new Image();
        img.src = url;
      }
    });
  }, [baseUrl, hash, quality, pages, currentPage, totalPages]);

  // Fresh server retry handler
  const refreshAtHomeServer = useCallback(async () => {
    setIsRefreshingServer(true);
    try {
      const res = await fetch(`/api/at-home/server/${chapterId}?force=true`);
      if (res.ok) {
        const json = await res.json();
        if (json.baseUrl) {
          setBaseUrl(json.baseUrl);
          setHash(json.chapter?.hash || hash);
          if (json.chapter?.data) setDataFiles(json.chapter.data);
          if (json.chapter?.dataSaver) setDataSaverFiles(json.chapter.dataSaver);
          setFailedPages(new Set());
        }
      }
    } catch (err) {
      console.error('[At-Home Server Refresh Error]', err);
    } finally {
      setIsRefreshingServer(false);
    }
  }, [chapterId, hash]);

  const handleImageError = useCallback(
    (index) => {
      setFailedPages((prev) => new Set([...prev, index]));
      refreshAtHomeServer();
    },
    [refreshAtHomeServer]
  );

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

      if (e.key === 'ArrowRight') {
        if (readingMode === 'paged-rtl') {
          setCurrentPage((p) => Math.max(0, p - 1));
        } else {
          setCurrentPage((p) => Math.min(totalPages - 1, p + 1));
        }
      } else if (e.key === 'ArrowLeft') {
        if (readingMode === 'paged-rtl') {
          setCurrentPage((p) => Math.min(totalPages - 1, p + 1));
        } else {
          setCurrentPage((p) => Math.max(0, p - 1));
        }
      } else if (e.key.toLowerCase() === 'f') {
        toggleFullscreen();
      } else if (e.key.toLowerCase() === 'm') {
        setMenuVisible((v) => !v);
      } else if (e.key.toLowerCase() === 'd') {
        const nextQ = quality === 'data' ? 'data-saver' : 'data';
        setQuality(nextQ);
        updatePreference('dataSaver', nextQ === 'data-saver');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [readingMode, totalPages, toggleFullscreen, quality]);

  const scanGroup = chapterData?.relationships?.find((r) => r.type === 'scanlation_group');
  const groupName = scanGroup?.attributes?.name || 'Unknown Group';

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen bg-reader-bg text-text-main select-none overflow-x-hidden transition-colors"
    >
      {/* Floating Top Controls Header */}
      <div
        className={`fixed top-0 left-0 right-0 z-50 bg-reader-bar backdrop-blur-md border-b border-subtle transition-transform duration-200 ${
          menuVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href={mangaId ? `/manga/${mangaId}` : '/browse'}
              className="p-1.5 rounded-lg text-text-muted hover:text-text-main hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-accent-brand transition-colors shrink-0"
              title="Back to series"
              aria-label="Back to series"
            >
              <ArrowLeft className="w-5 h-5" aria-hidden="true" />
            </Link>

            <div className="min-w-0">
              <h1 className="text-sm font-semibold text-text-main truncate text-pretty">
                {mangaTitle || 'Reader'}{' '}
                <span className="text-text-muted font-normal">
                  • Ch. {chapterData?.attributes?.chapter || '—'}
                </span>
              </h1>
              {scanGroup && (
                <a
                  href={`https://mangadex.org/group/${scanGroup.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-text-muted hover:text-accent-brand focus-visible:ring-2 focus-visible:ring-accent-brand transition-colors truncate"
                  title="Scanlation group on MangaDex"
                >
                  <Users className="w-3 h-3" aria-hidden="true" />
                  <span>{groupName}</span>
                  <ExternalLink className="w-2.5 h-2.5 text-text-faint" aria-hidden="true" />
                </a>
              )}
            </div>
          </div>

          {/* Quick Settings */}
          <div className="flex items-center gap-2">
            {/* Quality Toggle */}
            <button
              type="button"
              onClick={() => {
                const nextQ = quality === 'data' ? 'data-saver' : 'data';
                setQuality(nextQ);
                updatePreference('dataSaver', nextQ === 'data-saver');
              }}
              className="px-2.5 py-1 text-xs rounded-md font-mono border border-subtle bg-surface text-text-muted hover:text-text-main hover:border-strong focus-visible:ring-2 focus-visible:ring-accent-brand transition-colors"
              title="Toggle Data Saver"
            >
              {quality === 'data' ? 'HQ (Data)' : 'Data Saver'}
            </button>

            {/* Reading Mode Selector */}
            <select
              value={readingMode}
              onChange={(e) => {
                setReadingMode(e.target.value);
                updatePreference('readingMode', e.target.value);
              }}
              className="px-2.5 py-1 text-xs rounded-md bg-surface border border-subtle text-text-main focus:outline-none focus:border-accent-brand focus-visible:ring-2 focus-visible:ring-accent-brand"
              aria-label="Reading mode selection"
            >
              <option value="webtoon">Webtoon (Scroll)</option>
              <option value="paged-rtl">Paged (RTL)</option>
              <option value="paged-ltr">Paged (LTR)</option>
            </select>

            {/* Fullscreen */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg text-text-muted hover:text-text-main hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-accent-brand transition-colors"
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isFullscreen ? <Minimize className="w-4 h-4" aria-hidden="true" /> : <Maximize className="w-4 h-4" aria-hidden="true" />}
            </button>
          </div>
        </div>
      </div>

      {/* Main Reading Viewport */}
      <main
        onClick={() => setMenuVisible(!menuVisible)}
        className="w-full flex flex-col items-center justify-center min-h-screen pt-14 pb-20 cursor-pointer"
      >
        {totalPages === 0 ? (
          <div className="text-center p-8 space-y-4 max-w-md">
            {chapterData?.attributes?.externalUrl ? (
              <div className="space-y-3">
                <p className="text-text-main font-semibold text-base">External Release</p>
                <p className="text-xs text-text-muted">
                  This chapter is published externally on an official partner website.
                </p>
                <a
                  href={chapterData.attributes.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-medium text-xs transition-colors"
                >
                  <span>Read on {groupName}</span>
                  <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                </a>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-text-muted">No pages found for this chapter.</p>
                <button
                  type="button"
                  onClick={refreshAtHomeServer}
                  className="px-4 py-2 text-xs rounded-lg bg-orange-600 text-white font-medium flex items-center gap-1.5 mx-auto focus-visible:ring-2 focus-visible:ring-accent-brand"
                >
                  <RotateCw className="w-3.5 h-3.5" aria-hidden="true" />
                  Retry Fetch
                </button>
              </div>
            )}
          </div>
        ) : readingMode === 'webtoon' ? (
          /* Webtoon Mode: Vertical Scroll */
          <div className="w-full max-w-3xl flex flex-col items-center">
            {pages.map((filename, index) => {
              const pageUrl = getProxiedPageUrl({
                baseUrl,
                quality,
                hash,
                filename,
              });
              const isFailed = failedPages.has(index);

              return (
                <div
                  key={`${filename}-${index}`}
                  className="w-full relative min-h-[400px] flex items-center justify-center bg-reader-bg"
                >
                  {isFailed ? (
                    <div className="p-8 text-center space-y-2 text-xs text-rose-500">
                      <p>Page {index + 1} failed to load.</p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          refreshAtHomeServer();
                        }}
                        className="px-3 py-1.5 rounded-md bg-surface text-text-main border border-subtle hover:border-strong flex items-center gap-1 mx-auto focus-visible:ring-2 focus-visible:ring-accent-brand"
                      >
                        <RotateCw className="w-3 h-3" aria-hidden="true" />
                        Reload Server
                      </button>
                    </div>
                  ) : (
                    <img
                      src={pageUrl}
                      alt={`Chapter page ${index + 1}`}
                      loading={index < 2 ? 'eager' : 'lazy'}
                      onError={() => handleImageError(index)}
                      className="w-full h-auto block select-none"
                    />
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* Paged Mode: Single Page */
          <div className="relative max-w-4xl max-h-[90vh] flex items-center justify-center">
            {failedPages.has(currentPage) ? (
              <div className="p-10 text-center space-y-3 text-xs text-rose-500">
                <p>Page {currentPage + 1} failed to load.</p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    refreshAtHomeServer();
                  }}
                  className="px-4 py-2 rounded-lg bg-surface text-text-main border border-subtle hover:border-strong flex items-center gap-1.5 mx-auto focus-visible:ring-2 focus-visible:ring-accent-brand"
                >
                  <RotateCw className="w-3.5 h-3.5" aria-hidden="true" />
                  Reload Server
                </button>
              </div>
            ) : (
              <img
                src={getProxiedPageUrl({
                  baseUrl,
                  quality,
                  hash,
                  filename: pages[currentPage],
                })}
                alt={`Chapter page ${currentPage + 1}`}
                onError={() => handleImageError(currentPage)}
                className="max-h-[85vh] max-w-full object-contain shadow-2xl select-none"
              />
            )}
          </div>
        )}
      </main>

      {/* Floating Bottom Navigation Drawer */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 bg-reader-bar backdrop-blur-md border-t border-subtle transition-transform duration-200 ${
          menuVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="max-w-4xl mx-auto px-4 py-3 space-y-2">
          {/* Progress Slider (Paged Mode) */}
          {readingMode !== 'webtoon' && totalPages > 1 && (
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-text-muted">1</span>
              <input
                type="range"
                name="page_slider"
                min="0"
                max={totalPages - 1}
                value={currentPage}
                aria-label={`Jump to page (current: ${currentPage + 1} of ${totalPages})`}
                onChange={(e) => setCurrentPage(parseInt(e.target.value, 10))}
                className="flex-1 h-1.5 bg-surface-hover rounded-lg appearance-none cursor-pointer accent-orange-500 focus-visible:ring-2 focus-visible:ring-accent-brand"
              />
              <span className="text-xs font-mono text-text-muted">{totalPages}</span>
            </div>
          )}

          <div className="flex items-center justify-between text-xs">
            {/* Prev chapter */}
            {prevChapterId ? (
              <button
                type="button"
                onClick={() => router.push(`/read/${prevChapterId}`)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface border border-subtle text-text-muted hover:text-text-main hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-accent-brand"
              >
                <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                Previous Chapter
              </button>
            ) : (
              <div />
            )}

            {/* Page Count Display */}
            <div className="text-text-muted font-mono">
              {readingMode === 'webtoon' ? (
                <span>{totalPages} Pages</span>
              ) : (
                <span>
                  Page <strong className="text-text-main">{currentPage + 1}</strong> of {totalPages}
                </span>
              )}
            </div>

            {/* Next chapter */}
            {nextChapterId ? (
              <button
                type="button"
                onClick={() => router.push(`/read/${nextChapterId}`)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface border border-subtle text-text-muted hover:text-text-main hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-accent-brand"
              >
                Next Chapter
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </button>
            ) : (
              <div />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
