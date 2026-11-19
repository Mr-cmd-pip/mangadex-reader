'use client';

import { useState, useEffect } from 'react';
import { Filter, X, RotateCcw } from 'lucide-react';
import { getPreferences, updatePreference } from '@/lib/storage';

const DEMOGRAPHICS = [
  { id: 'shounen', label: 'Shounen' },
  { id: 'shoujo', label: 'Shoujo' },
  { id: 'seinen', label: 'Seinen' },
  { id: 'josei', label: 'Josei' },
];

const LANGUAGES = [
  { id: 'ja', label: 'Manga (Japanese)' },
  { id: 'ko', label: 'Manhwa (Korean)' },
  { id: 'zh', label: 'Manhua (Chinese)' },
];

const STATUSES = [
  { id: 'ongoing', label: 'Ongoing' },
  { id: 'completed', label: 'Completed' },
  { id: 'hiatus', label: 'Hiatus' },
  { id: 'cancelled', label: 'Cancelled' },
];

const SORT_OPTIONS = [
  { id: 'relevance', label: 'Relevance', key: 'order[relevance]', val: 'desc' },
  { id: 'followedCount', label: 'Most Followed', key: 'order[followedCount]', val: 'desc' },
  { id: 'latestUploadedChapter', label: 'Latest Updates', key: 'order[latestUploadedChapter]', val: 'desc' },
  { id: 'rating', label: 'Highest Rated', key: 'order[rating]', val: 'desc' },
  { id: 'createdAt', label: 'Recently Added', key: 'order[createdAt]', val: 'desc' },
];

