import Link from 'next/link';
import { ShieldCheck, Mail, ArrowLeft, ExternalLink } from 'lucide-react';

export default function TakedownPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-main focus-visible:ring-2 focus-visible:ring-accent-brand rounded transition-colors"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        Back to Home
      </Link>

      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface border border-subtle text-xs font-semibold text-accent-brand">
          <ShieldCheck className="w-4 h-4" aria-hidden="true" />
          Compliance &amp; Removal Policy
        </div>
        <h1 className="text-3xl font-black tracking-tight text-text-main">
          Takedown &amp; DMCA Notices
        </h1>
        <p className="text-sm text-text-muted leading-relaxed text-pretty">
          MangaVerse is an ad-free, non-commercial interface built on the public MangaDex API. We
          do not host, re-encode, or store manga scans on our own servers. All content is proxied
          directly from MangaDex and MangaDex@Home volunteer nodes.
        </p>
      </div>

      <div className="space-y-6 text-sm text-text-main leading-relaxed divide-y divide-subtle">
        <section className="space-y-3 pt-6">
          <h2 className="text-base font-bold text-text-main">For Scanlation Groups</h2>
          <p className="text-text-muted text-pretty">
            We deeply respect scanlation groups and volunteer translators. If your scanlation group
            wishes to opt-out of having your releases displayed on this interface, we will
            immediately add your MangaDex Group UUID to our server-side blocklist (
            <code className="text-xs bg-surface border border-subtle px-1.5 py-0.5 rounded text-accent-brand">
              config/blocklist.json
            </code>
            ). Once added, our proxy route handlers filter out and return HTTP 451 for any chapters
            attributed to your group.
          </p>
        </section>

        <section className="space-y-3 pt-6">
          <h2 className="text-base font-bold text-text-main">For Copyright Holders</h2>
          <p className="text-text-muted text-pretty">
            Because content is proxied upstream in real-time, the most effective way to remove content
            permanently from the network is to contact MangaDex directly per their DMCA policy at{' '}
            <a
              href="https://mangadex.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-brand hover:underline inline-flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-accent-brand rounded"
            >
              mangadex.org <ExternalLink className="w-3 h-3" aria-hidden="true" />
            </a>
            .
          </p>
          <p className="text-text-muted text-pretty">
            However, we also honor direct removal requests for this specific application. Upon notice,
            we will add the requested Manga UUID to our server blocklist to completely prevent this
            service from serving metadata, covers, or chapter pages for that title.
          </p>
        </section>

        <section className="space-y-3 pt-6">
          <h2 className="text-base font-bold text-text-main">How to Submit a Removal Request</h2>
          <p className="text-text-muted">Please contact the site maintainer with the following information:</p>
          <ul className="list-disc pl-5 space-y-1 text-xs text-text-muted">
            <li>Your name, organization, or scanlation group name.</li>
            <li>The MangaDex Manga UUID or Scanlation Group UUID to be blocked.</li>
            <li>A brief statement identifying your rights or relationship to the release.</li>
          </ul>

          <div className="pt-3">
            <div className="flex items-center gap-2 p-4 rounded-xl bg-surface border border-subtle text-xs">
              <Mail className="w-4 h-4 text-accent-brand shrink-0" aria-hidden="true" />
              <span className="text-text-muted">
                Contact email: <strong className="text-text-main">maintainer@example.com</strong> (or submit an issue on our repository).
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
