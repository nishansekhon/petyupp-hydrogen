import {useEffect, useState} from 'react';
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
 * Mobile sticky add-to-cart bar (Allbirds pattern). Slides up once the user
 * scrolls past the in-flow buy box. Hidden on lg+; uses CartForm.ACTIONS.LinesAdd
 * — same cart endpoint PdpBuyBox uses, no duplicated logic.
 *
 * Visibility logic via IntersectionObserver on a sentinel placed right after
 * PdpBuyBox: bar shows only when the sentinel has scrolled ABOVE the viewport
 * top (entry.boundingClientRect.top < 0). Plain `!isIntersecting` would also
 * fire while the sentinel is still below the viewport (page just loaded), so
 * the directional check is needed to keep the bar hidden until the user
 * actually scrolls past the buy box.
 */
export default function PdpStickyAddToCart({
  sentinelRef,
  product,
  selectedVariant,
  quantity = 1,
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = sentinelRef?.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const aboveViewport = entry.boundingClientRect.top < 0;
        setVisible(!entry.isIntersecting && aboveViewport);
      },
      {threshold: 0},
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [sentinelRef]);

  if (!selectedVariant) return null;

  const variantImage = selectedVariant.image;
  const outOfStock = !selectedVariant.availableForSale;
  // Generic detect: if the active variant carries a Flavor option, surface
  // its value as a sub-line. Avoids handle-coding for himalayan-flavored-
  // variety; works for any future product with a Flavor axis.
  const flavorOption = selectedVariant.selectedOptions?.find(
    (o) => o.name === 'Flavor',
  );
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
      aria-label="Quick add to cart"
      aria-hidden={!visible}
      className={`lg:hidden fixed inset-x-0 bottom-0 z-40 bg-white border-t border-gray-200 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] transition-transform duration-200 ease-out ${
        visible ? 'translate-y-0' : 'translate-y-full pointer-events-none'
      }`}
      style={{paddingBottom: 'env(safe-area-inset-bottom)'}}
    >
      <div className="flex items-center gap-3 h-16 px-4">
        {variantImage?.url && (
          <img
            src={withWidth(variantImage.url, 96)}
            alt={variantImage.altText || selectedVariant.title || ''}
            className="w-12 h-12 rounded-md object-cover bg-gray-100 border border-gray-200 shrink-0"
          />
        )}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <div className="text-sm font-medium text-gray-900 truncate leading-tight">
            {product?.title}
          </div>
          {flavorOption && (
            <div className="text-[11px] text-gray-500 truncate leading-tight">
              {flavorOption.value}
            </div>
          )}
          {selectedVariant.price && (
            <div className="text-sm font-medium text-[#06B6D4] leading-tight mt-0.5">
              <Money data={selectedVariant.price} />
            </div>
          )}
        </div>
        <CartForm
          route="/cart"
          action={CartForm.ACTIONS.LinesAdd}
          inputs={{lines}}
        >
          {(fetcher) => {
            const submitting = fetcher.state !== 'idle';
            const label = outOfStock
              ? 'Out of stock'
              : submitting
              ? 'Adding…'
              : 'Add to cart';
            return (
              <button
                type="submit"
                disabled={outOfStock || submitting}
                className="shrink-0 bg-[#06B6D4] hover:bg-[#0891B2] disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-medium rounded-full px-5 py-2.5 transition-colors"
              >
                {label}
              </button>
            );
          }}
        </CartForm>
      </div>
    </div>
  );
}
