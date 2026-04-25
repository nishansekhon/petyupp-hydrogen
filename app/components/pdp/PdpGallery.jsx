import {Fragment, useEffect, useState} from 'react';
import {ZoomIn} from 'lucide-react';
import PdpImageLightbox from './PdpImageLightbox';

const RAIL_VISIBLE = 5;

// Order used to sort the per-variant gallery so -main always renders first
// (rail's primary thumbnail) and the supporting shots follow a stable
// pedagogical order. Both `guaranted-` (typo) and `guaranteed-` are listed
// because Cloudinary asset names are inconsistent across flavors.
const SUFFIX_ORDER = [
  'main',
  'features',
  'description',
  'lifestyle-multi-view',
  'process',
  'size-guide',
  'breed-chart',
  'guaranted-analysis',
  'guaranteed-analysis',
];

function withWidth(url, width) {
  if (!url || typeof url !== 'string') return url;
  try {
    const u = new URL(url);
    u.searchParams.set('width', String(width));
    return u.toString();
  } catch {
    return url;
  }
}

// Extract the flavor token from a variant.image URL like
//   .../files/petyupp-4796-blueberry-large-3.5oz-cheese-chew-main.webp?v=...
// Returns "blueberry". Used to group product.images by the active variant.
function extractFlavorToken(url) {
  if (!url || typeof url !== 'string') return null;
  const m = url.match(/petyupp-\d+-([a-z-]+?)-large-3\.5oz-cheese-chew-/i);
  return m ? m[1].toLowerCase() : null;
}

// Suffix appears between "cheese-chew-" and the extension. Used for sort
// order in the per-variant gallery. Returns null if URL doesn't match.
function extractSuffix(url) {
  if (!url || typeof url !== 'string') return null;
  const m = url.match(/cheese-chew-([a-z-]+?)\.(?:webp|jpg|jpeg|png)/i);
  return m ? m[1].toLowerCase() : null;
}

// Build the per-variant gallery by grouping `images` by URL token.
// Returns a sorted array (main first, supporting after) or null when the
// token can't be extracted or no matches are found in the image set.
function buildVariantGallery(variantImageUrl, images) {
  const token = extractFlavorToken(variantImageUrl);
  if (!token) return null;
  const needle = `-${token}-large-3.5oz-cheese-chew-`;
  const matches = (images ?? []).filter((img) =>
    img?.url?.toLowerCase().includes(needle),
  );
  if (matches.length === 0) return null;
  return matches.slice().sort((a, b) => {
    const aIdx = SUFFIX_ORDER.indexOf(extractSuffix(a.url));
    const bIdx = SUFFIX_ORDER.indexOf(extractSuffix(b.url));
    // unknown suffixes go after known ones, in original order
    const aRank = aIdx === -1 ? SUFFIX_ORDER.length : aIdx;
    const bRank = bIdx === -1 ? SUFFIX_ORDER.length : bIdx;
    return aRank - bRank;
  });
}

