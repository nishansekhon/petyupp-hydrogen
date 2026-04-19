import {useEffect, useMemo, useState} from 'react';

/**
 * Renders the product hero image + optional thumbnail strip for the PDP.
 *
 * Plain <img> tags here rather than Hydrogen's <Image> because Hydrogen's
 * Image silently renders nothing when the data object lacks one of its
 * expected fields, which was leaving the PDP left column blank on products
 * with non-standard image metadata.
 *
 * @param {{
 *   variantImage: any;
 *   images: Array<any>;
 * }}
 */
export function ProductImageGallery({variantImage, images}) {
  const gallery = useMemo(() => {
    const list = Array.isArray(images)
      ? images.filter((img) => img?.url)
      : [];
    const variantHasUrl = variantImage?.url;
    if (
      variantHasUrl &&
      !list.some((img) => img?.id === variantImage.id)
    ) {
      return [variantImage, ...list];
    }
    return list.length > 0 ? list : variantHasUrl ? [variantImage] : [];
  }, [variantImage, images]);

  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!variantImage?.url) return;
    const idx = gallery.findIndex((img) => img?.id === variantImage.id);
    if (idx >= 0) setActiveIndex(idx);
  }, [variantImage, gallery]);

  const mainImage = gallery[activeIndex] ?? null;

  if (!mainImage?.url) {
    return (
      <div
        aria-hidden="true"
        className="aspect-square w-full rounded-xl bg-gray-50 flex items-center justify-center text-6xl text-gray-300"
      >
        🐾
      </div>
    );
  }

  return (
    <div>
      <div className="aspect-square overflow-hidden rounded-xl bg-gray-50">
        <img
          key={mainImage.id || mainImage.url}
          src={mainImage.url}
          alt={mainImage.altText || 'Product image'}
          width={mainImage.width || 800}
          height={mainImage.height || 800}
          loading="eager"
          decoding="async"
          className="w-full h-full object-cover"
        />
      </div>
      {gallery.length > 1 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {gallery.map((img, idx) => (
            <button
              key={img.id ?? idx}
              type="button"
              onClick={() => setActiveIndex(idx)}
              aria-label={`Show image ${idx + 1}`}
              aria-current={idx === activeIndex}
              className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                idx === activeIndex
                  ? 'border-[#06B6D4]'
                  : 'border-transparent hover:border-gray-300'
              }`}
            >
              <img
                src={img.url}
                alt={img.altText || `Thumbnail ${idx + 1}`}
                width={img.width || 200}
                height={img.height || 200}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
