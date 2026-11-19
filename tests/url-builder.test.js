import { describe, it, expect } from 'vitest';
import {
  getProxiedCoverUrl,
  getProxiedPageUrl,
  extractRelationships,
  getDisplayTitle,
} from '../src/lib/mangadex-api.js';

describe('URL Builders & Data Extraction', () => {
  it('should build proxied cover URLs with appropriate thumbnail suffixes', () => {
    const mangaId = '8f3e1818-a015-491d-bd81-3addc4d7d56a';
    const filename = 'cover.png';

    // 512px thumbnail default
    expect(getProxiedCoverUrl(mangaId, filename, '512')).toBe(
      `/api/cover/${mangaId}/cover.png.512.jpg`
    );

    // 256px thumbnail
    expect(getProxiedCoverUrl(mangaId, filename, '256')).toBe(
      `/api/cover/${mangaId}/cover.png.256.jpg`
    );

    // Original unaltered cover
    expect(getProxiedCoverUrl(mangaId, filename, 'original')).toBe(
      `/api/cover/${mangaId}/cover.png`
    );

    // Empty parameters
    expect(getProxiedCoverUrl('', '')).toBe('');
  });

  it('should build proxied page URLs targeting local /api/page route', () => {
    const pageUrl = getProxiedPageUrl({
      baseUrl: 'https://node.mangadex.network',
      quality: 'data-saver',
      hash: 'abc123hash',
      filename: '1-page.jpg',
    });

    expect(pageUrl).toContain('/api/page?');
    expect(pageUrl).toContain('quality=data-saver');
    expect(pageUrl).toContain('hash=abc123hash');
    expect(pageUrl).toContain('filename=1-page.jpg');
    // Ensure it does NOT link directly to upstream
    expect(pageUrl.startsWith('/api/page')).toBe(true);
  });

  it('should extract relationships cleanly from manga object', () => {
    const mockManga = {
      relationships: [
        {
          type: 'cover_art',
          id: 'cover-id-1',
          attributes: { fileName: 'my-cover.jpg' },
        },
        {
          type: 'author',
          id: 'author-1',
          attributes: { name: 'Eichiro Oda' },
        },
        {
          type: 'scanlation_group',
          id: 'group-1',
          attributes: { name: 'TCB Scans' },
        },
      ],
    };

    const rels = extractRelationships(mockManga);
    expect(rels.coverFileName).toBe('my-cover.jpg');
    expect(rels.authors).toEqual(['Eichiro Oda']);
    expect(rels.scanlationGroups[0].name).toBe('TCB Scans');
  });

  it('should format best display title in priority order', () => {
    expect(getDisplayTitle({ attributes: { title: { en: 'One Piece' } } })).toBe('One Piece');
    expect(getDisplayTitle({ attributes: { title: { ja: 'ワンピース' } } })).toBe('ワンピース');
    expect(getDisplayTitle(null)).toBe('Untitled');
  });
});
