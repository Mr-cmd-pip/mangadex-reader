'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowDownUp, Check, ExternalLink, Calendar, Users, Eye } from 'lucide-react';
import { extractRelationships } from '@/lib/mangadex-api';

export default function ChapterList({ chapters = [], mangaId, readingHistory = [] }) {
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' | 'asc'
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  // Discover available languages in the feed
  const availableLanguages = useMemo(() => {
    const langs = new Set();
    chapters.forEach((c) => {
      const l = c.attributes?.translatedLanguage;
      if (l) langs.add(l);
    });
    return Array.from(langs);
  }, [chapters]);

  const activeLanguage = availableLanguages.includes('en')
    ? selectedLanguage
    : availableLanguages[0] || selectedLanguage;

  const filteredChapters = useMemo(() => {
    const list = chapters.filter(
      (c) => (c.attributes?.translatedLanguage || 'en') === activeLanguage
    );

    return list.sort((a, b) => {
      const numA = parseFloat(a.attributes?.chapter) || 0;
      const numB = parseFloat(b.attributes?.chapter) || 0;
      return sortOrder === 'asc' ? numA - numB : numB - numA;
    });
  }, [chapters, activeLanguage, sortOrder]);

  const groupedByVolume = useMemo(() => {
    const groups = new Map();

    filteredChapters.forEach((chapter) => {
      const vol = chapter.attributes?.volume;
      const volKey = vol ? `Volume ${vol}` : 'No Volume';

      if (!groups.has(volKey)) {
        groups.set(volKey, []);
      }
      groups.get(volKey).push(chapter);
    });

    return Array.from(groups.entries());
  }, [filteredChapters]);

  const readChapterIds = useMemo(() => {
    return new Set(readingHistory.map((h) => h.chapterId));
  }, [readingHistory]);

  if (chapters.length === 0) {
    return (
      <div className="text-center py-12 px-4 rounded-xl border border-dashed border-subtle bg-surface">
        <p className="text-text-muted font-medium">No chapters available in feed</p>
        <p className="text-xs text-text-faint mt-1">This series might not have translated releases yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-surface border border-subtle">
        <div className="flex items-center gap-2">
          <label htmlFor="lang_select" className="text-xs font-semibold text-text-muted uppercase tracking-wider">
            Language:
          </label>
          <select
            id="lang_select"
            value={activeLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="px-2.5 py-1 text-xs rounded-lg bg-canvas border border-subtle text-text-main focus:outline-none focus:border-accent-brand font-mono"
            aria-label="Filter chapters by language"
          >
            {availableLanguages.map((lang) => (
              <option key={lang} value={lang}>
                {lang.toUpperCase()}
              </option>
            ))}
          </select>
          <span className="text-xs text-text-faint ml-2">
            ({filteredChapters.length} chapters)
          </span>
        </div>

        <button
          type="button"
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg bg-surface-hover border border-subtle text-text-main hover:border-strong transition-colors focus-visible:ring-2 focus-visible:ring-accent-brand"
        >
          <ArrowDownUp className="w-3.5 h-3.5 text-accent-brand" aria-hidden="true" />
          <span>{sortOrder === 'asc' ? 'Oldest to Newest' : 'Newest to Oldest'}</span>
        </button>
      </div>

      {/* Volume Groups */}
      <div className="space-y-6">
        {groupedByVolume.map(([volumeName, volChapters]) => (
          <div key={volumeName} className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-accent-brand px-1">
              {volumeName}
            </h3>

            <div className="divide-y divide-subtle rounded-xl overflow-hidden border border-subtle bg-surface">
              {volChapters.map((chapter) => {
                const chapterId = chapter.id;
                const chapterNum = chapter.attributes?.chapter;
                const chapterTitle = chapter.attributes?.title;
                const isRead = readChapterIds.has(chapterId);
                const externalUrl = chapter.attributes?.externalUrl;

                const rels = extractRelationships(chapter);
                const scanGroup = rels.scanlationGroups[0];
                const publishDate = chapter.attributes?.publishAt
                  ? new Date(chapter.attributes.publishAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })
                  : '';

                return (
                  <div
                    key={chapterId}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 gap-2 hover:bg-surface-hover transition-colors ${
                      isRead ? 'opacity-60 bg-surface-hover/30' : ''
                    }`}
                  >
                    {externalUrl ? (
                      <a
                        href={externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 min-w-0 group flex items-start gap-2.5 focus-visible:ring-2 focus-visible:ring-accent-brand rounded p-0.5"
                      >
                        <div className="mt-0.5 shrink-0 text-text-faint group-hover:text-accent-brand">
                          <ExternalLink className="w-4 h-4" aria-hidden="true" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-text-main group-hover:text-accent-brand transition-colors">
                              Chapter {chapterNum || '—'}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-hover text-text-muted font-medium border border-subtle">
                              External Link
                            </span>
                            {chapterTitle && (
                              <span className="text-xs text-text-muted truncate max-w-xs md:max-w-md">
                                {chapterTitle}
                              </span>
                            )}
                          </div>
                        </div>
                      </a>
                    ) : (
                      <Link
                        href={`/read/${chapterId}`}
                        className="flex-1 min-w-0 group flex items-start gap-2.5 focus-visible:ring-2 focus-visible:ring-accent-brand rounded p-0.5"
                      >
                        <div className="mt-0.5 shrink-0">
                          {isRead ? (
                            <Check className="w-4 h-4 text-emerald-500" aria-hidden="true" />
                          ) : (
                            <Eye className="w-4 h-4 text-text-faint group-hover:text-accent-brand transition-colors" aria-hidden="true" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-text-main group-hover:text-accent-brand transition-colors">
                              Chapter {chapterNum || '—'}
                            </span>
                            {chapterTitle && (
                              <span className="text-xs text-text-muted truncate max-w-xs md:max-w-md">
                                {chapterTitle}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    )}

                    {/* Attribution & Meta */}
                    <div className="flex items-center gap-4 text-xs text-text-muted shrink-0 self-end sm:self-auto">
                      {scanGroup ? (
                        <a
                          href={`https://mangadex.org/group/${scanGroup.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-text-muted hover:text-accent-brand transition-colors focus-visible:ring-2 focus-visible:ring-accent-brand rounded"
                          title={`Scanlation group: ${scanGroup.name}`}
                        >
                          <Users className="w-3.5 h-3.5" aria-hidden="true" />
                          <span className="max-w-[120px] truncate">{scanGroup.name}</span>
                          <ExternalLink className="w-3 h-3 text-text-faint" aria-hidden="true" />
                        </a>
                      ) : (
                        <span className="flex items-center gap-1 text-text-faint">
                          <Users className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>No Group</span>
                        </span>
                      )}

                      {publishDate && (
                        <span className="flex items-center gap-1 text-text-faint">
                          <Calendar className="w-3 h-3" aria-hidden="true" />
                          <span>{publishDate}</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
