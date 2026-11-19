import { NextResponse } from 'next/server';
import { fetchUpstream, isBlocklisted } from '@/lib/proxy-client';

export async function GET(request, { params }) {
  const { id } = await params;

  if (isBlocklisted({ mangaId: id })) {
    return NextResponse.json({ error: 'This title has been removed' }, { status: 451 });
  }

  const query = new URLSearchParams({
    'includes[]': ['cover_art', 'author', 'artist'],
  });

  try {
    const upstreamRes = await fetchUpstream(`/manga/${id}?includes[]=cover_art&includes[]=author&includes[]=artist`);
    if (!upstreamRes.ok) {
      return NextResponse.json(
        { error: `Upstream error: ${upstreamRes.statusText}` },
        { status: upstreamRes.status }
      );
    }

    const data = await upstreamRes.json();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600',
      },
    });
  } catch (err) {
    console.error(`[API /manga/${id} Error]`, err);
    return NextResponse.json({ error: 'Failed to fetch manga details' }, { status: 500 });
  }
}
