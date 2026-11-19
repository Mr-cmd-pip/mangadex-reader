'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getProxiedCoverUrl, getDisplayTitle, extractRelationships } from '@/lib/mangadex-api';

const LANG_MAP = {
  ja: {
    label: 'Manga',
    dark: 'bg-blue-950/80 text-blue-300 border-blue-800/50',
    light: 'bg-blue-50 text-blue-800 border-blue-200',
  },
  ko: {
    label: 'Manhwa',
    dark: 'bg-emerald-950/80 text-emerald-300 border-emerald-800/50',
    light: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  zh: {
    label: 'Manhua',
    dark: 'bg-purple-950/80 text-purple-300 border-purple-800/50',
    light: 'bg-purple-50 text-purple-800 border-purple-200',
  },
  'zh-hk': {
    label: 'Manhua',
    dark: 'bg-purple-950/80 text-purple-300 border-purple-800/50',
    light: 'bg-purple-50 text-purple-800 border-purple-200',
  },
};

export default function MangaCard({ manga }) {
  const [imageError, setImageError] = useState(false);

  if (!manga) return null;

  const id = manga.id;
  const title = getDisplayTitle(manga);
  const rels = extractRelationships(manga);
  const coverFileName = rels.coverFileName;
  const coverUrl = coverFileName ? getProxiedCoverUrl(id, coverFileName, '512') : '';

  const origLang = manga.attributes?.originalLanguage || 'ja';
  const langConfig = LANG_MAP[origLang] || {
    label: origLang.toUpperCase(),
    dark: 'bg-zinc-800 text-zinc-300 border-zinc-700',
    light: 'bg-zinc-100 text-zinc-800 border-zinc-300',
  };

  const status = manga.attributes?.status; // ongoing, completed, hiatus, cancelled

  return (
    <Link
      href={`/manga/${id}`}
      className="group relative flex flex-col rounded-xl overflow-hidden bg-surface border border-subtle card-hover focus-visible:ring-2 focus-visible:ring-accent-brand"
    >
      {/* Cover Image Container (2:3 aspect ratio) */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-surface-hover">
        {coverUrl && !imageError ? (
          <img
            src={coverUrl}
            alt={`Cover artwork for ${title}`}
            width={256}
            height={384}
            loading="lazy"
            decoding="async"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover cover-zoom"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-surface-hover text-text-faint">
            <span className="text-xs font-mono uppercase tracking-wider">No Cover</span>
            <span className="text-xs line-clamp-2 mt-1 text-text-muted">{title}</span>
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1 pointer-events-none" aria-hidden="true">
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border backdrop-blur-md ${langConfig.dark} light-theme-chip`}
          >
            {langConfig.label}
          </span>
          {status && status !== 'ongoing' && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md border bg-surface/90 text-text-muted border-subtle backdrop-blur-md capitalize">
              {status}
            </span>
          )}
        </div>
      </div>

      {/* Card Info */}
      <div className="p-3 flex flex-col flex-1 justify-between gap-1">
        <h3 className="text-sm font-semibold text-text-main group-hover:text-accent-brand transition-colors line-clamp-2 leading-snug">
          {title}
        </h3>

        {rels.authors.length > 0 && (
          <p className="text-xs text-text-muted line-clamp-1 truncate">
            {rels.authors.join(', ')}
          </p>
        )}
      </div>
    </Link>
  );
}
