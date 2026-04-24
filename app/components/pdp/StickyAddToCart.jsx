import {useEffect, useRef, useState} from 'react';
import {CartForm, Money} from '@shopify/hydrogen';

function withWidth(url, w) {
  if (!url || typeof url !== 'string') return url;
  try {
    const u = new URL(url);
    u.searchParams.set('width', String(w));
    return u.toString();
  } catch {
    return url;
  }
}

/**
 * Mobile-only sticky purchase bar. Appears once the provided target
 * element scrolls out of view (typically the primary Add to cart
 * button).
 */
export default function StickyAddToCart({
  targetRef,
  product,
  selectedVariant,
  quantity = 1,
  onAfterAdd,
}) {
  const [visible, setVisible] = useState(false);
  const observerRef = useRef(null);

  useEffect(() => {
    const el = targetRef?.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        // Show the sticky bar only when the main CTA is fully off-screen.
        setVisible(!entry.isIntersecting);
      },
      {threshold: 0},
    );
    observerRef.current.observe(el);
    return () => observerRef.current?.disconnect();
  }, [targetRef]);

  if (!selectedVariant) return null;

  const image = product?.images?.nodes?.[0] ?? product?.featuredImage;
  const outOfStock = !selectedVariant.availableForSale;
  const lines = [
    {
      merchandiseId: selectedVariant.id,
      quantity,
      selectedVariant,
    },
  ];

  return (
    <div
      role="region"
      aria-label="Product purchase options"
      aria-hidden={!visible}
      className={`md:hidden fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white shadow-[0_-4px_12px_rgba(0,0,0,0.08)] transition-transform duration-200 ${
        visible ? 'translate-y-0' : 'translate-y-full'
      }`}
      style={{
        paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))',
      }}
    >
      <div className="flex items-center gap-3 px-4 py-2">
        {image?.url && (
          <img
            src={withWidth(image.url, 96)}
            alt={image.altText || product?.title || ''}
            className="w-12 h-12 rounded-md object-cover bg-gray-100 shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900 truncate">
            {product?.title}
          </div>
          <div className="text-sm text-gray-900 font-medium">
            {selectedVariant?.price && <Money data={selectedVariant.price} />}
          </div>
        </div>
        <CartForm
          route="/cart"
          action={CartForm.ACTIONS.LinesAdd}
          inputs={{lines}}
        >
          {(fetcher) => {
            const submitting = fetcher.state !== 'idle';
            return (
              <button
                type="submit"
                onClick={onAfterAdd}
                disabled={outOfStock || submitting}
                className="shrink-0 bg-[#06B6D4] hover:bg-[#0891B2] text-white text-sm font-medium rounded-lg px-4 py-2.5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {outOfStock
                  ? 'Sold out'
                  : submitting
                  ? 'Adding…'
                  : 'Add to cart'}
              </button>
            );
          }}
        </CartForm>
      </div>
    </div>
  );
}
