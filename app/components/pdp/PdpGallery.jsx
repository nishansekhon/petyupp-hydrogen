import {Fragment, useEffect, useState} from 'react';
import {ZoomIn} from 'lucide-react';
import PdpImageLightbox from './PdpImageLightbox';

const RAIL_VISIBLE = 5;

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

// PdpGallery returns a Fragment of two siblings so the parent route's CSS
// grid receives them as direct grid items: column 1 = vertical thumbnail
// rail (desktop only), column 2 = hero. On mobile the rail is hidden and
// the hero section also renders a horizontal-scroll thumbnail strip.
//
// Source-of-truth precedence (Phase 5.5b imagery):
//   1. productHasVariantImagery (multiple variants own distinct images,
//      detected once in the route) AND selectedVariant.image present →
//      gallery = [variantImage]. Storefront API does NOT expose
//      ProductVariant.media (Admin-only), and Phase 5.5b uploaded
//      exactly one media per flavored variant — so the variant-scoped
//      gallery is just the single hero per variant. The rail tracks the
//      active swatch instead of showing every flavor's pack at once.
//   2. fallback: `images` prop (route-built productImages with b4d0459's
//      hero-prepend logic). Plain inherits the same hero across all
//      Size variants, so its gallery should keep the full product-level
//      image set (lifestyle, breed chart, process shots, etc.).
export default function PdpGallery({
  images,
  selectedVariant,
  productHasVariantImagery,
  title,
}) {
  const variantImage = selectedVariant?.image;
  const gallery =
    productHasVariantImagery && variantImage?.url
      ? [variantImage]
      : images ?? [];

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
