/**
 * Helper utilities for MangaDex URL formatting and client-side querying
 * All generated URLs point to the local server proxy (/api/*), NEVER upstream directly.
 */

/**
 * Builds a local proxied URL for a manga cover image.
 * @param {string} mangaId - The Manga UUID
 * @param {string} filename - Cover filename from cover_art relationship
 * @param {'256' | '512' | 'original'} [size='512'] - Requested thumbnail width
 * @returns {string} Local proxy URL
 */
export function getProxiedCoverUrl(mangaId, filename, size = '512') {
  if (!mangaId || !filename) return '';

  let actualFilename = filename;
  if (size === '256') {
    actualFilename = `${filename}.256.jpg`;
  } else if (size === '512') {
    actualFilename = `${filename}.512.jpg`;
  }

  return `/api/cover/${mangaId}/${actualFilename}`;
}

/**
 * Builds a local proxied URL for a chapter page.
 * @param {Object} params
 * @param {string} params.baseUrl - Node baseUrl from /at-home/server
 * @param {'data' | 'data-saver'} params.quality - Requested quality
 * @param {string} params.hash - Chapter hash
 * @param {string} params.filename - Page filename
 * @returns {string} Local proxy URL
 */
export function getProxiedPageUrl({ baseUrl, quality = 'data', hash, filename }) {
  if (!baseUrl || !hash || !filename) return '';
  const searchParams = new URLSearchParams({
    baseUrl,
    quality: quality === 'data-saver' ? 'data-saver' : 'data',
    hash,
    filename,
  });
  return `/api/page?${searchParams.toString()}`;
}

/**
 * Extracts relationship data from MangaDex entities (e.g. cover_art, author, artist)
 */
export function extractRelationships(entity) {
  if (!entity || !entity.relationships) return {};

  const result = {
    cover: null,
    coverFileName: null,
    authors: [],
    artists: [],
    scanlationGroups: [],
  };

  for (const rel of entity.relationships) {
    if (rel.type === 'cover_art') {
      result.cover = rel;
      if (rel.attributes?.fileName) {
        result.coverFileName = rel.attributes.fileName;
      }
    } else if (rel.type === 'author') {
      result.authors.push(rel.attributes?.name || rel.id);
    } else if (rel.type === 'artist') {
      result.artists.push(rel.attributes?.name || rel.id);
    } else if (rel.type === 'scanlation_group') {
      result.scanlationGroups.push({
        id: rel.id,
        name: rel.attributes?.name || 'Unknown Group',
        website: rel.attributes?.website,
      });
    }
  }

  return result;
}

/**
 * Extracts the best display title from a MangaDex title object
 */
export function getDisplayTitle(manga) {
  if (!manga || !manga.attributes) return 'Untitled';
  const titles = manga.attributes.title || {};
  return (
    titles.en ||
    titles['ja-ro'] ||
    titles.ja ||
    titles['ko-ro'] ||
    titles.ko ||
    Object.values(titles)[0] ||
    'Untitled'
  );
}

/**
 * Extracts description from a MangaDex description object
 */
export function getDisplayDescription(manga) {
  if (!manga || !manga.attributes) return '';
  const desc = manga.attributes.description || {};
  return desc.en || Object.values(desc)[0] || '';
}
