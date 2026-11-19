import { NextResponse } from 'next/server';
import { fetchUpstream, isBlocklisted } from '@/lib/proxy-client';
import { SITE_CONFIG } from '@/../config/site.js';

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  // Parse and enforce pagination boundaries
  let limit = parseInt(searchParams.get('limit') || '20', 10);
  limit = Math.min(Math.max(1, limit), SITE_CONFIG.pagination.maxBrowseLimit);

  let offset = parseInt(searchParams.get('offset') || '0', 10);
  offset = Math.max(0, offset);

  // Respect MangaDex offset + limit <= 10,000 rule
  if (offset + limit > SITE_CONFIG.pagination.maxOffsetSum) {
    offset = Math.max(0, SITE_CONFIG.pagination.maxOffsetSum - limit);
  }

  // Build query string
  const upstreamParams = new URLSearchParams();

  // Forward query parameters
  for (const [key, value] of searchParams.entries()) {
    if (key === 'limit' || key === 'offset' || key.startsWith('includes')) {
      continue;
    }
    // Block any attempt to request pornographic content
    if (key.startsWith('contentRating') && value === 'pornographic') {
      continue;
    }
    upstreamParams.append(key, value);
  }

  upstreamParams.set('limit', limit.toString());
  upstreamParams.set('offset', offset.toString());

  // If no content rating was provided, default to safe and suggestive
  if (!upstreamParams.has('contentRating[]')) {
    upstreamParams.append('contentRating[]', 'safe');
    upstreamParams.append('contentRating[]', 'suggestive');
  }

  // Always expand essential references
  upstreamParams.append('includes[]', 'cover_art');
  upstreamParams.append('includes[]', 'author');
  upstreamParams.append('includes[]', 'artist');

  try {
    const upstreamRes = await fetchUpstream(`/manga?${upstreamParams.toString()}`);
    if (!upstreamRes.ok) {
      return NextResponse.json(
        { error: `Upstream error: ${upstreamRes.statusText}` },
        { status: upstreamRes.status }
      );
    }

    const data = await upstreamRes.json();

    // Filter out blocklisted manga
    if (data.data && Array.isArray(data.data)) {
      data.data = data.data.filter((manga) => !isBlocklisted({ mangaId: manga.id }));
    }

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (err) {
    console.error('[API /manga Error]', err);
    return NextResponse.json({ error: 'Failed to fetch manga list' }, { status: 500 });
  }
}
