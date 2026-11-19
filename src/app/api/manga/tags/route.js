import { NextResponse } from 'next/server';
import { fetchUpstream } from '@/lib/proxy-client';

export async function GET() {
  try {
    const upstreamRes = await fetchUpstream('/manga/tag');
    if (!upstreamRes.ok) {
      return NextResponse.json(
        { error: `Upstream error: ${upstreamRes.statusText}` },
        { status: upstreamRes.status }
      );
    }

    const data = await upstreamRes.json();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=86400',
      },
    });
  } catch (err) {
    console.error('[API /manga/tags Error]', err);
    return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 });
  }
}
