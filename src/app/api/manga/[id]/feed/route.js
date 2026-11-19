import { NextResponse } from 'next/server';
import { fetchUpstream, isBlocklisted } from '@/lib/proxy-client';
import { SITE_CONFIG } from '@/../config/site.js';

export async function GET(request, { params }) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);

  if (isBlocklisted({ mangaId: id })) {
    return NextResponse.json({ error: 'This title has been removed' }, { status: 451 });
  }

  let limit = parseInt(searchParams.get('limit') || '100', 10);
  limit = Math.min(Math.max(1, limit), SITE_CONFIG.pagination.maxFeedLimit);

  let offset = parseInt(searchParams.get('offset') || '0', 10);
  offset = Math.max(0, offset);

  const upstreamParams = new URLSearchParams();
  for (const [key, value] of searchParams.entries()) {
    if (key === 'limit' || key === 'offset' || key.startsWith('includes')) {
      continue;
    }
    if (key.startsWith('contentRating') && value === 'pornographic') {
      continue;
    }
    upstreamParams.append(key, value);
  }

  upstreamParams.set('limit', limit.toString());
  upstreamParams.set('offset', offset.toString());

  // Default content rating
  if (!upstreamParams.has('contentRating[]')) {
    upstreamParams.append('contentRating[]', 'safe');
    upstreamParams.append('contentRating[]', 'suggestive');
  }

  // Include scanlation group and user
  upstreamParams.append('includes[]', 'scanlation_group');
  upstreamParams.append('includes[]', 'user');

  try {
    const upstreamRes = await fetchUpstream(`/manga/${id}/feed?${upstreamParams.toString()}`);
    if (!upstreamRes.ok) {
      return NextResponse.json(
        { error: `Upstream error: ${upstreamRes.statusText}` },
        { status: upstreamRes.status }
      );
    }

    const data = await upstreamRes.json();

    // Filter out chapters from blocklisted scanlation groups
    if (data.data && Array.isArray(data.data)) {
      data.data = data.data.filter((chapter) => {
        const groupRel = chapter.relationships?.find((r) => r.type === 'scanlation_group');
        if (groupRel && isBlocklisted({ groupId: groupRel.id })) {
          return false;
        }
        return true;
      });
    }

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      },
    });
  } catch (err) {
    console.error(`[API /manga/${id}/feed Error]`, err);
    return NextResponse.json({ error: 'Failed to fetch chapter feed' }, { status: 500 });
  }
}
