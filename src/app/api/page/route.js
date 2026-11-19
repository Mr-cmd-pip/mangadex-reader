import { imageConcurrencyPool } from '@/lib/rate-limiter';
import { reportMangaDexHomeImage } from '@/lib/md-home-reporter';
import { SITE_CONFIG } from '@/../config/site.js';

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  const baseUrl = searchParams.get('baseUrl');
  const quality = searchParams.get('quality') || 'data';
  const hash = searchParams.get('hash');
  const filename = searchParams.get('filename');

  if (!baseUrl || !hash || !filename) {
    return new Response('Missing required page parameters (baseUrl, hash, filename)', {
      status: 400,
    });
  }

  // Sanitize path components
  const safeQuality = quality === 'data-saver' ? 'data-saver' : 'data';
  const safeHash = hash.replace(/[^a-zA-Z0-9]/g, '');
  const safeFilename = filename.replace(/[^a-zA-Z0-9.\-_]/g, '');

  const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const upstreamUrl = `${cleanBase}/${safeQuality}/${safeHash}/${safeFilename}`;

  const startTime = Date.now();

  try {
    return await imageConcurrencyPool.run(async () => {
      let upstreamRes;
      try {
        upstreamRes = await fetch(upstreamUrl, {
          headers: {
            'User-Agent': SITE_CONFIG.upstreamUserAgent,
            // Ensure no auth headers or cookies are ever sent to image servers
          },
          signal: AbortSignal.timeout(20000),
        });
      } catch (fetchErr) {
        // Image fetch failed (connection error, timeout, bad SSL, etc.)
        const duration = Date.now() - startTime;
        reportMangaDexHomeImage({
          url: upstreamUrl,
          success: false,
          cached: false,
          bytes: 0,
          duration,
        });
        throw fetchErr;
      }

      if (!upstreamRes.ok) {
        const duration = Date.now() - startTime;
        reportMangaDexHomeImage({
          url: upstreamUrl,
          success: false,
          cached: false,
          bytes: 0,
          duration,
        });
        return new Response(`Upstream page error: ${upstreamRes.statusText}`, {
          status: upstreamRes.status,
        });
      }

      // Detect cache hit from MangaDex@Home node
      const xCache = upstreamRes.headers.get('X-Cache') || '';
      const isCached = xCache.toUpperCase().startsWith('HIT');

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

      // Cache page images for 24 hours
      responseHeaders.set('Cache-Control', 'public, max-age=86400, immutable');

      // Use a TransformStream to measure bytes streamed without buffering in memory
      let totalBytes = 0;
      const meteringStream = new TransformStream({
        transform(chunk, controller) {
          totalBytes += chunk.byteLength || chunk.length || 0;
          controller.enqueue(chunk);
        },
        flush() {
          const duration = Date.now() - startTime;
          reportMangaDexHomeImage({
            url: upstreamUrl,
            success: true,
            cached: isCached,
            bytes: totalBytes,
            duration,
          });
        },
      });

      const pipedBody = upstreamRes.body.pipeThrough(meteringStream);

      return new Response(pipedBody, {
        status: 200,
        headers: responseHeaders,
      });
    });
  } catch (err) {
    console.error(`[Page Proxy Error] ${upstreamUrl}:`, err);
    return new Response('Page fetch failed', { status: 502 });
  }
}
