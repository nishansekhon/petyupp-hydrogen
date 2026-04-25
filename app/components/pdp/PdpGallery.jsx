import {Fragment, useState} from 'react';
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
export default function PdpGallery({images, title}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightbox, setLightbox] = useState({open: false, startIndex: 0});

  if (!images?.length) {
    return (
      <Fragment>
        <div className="hidden lg:block" aria-hidden />
        <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-sm">
          No image available
        </div>
      </Fragment>
    );
  }

  const safeIndex = Math.min(activeIndex, images.length - 1);
  const activeImage = images[safeIndex];
  const railVisible = images.slice(0, RAIL_VISIBLE);
  const overflowCount = Math.max(0, images.length - RAIL_VISIBLE);

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
            {images.map((img, i) => (
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
          {images.length > 1 && (
            <div
              className="flex justify-center gap-1.5 mt-3"
              aria-label={`Image ${safeIndex + 1} of ${images.length}`}
            >
              {images.map((img, i) => (
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
          images={images}
          startIndex={lightbox.startIndex}
          title={title}
          onClose={closeLightbox}
          onIndexChange={setActiveIndex}
        />
      )}
    </Fragment>
  );
}
