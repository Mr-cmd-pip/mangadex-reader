import MangaCard from './MangaCard';

export default function MangaGrid({ mangaList = [], loading = false, count = 12 }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col rounded-xl overflow-hidden bg-surface border border-subtle animate-pulse"
          >
            <div className="aspect-[2/3] w-full bg-skeleton-bg" />
            <div className="p-3 space-y-2">
              <div className="h-4 bg-skeleton-bg rounded w-5/6" />
              <div className="h-3 bg-skeleton-bg rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!mangaList || mangaList.length === 0) {
    return (
      <div className="text-center py-16 px-4 rounded-xl border border-dashed border-subtle bg-surface">
        <p className="text-text-muted font-medium">No manga found</p>
        <p className="text-xs text-text-faint mt-1">Try adjusting your filters or search terms.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {mangaList.map((manga) => (
        <MangaCard key={manga.id} manga={manga} />
      ))}
    </div>
  );
}