export default function FilterDrawer({
  filters,
  onChange,
  onReset,
  isOpen,
  onClose,
}) {
  const [tags, setTags] = useState([]);
  const [tagLoading, setTagLoading] = useState(true);
  const [allowMature, setAllowMature] = useState(false);

  useEffect(() => {
    const prefs = getPreferences();
    setAllowMature(Boolean(prefs.allowMature));

    async function loadTags() {
      try {
        const res = await fetch('/api/manga/tags');
        if (res.ok) {
          const json = await res.json();
          const sorted = (json.data || []).sort((a, b) => {
            const nameA = a.attributes?.name?.en || '';
            const nameB = b.attributes?.name?.en || '';
            return nameA.localeCompare(nameB);
          });
          setTags(sorted);
        }
      } catch (err) {
        console.error('[Tags fetch error]', err);
      } finally {
        setTagLoading(false);
      }
    }
    loadTags();
  }, []);

  const handleMatureToggle = (e) => {
    const checked = e.target.checked;
    setAllowMature(checked);
    updatePreference('allowMature', checked);
    onChange({
      ...filters,
      allowMature: checked,
    });
  };

  const toggleArrayItem = (key, item) => {
    const current = filters[key] || [];
    const exists = current.includes(item);
    const updated = exists ? current.filter((x) => x !== item) : [...current, item];
    onChange({ ...filters, [key]: updated });
  };

  const handleTagClick = (tagId) => {
    const included = filters.includedTags || [];
    const excluded = filters.excludedTags || [];

    if (included.includes(tagId)) {
      onChange({
        ...filters,
        includedTags: included.filter((id) => id !== tagId),
        excludedTags: [...excluded, tagId],
      });
    } else if (excluded.includes(tagId)) {
      onChange({
        ...filters,
        excludedTags: excluded.filter((id) => id !== tagId),
      });
    } else {
      onChange({
        ...filters,
        includedTags: [...included, tagId],
      });
    }
  };

  return (
    <div
      className={`${
        isOpen
          ? 'fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm lg:static lg:bg-transparent lg:overflow-visible'
          : 'hidden lg:block'
      }`}
    >
      <div className="min-h-full lg:min-h-0 flex items-start justify-end lg:block">
        <div className="w-full max-w-md lg:max-w-none bg-surface border-l lg:border border-subtle p-5 lg:rounded-2xl space-y-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-subtle">
            <h2 className="text-base font-bold text-text-main flex items-center gap-2">
              <Filter className="w-4 h-4 text-accent-brand" aria-hidden="true" />
              Filter &amp; Sort
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onReset}
                className="text-xs text-text-muted hover:text-accent-brand transition-colors flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-accent-brand rounded p-1"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                Reset
              </button>
              <button
                type="button"
                onClick={onClose}
                className="lg:hidden p-1 rounded-md text-text-muted hover:text-text-main focus-visible:ring-2 focus-visible:ring-accent-brand"
                aria-label="Close filters"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Sort Order */}
          <div className="space-y-2">
            <label htmlFor="sort_select" className="text-xs font-semibold uppercase tracking-wider text-text-muted block">
              Sort By
            </label>
            <select
              id="sort_select"
              value={filters.sort || 'relevance'}
              onChange={(e) => onChange({ ...filters, sort: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-canvas border border-subtle text-sm text-text-main focus:outline-none focus:border-accent-brand focus-visible:ring-2 focus-visible:ring-accent-brand/40"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Original Language */}
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted block">
              Type / Language
            </span>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map((lang) => {
                const active = (filters.originalLanguage || []).includes(lang.id);
                return (
                  <button
                    key={lang.id}
                    type="button"
                    onClick={() => toggleArrayItem('originalLanguage', lang.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors focus-visible:ring-2 focus-visible:ring-accent-brand ${
                      active
                        ? 'bg-orange-600 text-white border-orange-500'
                        : 'bg-surface-hover text-text-muted border-subtle hover:border-strong'
                    }`}
                  >
                    {lang.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Publication Status */}
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted block">
              Status
            </span>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map((status) => {
                const active = (filters.status || []).includes(status.id);
                return (
                  <button
                    key={status.id}
                    type="button"
                    onClick={() => toggleArrayItem('status', status.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors focus-visible:ring-2 focus-visible:ring-accent-brand ${
                      active
                        ? 'bg-orange-600 text-white border-orange-500'
                        : 'bg-surface-hover text-text-muted border-subtle hover:border-strong'
                    }`}
                  >
                    {status.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Demographic */}
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted block">
              Demographic
            </span>
            <div className="flex flex-wrap gap-2">
              {DEMOGRAPHICS.map((demo) => {
                const active = (filters.demographic || []).includes(demo.id);
                return (
                  <button
                    key={demo.id}
                    type="button"
                    onClick={() => toggleArrayItem('demographic', demo.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors focus-visible:ring-2 focus-visible:ring-accent-brand ${
                      active
                        ? 'bg-orange-600 text-white border-orange-500'
                        : 'bg-surface-hover text-text-muted border-subtle hover:border-strong'
                    }`}
                  >
                    {demo.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content Rating / Mature opt-in */}
          <div className="pt-2 border-t border-subtle space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted block">
              Content Rating
            </span>
            <label className="flex items-center gap-3 p-3 rounded-lg bg-surface-hover border border-subtle cursor-pointer hover:border-strong transition-colors">
              <input
                type="checkbox"
                checked={allowMature}
                onChange={handleMatureToggle}
                className="w-4 h-4 rounded text-orange-600 bg-canvas border-subtle focus:ring-accent-brand focus:ring-offset-surface"
              />
              <div className="flex-1 text-xs">
                <span className="font-semibold text-text-main block">Allow Mature Content (Erotica)</span>
                <span className="text-text-muted block mt-0.5">
                  Default: Safe &amp; Suggestive only. Pornographic content is strictly blocked.
                </span>
              </div>
            </label>
          </div>

          {/* Genres & Tags */}
          <div className="pt-2 border-t border-subtle space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted block">
              Tags (Click: + Include / - Exclude)
            </span>

            {tagLoading ? (
              <div className="text-xs text-text-faint animate-pulse">Loading tags…</div>
            ) : (
              <div className="flex flex-wrap gap-1.5 max-h-60 overflow-y-auto pr-1">
                {tags.map((tag) => {
                  const tagId = tag.id;
                  const tagName = tag.attributes?.name?.en || tagId;
                  const isInc = (filters.includedTags || []).includes(tagId);
                  const isExc = (filters.excludedTags || []).includes(tagId);

                  let badgeStyle = 'bg-canvas text-text-muted border-subtle hover:border-strong';
                  if (isInc) {
                    badgeStyle = 'bg-emerald-50 text-emerald-900 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-700 font-semibold';
                  } else if (isExc) {
                    badgeStyle = 'bg-rose-50 text-rose-900 border-rose-300 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-800 line-through';
                  }

                  return (
                    <button
                      key={tagId}
                      type="button"
                      onClick={() => handleTagClick(tagId)}
                      className={`text-[11px] px-2 py-1 rounded-md border transition-all focus-visible:ring-2 focus-visible:ring-accent-brand ${badgeStyle}`}
                    >
                      {isInc && '+ '}
                      {isExc && '- '}
                      {tagName}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
