import {useState} from 'react';

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

export default function PdpGallery({images, title}) {
  const [activeIndex, setActiveIndex] = useState(0);
  if (!images?.length) {
    return (
      <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-sm">
        No image available
      </div>
    );
  }
  const activeImage = images[activeIndex] ?? images[0];

  return (
    <div className="flex flex-col gap-3">
      {/* Desktop + tablet main image */}
      <div className="hidden md:block aspect-square rounded-lg overflow-hidden bg-gray-50 border border-gray-100">
        <img
          src={withWidth(activeImage.url, 1200)}
          alt={activeImage.altText || title}
          width={activeImage.width}
          height={activeImage.height}
          className="w-full h-full object-contain"
        />
      </div>

      {/* Mobile swipeable gallery with snap + dots */}
      <div className="md:hidden">
        <div
          className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4 px-4 gap-2"
          onScroll={(e) => {
            const el = e.currentTarget;
            const idx = Math.round(el.scrollLeft / el.clientWidth);
            if (idx !== activeIndex) setActiveIndex(idx);
          }}
        >
          {images.map((img, i) => (
            <div
              key={img.id ?? i}
              className="shrink-0 snap-start w-full aspect-square rounded-lg overflow-hidden bg-gray-50 border border-gray-100"
            >
              <img
                src={withWidth(img.url, 900)}
                alt={img.altText || title}
                className="w-full h-full object-contain"
              />
            </div>
          ))}
        </div>
        {images.length > 1 && (
          <div
            className="flex justify-center gap-1.5 mt-3"
            aria-label={`Image ${activeIndex + 1} of ${images.length}`}
          >
            {images.map((_, i) => (
              <span
                key={i}
                aria-hidden
                className={`h-1.5 rounded-full transition-all ${
                  i === activeIndex ? 'w-6 bg-gray-900' : 'w-1.5 bg-gray-300'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnail strip — desktop only */}
      {images.length > 1 && (
        <ul className="hidden md:grid grid-cols-5 gap-2">
          {images.slice(0, 5).map((img, i) => (
            <li key={img.id ?? i}>
              <button
                type="button"
                onClick={() => setActiveIndex(i)}
                aria-label={`Show image ${i + 1}`}
                aria-current={i === activeIndex}
                className={`w-full aspect-square rounded-md overflow-hidden border-2 transition-colors ${
                  i === activeIndex
                    ? 'border-[#06B6D4]'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <img
                  src={withWidth(img.url, 300)}
                  alt={img.altText || title}
                  className="w-full h-full object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
