'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookOpen, Search, Bookmark, ShieldAlert, Menu, X } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/browse?q=${encodeURIComponent(searchQuery.trim())}`);
      setMobileMenuOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-subtle bg-canvas/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link
          href="/"
          className="flex items-center gap-2.5 text-text-main font-bold tracking-tight text-xl shrink-0 group focus-visible:ring-2 focus-visible:ring-accent-brand rounded-lg p-1"
        >
          <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center text-white shadow-sm group-hover:bg-orange-500 transition-colors">
            <BookOpen className="w-4 h-4" aria-hidden="true" />
          </div>
          <span>Manga<span className="text-orange-500">Verse</span></span>
        </Link>

        {/* Search bar (Desktop) */}
        <form
          onSubmit={handleSearchSubmit}
          className="hidden md:flex flex-1 max-w-md relative items-center"
        >
          <Search className="w-4 h-4 text-text-faint absolute left-3 pointer-events-none" aria-hidden="true" />
          <input
            type="search"
            name="search"
            autoComplete="off"
            spellCheck={false}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search manga, manhwa, manhua…"
            className="w-full pl-9 pr-4 py-1.5 text-sm rounded-lg bg-surface border border-subtle text-text-main placeholder-text-faint focus:outline-none focus:border-accent-brand focus-visible:ring-2 focus-visible:ring-accent-brand/40 transition-colors"
            aria-label="Search manga catalog"
          />
        </form>

        {/* Navigation links (Desktop) */}
        <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-text-muted">
          <Link
            href="/"
            className="px-3 py-1.5 rounded-md hover:text-text-main hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-accent-brand transition-colors"
          >
            Home
          </Link>
          <Link
            href="/browse"
            className="px-3 py-1.5 rounded-md hover:text-text-main hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-accent-brand transition-colors"
          >
            Browse
          </Link>
          <Link
            href="/library"
            className="px-3 py-1.5 rounded-md hover:text-text-main hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-accent-brand transition-colors flex items-center gap-1.5"
          >
            <Bookmark className="w-4 h-4 text-text-muted" aria-hidden="true" />
            Library
          </Link>
          <Link
            href="/takedown"
            className="px-3 py-1.5 rounded-md hover:text-text-main hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-accent-brand transition-colors text-xs text-text-faint"
          >
            DMCA
          </Link>
          <div className="ml-2 pl-2 border-l border-subtle">
            <ThemeToggle />
          </div>
        </nav>

        {/* Mobile menu toggle */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-text-muted hover:text-text-main hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-accent-brand"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open navigation menu'}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" aria-hidden="true" /> : <Menu className="w-6 h-6" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Mobile menu drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-subtle bg-canvas px-4 pt-2 pb-4 space-y-3">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-4 h-4 text-text-faint absolute left-3 top-2.5 pointer-events-none" aria-hidden="true" />
            <input
              type="search"
              name="search_mobile"
              autoComplete="off"
              spellCheck={false}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search catalog…"
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg bg-surface border border-subtle text-text-main placeholder-text-faint focus:outline-none focus:border-accent-brand focus-visible:ring-2 focus-visible:ring-accent-brand/40"
              aria-label="Search catalog"
            />
          </form>
          <nav className="flex flex-col gap-1 text-base font-medium text-text-muted">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-md hover:bg-surface-hover hover:text-text-main focus-visible:ring-2 focus-visible:ring-accent-brand"
            >
              Home
            </Link>
            <Link
              href="/browse"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-md hover:bg-surface-hover hover:text-text-main focus-visible:ring-2 focus-visible:ring-accent-brand"
            >
              Browse Catalog
            </Link>
            <Link
              href="/library"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-md hover:bg-surface-hover hover:text-text-main flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-accent-brand"
            >
              <Bookmark className="w-4 h-4" aria-hidden="true" />
              Library & History
            </Link>
            <Link
              href="/takedown"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-md hover:bg-surface-hover hover:text-text-main text-sm text-text-faint flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-accent-brand"
            >
              <ShieldAlert className="w-4 h-4" aria-hidden="true" />
              Takedowns & DMCA
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
