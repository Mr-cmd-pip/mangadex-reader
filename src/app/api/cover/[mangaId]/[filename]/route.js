import { imageConcurrencyPool } from '@/lib/rate-limiter';
import { SITE_CONFIG } from '@/../config/site.js';

export async function GET(request, { params }) {
  const { mangaId, filename } = await params;

  if (!mangaId || !filename) {
    return new Response('Missing mangaId or filename', { status: 400 });
  }

  // Sanitize filename to prevent directory traversal
  const safeFilename = filename.replace(/[^a-zA-Z0-9.\-_]/g, '');
  const upstreamUrl = `${SITE_CONFIG.mangadex.uploadsBase}/covers/${mangaId}/${safeFilename}`;

  try {
    return await imageConcurrencyPool.run(async () => {
      const upstreamRes = await fetch(upstreamUrl, {
        headers: {
          'User-Agent': SITE_CONFIG.upstreamUserAgent,
        },
        signal: AbortSignal.timeout(15000),
      });

      if (!upstreamRes.ok) {
        return new Response(`Upstream cover error: ${upstreamRes.statusText}`, {
          status: upstreamRes.status,
        });
      }

      const responseHeaders = new Headers();
      responseHeaders.set(
        'Content-Type',
        upstreamRes.headers.get('Content-Type') || 'image/jpeg'
      );
      if (upstreamRes.headers.has('Content-Length')) {
        responseHeaders.set('Content-Length', upstreamRes.headers.get('Content-Length'));
      }
      if (upstreamRes.headers.has('ETag')) {
        responseHeaders.set('ETag', upstreamRes.headers.get('ETag'));
      }
      if (upstreamRes.headers.has('Last-Modified')) {
        responseHeaders.set('Last-Modified', upstreamRes.headers.get('Last-Modified'));
      }

      // 7-day browser & edge caching
      responseHeaders.set('Cache-Control', 'public, max-age=604800, immutable');

      // Stream the response directly to the client without buffering
      return new Response(upstreamRes.body, {
        status: 200,
        headers: responseHeaders,
      });
    });
  } catch (err) {
    console.error(`[Cover Proxy Error] ${upstreamUrl}:`, err);
    return new Response('Cover fetch failed', { status: 502 });
  }
}
