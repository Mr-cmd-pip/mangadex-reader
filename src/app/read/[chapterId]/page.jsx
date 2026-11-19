'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ReaderView from '@/components/ReaderView';
import { getDisplayTitle, extractRelationships } from '@/lib/mangadex-api';

export default function ReaderPage({ params }) {
  const unwrappedParams = use(params);
  const chapterId = unwrappedParams.chapterId;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [chapterData, setChapterData] = useState(null);
  const [atHomeData, setAtHomeData] = useState(null);
  const [mangaData, setMangaData] = useState(null);
  const [prevChapterId, setPrevChapterId] = useState(null);
  const [nextChapterId, setNextChapterId] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function loadReader() {
      setLoading(true);
      setError(null);

      try {
        const [chapterRes, atHomeRes] = await Promise.all([
          fetch(`/api/chapter/${chapterId}`),
          fetch(`/api/at-home/server/${chapterId}`),
        ]);

        if (!chapterRes.ok) {
          throw new Error(
            chapterRes.status === 451
              ? 'This chapter is unavailable due to a takedown request.'
              : 'Failed to load chapter metadata.'
          );
        }

        if (!atHomeRes.ok) {
          throw new Error('Failed to reach MangaDex@Home reading server.');
        }

        const chapterJson = await chapterRes.json();
        const atHomeJson = await atHomeRes.json();

        if (!mounted) return;
        setChapterData(chapterJson.data);
        setAtHomeData(atHomeJson);

        const mangaRel = chapterJson.data?.relationships?.find((r) => r.type === 'manga');
        if (mangaRel) {
          const mangaRes = await fetch(`/api/manga/${mangaRel.id}`);
          if (mangaRes.ok) {
            const mJson = await mangaRes.json();
            if (mounted) setMangaData(mJson.data);
          }

          const lang = chapterJson.data?.attributes?.translatedLanguage || 'en';
          const feedRes = await fetch(
            `/api/manga/${mangaRel.id}/feed?limit=500&translatedLanguage[]=${lang}&order[chapter]=asc`
          );

          if (feedRes.ok) {
            const feedJson = await feedRes.json();
            const feedList = feedJson.data || [];
            const currentIndex = feedList.findIndex((c) => c.id === chapterId);

            if (currentIndex > 0) {
              setPrevChapterId(feedList[currentIndex - 1].id);
            }
            if (currentIndex >= 0 && currentIndex < feedList.length - 1) {
              setNextChapterId(feedList[currentIndex + 1].id);
            }
          }
        }
      } catch (err) {
        if (mounted) setError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadReader();
    return () => {
      mounted = false;
    };
  }, [chapterId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-reader-bg flex flex-col items-center justify-center text-text-muted space-y-4">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-mono tracking-wider uppercase">Loading MangaDex@Home…</p>
      </div>
    );
  }

  if (error || !chapterData || !atHomeData) {
    return (
      <div className="min-h-screen bg-reader-bg flex flex-col items-center justify-center p-6 text-center space-y-4">
        <h1 className="text-xl font-bold text-text-main">Unable to Load Chapter</h1>
        <p className="text-sm text-text-muted max-w-md">{error || 'Unknown error occurred.'}</p>
        <Link
          href="/browse"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-surface border border-subtle text-text-main text-xs hover:bg-surface-hover transition-colors focus-visible:ring-2 focus-visible:ring-accent-brand"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Back to Browse
        </Link>
      </div>
    );
  }

  const mangaId = mangaData?.id || chapterData?.relationships?.find((r) => r.type === 'manga')?.id;
  const mangaTitle = mangaData ? getDisplayTitle(mangaData) : '';
  const rels = mangaData ? extractRelationships(mangaData) : {};

  return (
    <ReaderView
      chapterId={chapterId}
      chapterData={chapterData}
      atHomeData={atHomeData}
      prevChapterId={prevChapterId}
      nextChapterId={nextChapterId}
      mangaId={mangaId}
      mangaTitle={mangaTitle}
      coverFileName={rels.coverFileName}
    />
  );
}
