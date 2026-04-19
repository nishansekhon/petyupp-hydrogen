import {useEffect, useMemo, useState} from 'react';
import {Image} from '@shopify/hydrogen';

/**
 * @param {{
 *   variantImage: any;
 *   images: Array<any>;
 * }}
 */
export function ProductImageGallery({variantImage, images}) {
  const gallery = useMemo(() => {
    const list = Array.isArray(images) ? images.filter(Boolean) : [];
    if (variantImage && !list.some((img) => img?.id === variantImage.id)) {
      return [variantImage, ...list];
    }
    return list.length > 0 ? list : variantImage ? [variantImage] : [];
  }, [variantImage, images]);

  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!variantImage) return;
    const idx = gallery.findIndex((img) => img?.id === variantImage.id);
    if (idx >= 0) setActiveIndex(idx);
  }, [variantImage, gallery]);

  const mainImage = gallery[activeIndex] ?? variantImage;

  if (!mainImage) {
    return <div className="aspect-square w-full rounded-xl bg-gray-100" />;
  }

  return (
    <div>
      <div className="aspect-square overflow-hidden rounded-xl bg-gray-50">
        <Image
          alt={mainImage.altText || 'Product image'}
          aspectRatio="1/1"
          data={mainImage}
          key={mainImage.id}
          sizes="(min-width: 45em) 50vw, 100vw"
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
              <Image
                alt={img.altText || `Thumbnail ${idx + 1}`}
                aspectRatio="1/1"
                data={img}
                sizes="64px"
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
