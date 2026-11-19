import { NextResponse } from 'next/server';
import { fetchUpstream, isBlocklisted } from '@/lib/proxy-client';

export async function GET(request, { params }) {
  const { id } = await params;

  try {
    const upstreamRes = await fetchUpstream(`/chapter/${id}?includes[]=scanlation_group&includes[]=manga&includes[]=user`);
    if (!upstreamRes.ok) {
      return NextResponse.json(
        { error: `Upstream error: ${upstreamRes.statusText}` },
        { status: upstreamRes.status }
      );
    }

    const data = await upstreamRes.json();

    // Blocklist check
    const mangaRel = data.data?.relationships?.find((r) => r.type === 'manga');
    const groupRel = data.data?.relationships?.find((r) => r.type === 'scanlation_group');

    if (
      (mangaRel && isBlocklisted({ mangaId: mangaRel.id })) ||
      (groupRel && isBlocklisted({ groupId: groupRel.id }))
    ) {
      return NextResponse.json({ error: 'This chapter has been removed' }, { status: 451 });
    }

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600',
      },
    });
  } catch (err) {
    console.error(`[API /chapter/${id} Error]`, err);
    return NextResponse.json({ error: 'Failed to fetch chapter' }, { status: 500 });
  }
}
