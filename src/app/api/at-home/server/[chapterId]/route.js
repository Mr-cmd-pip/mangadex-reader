import { NextResponse } from 'next/server';
import { fetchUpstream } from '@/lib/proxy-client';

export async function GET(request, { params }) {
  const { chapterId } = await params;
  const { searchParams } = new URL(request.url);
  const force = searchParams.get('force') === 'true';

  try {
    const upstreamRes = await fetchUpstream(`/at-home/server/${chapterId}`, {
      noDedupe: force,
    });

    if (!upstreamRes.ok) {
      return NextResponse.json(
        { error: `Upstream error: ${upstreamRes.statusText}` },
        { status: upstreamRes.status }
      );
    }

    const data = await upstreamRes.json();

    // Cache headers: short cache (max 180s) to guarantee fresh baseUrls
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': force
          ? 'no-store, no-cache, must-revalidate'
          : 'public, max-age=180, stale-while-revalidate=30',
      },
    });
  } catch (err) {
    console.error(`[API /at-home/server/${chapterId} Error]`, err);
    return NextResponse.json({ error: 'Failed to obtain reading server' }, { status: 500 });
  }
}