// PdpGallery returns a Fragment of two siblings so the parent route's CSS
// grid receives them as direct grid items: column 1 = vertical thumbnail
// rail (desktop only), column 2 = hero. On mobile the rail is hidden and
// the hero section also renders a horizontal-scroll thumbnail strip.
//
// Source-of-truth precedence:
//   1. productHasVariantImagery true AND token-matched group ≥1 →
//      gallery = the per-variant group filtered from product.images by the
//      flavor token in variant.image.url. This gives the rail the full
//      8-shot variant gallery (main + features/description/lifestyle/
//      process/size-guide/breed-chart/guaranteed-analysis) instead of a
//      single thumbnail. Storefront API doesn't expose ProductVariant.media
//      so we group via URL pattern matching against product.images.
//   2. productHasVariantImagery true AND token group empty → fallback to
//      [variantImage] (the original Phase 5.5b behavior; protects against
//      future variants whose URLs don't match the pattern).
//   3. productHasVariantImagery false → use the `images` prop (Plain
//      pattern: Size variants share the same product hero, so the full
//      product-level image set is the right gallery).
export default function PdpGallery({
  images,
  selectedVariant,
  productHasVariantImagery,
  title,
}) {
  const variantImage = selectedVariant?.image;

  let gallery;
  if (productHasVariantImagery && variantImage?.url) {
    const grouped = buildVariantGallery(variantImage.url, images);
    gallery = grouped && grouped.length > 0 ? grouped : [variantImage];
  } else {
    gallery = images ?? [];
  }

  const [activeIndex, setActiveIndex] = useState(0);
  const [lightbox, setLightbox] = useState({open: false, startIndex: 0});

  // Reset hero/rail position when the active variant changes. Without this
  // the index can outrun a smaller variantMedia array (e.g. clicking a
  // flavor whose media has 1 entry while activeIndex sat at 3 from a
  // prior product-level fallback).
  useEffect(() => {
    setActiveIndex(0);
  }, [selectedVariant?.id]);

  if (!gallery.length) {
    return (
      <Fragment>
        <div className="hidden lg:block" aria-hidden />
        <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-sm">
          No image available
        </div>
      </Fragment>
    );
  }

  const safeIndex = Math.min(activeIndex, gallery.length - 1);
  const activeImage = gallery[safeIndex];
  const railVisible = gallery.slice(0, RAIL_VISIBLE);
  const overflowCount = Math.max(0, gallery.length - RAIL_VISIBLE);

  const openLightbox = (idx) => setLightbox({open: true, startIndex: idx});
  const closeLightbox = () => setLightbox((l) => ({...l, open: false}));

  return (
    <Fragment>
      {/* COL 1 — Vertical thumbnail rail (desktop only) */}
      <div className="hidden lg:flex flex-col gap-2">
        {railVisible.map((img, i) => {
          const isLastSlot = i === RAIL_VISIBLE - 1 && overflowCount > 0;
          return (
            <button
              key={img.id ?? i}
              type="button"
              onClick={() => {
                setActiveIndex(i);
                if (isLastSlot) openLightbox(RAIL_VISIBLE - 1);
              }}
              aria-label={
                isLastSlot
                  ? `Show ${overflowCount} more images`
                  : `Show image ${i + 1}`
              }
              aria-current={i === safeIndex}
              className={`relative w-[60px] aspect-square rounded-md overflow-hidden bg-[#FDF8F4] transition-colors ${
                i === safeIndex
                  ? 'border-[1.5px] border-[#06B6D4]'
                  : 'border-[0.5px] border-gray-200 hover:border-gray-300'
              }`}
            >
              <img
                src={withWidth(img.url, 200)}
                alt={img.altText || title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              {isLastSlot && (
                <span className="absolute inset-0 bg-black/55 text-white text-xs font-medium flex items-center justify-center">
                  +{overflowCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* COL 2 — Hero (+ mobile horizontal strip) */}
      <div className="flex flex-col gap-3 min-w-0">
        <div className="relative aspect-square w-full max-w-[480px] mx-auto lg:mx-0 rounded-lg overflow-hidden bg-[#FDF8F4]">
          <button
            type="button"
            onClick={() => openLightbox(safeIndex)}
            aria-label={`Expand image: ${activeImage.altText || title}`}
            className="block w-full h-full"
          >
            <img
              src={withWidth(activeImage.url, 1200)}
              alt={activeImage.altText || title}
              width={activeImage.width}
              height={activeImage.height}
              className="w-full h-full object-contain"
            />
          </button>
          <span
            aria-hidden
            className="pointer-events-none absolute top-2.5 right-2.5 inline-flex items-center gap-1 bg-white/95 text-gray-700 text-[11px] font-medium px-2.5 py-1 rounded-md border-[0.5px] border-gray-200 shadow-sm"
          >
            <ZoomIn size={12} strokeWidth={2} />
            Click to expand
          </span>
        </div>

        {/* Mobile horizontal scroll strip + dots */}
        <div className="lg:hidden">
          <div
            className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4 px-4 gap-2"
            onScroll={(e) => {
              const el = e.currentTarget;
              const idx = Math.round(el.scrollLeft / el.clientWidth);
              if (idx !== activeIndex) setActiveIndex(idx);
            }}
          >
            {gallery.map((img, i) => (
              <button
                key={img.id ?? i}
                type="button"
                onClick={() => openLightbox(i)}
                className="shrink-0 snap-start w-full aspect-square rounded-lg overflow-hidden bg-[#FDF8F4] border border-gray-100"
                aria-label={`Expand image ${i + 1}`}
              >
                <img
                  src={withWidth(img.url, 900)}
                  alt={img.altText || title}
                  className="w-full h-full object-contain"
                />
              </button>
            ))}
          </div>
          {gallery.length > 1 && (
            <div
              className="flex justify-center gap-1.5 mt-3"
              aria-label={`Image ${safeIndex + 1} of ${gallery.length}`}
            >
              {gallery.map((img, i) => (
                <span
                  key={img.id ?? `dot-${i}`}
                  aria-hidden
                  className={`h-1.5 rounded-full transition-all ${
                    i === safeIndex ? 'w-6 bg-gray-900' : 'w-1.5 bg-gray-300'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {lightbox.open && (
        <PdpImageLightbox
          images={gallery}
          startIndex={lightbox.startIndex}
          title={title}
          onClose={closeLightbox}
          onIndexChange={setActiveIndex}
        />
      )}
    </Fragment>
  );
}
