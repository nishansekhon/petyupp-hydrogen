export function ProductSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm animate-pulse">
      <div className="aspect-square bg-gray-200" />
      <div className="px-3 pt-3 pb-3 space-y-2">
        <div className="h-3 bg-gray-200 rounded w-5/6" />
        <div className="h-3 bg-gray-200 rounded w-3/5" />
        <div className="h-4 bg-gray-200 rounded w-1/3 mt-3" />
      </div>
    </div>
  );
}

/**
 * @param {{count?: number}}
 */
export function ProductSkeletonGrid({count = 4}) {
  return (
    <>
      {Array.from({length: count}).map((_, i) => (
        <ProductSkeleton key={i} />
      ))}
    </>
  );
}
