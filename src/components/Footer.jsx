import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-subtle bg-canvas text-text-muted py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-sm">
        <div className="flex flex-col items-center md:items-start gap-1">
          <p className="text-text-main font-semibold tracking-tight">
            Manga<span className="text-orange-500">Verse</span>
          </p>
          <p className="text-xs text-text-faint max-w-md text-center md:text-left text-pretty">
            An open reader interface respecting creators and scanlation teams. All content is proxied
            server-side with strict rate-limiting compliance.
          </p>
        </div>

        {/* Required MangaDex Attribution */}
        <div className="flex flex-col items-center md:items-end gap-2 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-text-faint">Data &amp; images:</span>
            <a
              href="https://mangadex.org"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface border border-subtle text-accent-brand hover:text-accent-hover hover:border-accent-brand/40 focus-visible:ring-2 focus-visible:ring-accent-brand transition-colors font-semibold"
            >
              Powered by MangaDex
            </a>
          </div>

          <div className="flex items-center gap-4 text-text-muted">
            <Link href="/browse" className="hover:text-text-main focus-visible:ring-2 focus-visible:ring-accent-brand transition-colors">
              Browse
            </Link>
            <Link href="/library" className="hover:text-text-main focus-visible:ring-2 focus-visible:ring-accent-brand transition-colors">
              Library
            </Link>
            <Link href="/takedown" className="text-accent-brand hover:text-accent-hover focus-visible:ring-2 focus-visible:ring-accent-brand transition-colors">
              DMCA &amp; Takedown Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
