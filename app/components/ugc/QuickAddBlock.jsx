import {useEffect, useRef, useState} from 'react';
import {Link} from 'react-router';
import {CartForm} from '@shopify/hydrogen';

function formatMoney(money) {
  if (!money?.amount) return null;
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: money.currencyCode || 'USD',
    }).format(parseFloat(money.amount));
  } catch {
    return `$${money.amount}`;
  }
}

function AddButton({fetcher, disabled, outOfStock, label, dark}) {
  const [justAdded, setJustAdded] = useState(false);
  const wasSubmittingRef = useRef(false);

  useEffect(() => {
    if (fetcher.state === 'submitting') {
      wasSubmittingRef.current = true;
    }
    if (
      fetcher.state === 'idle' &&
      wasSubmittingRef.current &&
      fetcher.data?.cart
    ) {
      wasSubmittingRef.current = false;
      setJustAdded(true);
      const t = setTimeout(() => setJustAdded(false), 2000);
      return () => clearTimeout(t);
    }
  }, [fetcher.state, fetcher.data]);

  const submitting = fetcher.state !== 'idle';
  const text = submitting
    ? 'Adding…'
    : justAdded
    ? 'Added ✓'
    : outOfStock
    ? 'Out of stock'
    : label;

  const disabledClass = dark
    ? 'disabled:bg-white/20 disabled:text-white/60'
    : 'disabled:bg-gray-300 disabled:text-gray-500';

  return (
    <button
      type="submit"
      disabled={disabled || outOfStock || submitting}
      className={`block w-full text-center bg-[#06B6D4] hover:bg-[#0891B2] text-white text-sm font-medium rounded-lg py-3.5 px-4 transition-colors disabled:cursor-not-allowed ${disabledClass}`}
    >
      {text}
    </button>
  );
}

function FallbackShopNow({href, productName, onClose, dark}) {
  const nameClass = dark
    ? 'text-white'
    : 'text-[var(--text-primary)]';
  return (
    <div className="flex flex-col gap-2">
      <p className={`text-[15px] font-medium leading-tight ${nameClass}`}>
        {productName}
      </p>
      <Link
        to={href}
        onClick={onClose}
        className="block w-full text-center bg-[#06B6D4] hover:bg-[#0891B2] text-white text-sm font-medium rounded-lg py-3.5 px-4 transition-colors"
      >
        Shop now →
      </Link>
    </div>
  );
}

/**
 * Inline quick-add block inside the video modal.
 *
 * Product data is fetched by VideoModal (single fetcher) and passed in —
 * this component is presentational + owns the selected-variant + per-add
 * state only.
 *
 * @param {{
 *   clip: object,              // manifest clip (for handle, productName, href fallback)
 *   product: object | null,    // Storefront product, or null while loading / not found
 *   loading: boolean,
 *   error: boolean,
 *   dark?: boolean,            // true = mobile scrim theme, false = desktop aside theme
 *   onClose: () => void,
 *   showTrustLine?: boolean,
 * }}
 */
export default function QuickAddBlock({
  clip,
  product,
  loading,
  error,
  dark = false,
  onClose,
  showTrustLine = true,
}) {
  const [selectedVariantId, setSelectedVariantId] = useState(null);

  useEffect(() => {
    if (product?.variants?.nodes?.length) {
      const firstAvail =
        product.variants.nodes.find((v) => v.availableForSale) ??
        product.variants.nodes[0];
      setSelectedVariantId(firstAvail.id);
    } else {
      setSelectedVariantId(null);
    }
  }, [product?.id]);

  const productHref = `/products/${clip.productHandle}`;

  // Error or confirmed missing → degrade to plain Shop now link.
  if (error || (!loading && !product)) {
    return (
      <FallbackShopNow
        href={productHref}
        productName={clip.productName}
        onClose={onClose}
        dark={dark}
      />
    );
  }

  const variants = product?.variants?.nodes ?? [];
  const hasMultipleVariants = variants.length > 1;
  const selectedVariant = variants.find((v) => v.id === selectedVariantId);
  const outOfStock = selectedVariant ? !selectedVariant.availableForSale : false;
  const displayName = product?.title ?? clip.productName;
  const priceText = selectedVariant
    ? formatMoney(selectedVariant.price)
    : formatMoney(product?.priceRange?.minVariantPrice);

  const theme = dark
    ? {
        name: 'text-white',
        price: 'text-white',
        pricePlaceholder: 'bg-white/10',
        select:
          'bg-white/10 text-white border-white/25 focus:ring-white/40',
        details: 'text-white/70',
        trust: 'text-white/60',
      }
    : {
        name: 'text-[var(--text-primary)]',
        price: 'text-[var(--text-primary)]',
        pricePlaceholder: 'bg-gray-200',
        select:
          'bg-white text-gray-900 border-gray-300 focus:ring-[#06B6D4]',
        details: 'text-[var(--text-secondary)]',
        trust: 'text-[var(--text-muted)]',
      };

  return (
    <div className="flex flex-col gap-2.5">
      <div className="space-y-1">
        <p className={`text-[15px] font-medium leading-tight ${theme.name}`}>
          {displayName}
        </p>
        {loading && !priceText ? (
          <div className={`h-5 w-16 rounded ${theme.pricePlaceholder} animate-pulse`} />
        ) : priceText ? (
          <p className={`text-[18px] font-medium ${theme.price}`}>{priceText}</p>
        ) : null}
      </div>

      {hasMultipleVariants && (
        <label className="sr-only" htmlFor={`variant-${clip.slug}`}>
          Select variant
        </label>
      )}
      {hasMultipleVariants && (
        <select
          id={`variant-${clip.slug}`}
          value={selectedVariantId ?? ''}
          onChange={(e) => setSelectedVariantId(e.target.value)}
          className={`w-full text-sm rounded-lg border px-3 py-2.5 focus:outline-none focus:ring-2 ${theme.select}`}
        >
          {variants.map((v) => (
            <option
              key={v.id}
              value={v.id}
              disabled={!v.availableForSale}
            >
              {v.title}
              {!v.availableForSale ? ' — sold out' : ''}
            </option>
          ))}
        </select>
      )}

      {loading ? (
        <div
          className={`h-12 rounded-lg animate-pulse ${theme.pricePlaceholder}`}
        />
      ) : (
        <CartForm
          key={`${clip.slug}-${selectedVariantId ?? 'none'}`}
          route="/cart"
          action={CartForm.ACTIONS.LinesAdd}
          inputs={{
            lines: selectedVariantId
              ? [{merchandiseId: selectedVariantId, quantity: 1}]
              : [],
          }}
        >
          {(fetcher) => (
            <AddButton
              fetcher={fetcher}
              disabled={!selectedVariantId}
              outOfStock={outOfStock}
              label="Add to cart"
              dark={dark}
            />
          )}
        </CartForm>
      )}

      <Link
        to={productHref}
        onClick={onClose}
        className={`text-xs text-center hover:underline ${theme.details}`}
      >
        View full details →
      </Link>

      {showTrustLine && (
        <p className={`text-[11px] text-center ${theme.trust}`}>
          Free shipping $49+ · 30-day guarantee
        </p>
      )}
    </div>
  );
}
