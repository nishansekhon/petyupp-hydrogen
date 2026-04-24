// SUBSCRIPTION GATING:
// UI renders always. Behavior gated by FEATURES.SUBSCRIPTIONS_ENABLED.
// To activate:
// 1. Install Shopify Subscriptions app in Shopify admin
// 2. Create a Selling Plan Group for eligible products
// 3. Flip FEATURES.SUBSCRIPTIONS_ENABLED = true
// 4. Verify sellingPlanAllocations returns data in Storefront API

import {useEffect, useRef, useState} from 'react';
import {Link} from 'react-router';
import {CartForm} from '@shopify/hydrogen';
import {FEATURES} from '~/lib/featureFlags';

const SUBSCRIPTION_DISCOUNT = 0.15; // 15% — hardcoded until sellingPlan priceAdjustments drive it

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

function QuickAddSkeleton({dark}) {
  const bg = dark ? 'bg-white/10' : 'bg-gray-200';
  return (
    <div className="flex flex-col gap-2.5">
      <div className={`h-5 w-3/4 rounded animate-pulse ${bg}`} />
      <div className="grid grid-cols-2 gap-2">
        <div className={`h-[72px] rounded-lg animate-pulse ${bg}`} />
        <div className={`h-[72px] rounded-lg animate-pulse ${bg}`} />
      </div>
      <div className={`h-12 rounded-lg animate-pulse ${bg}`} />
    </div>
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
  // Defer the real render to after client mount. QuickAddBlock lives
  // inside a portaled modal and interacts with a CartForm fetcher + the
  // root cart Suspense boundary; rendering this subtree during
  // hydration has caused React error #421 ("Suspense boundary received
  // an update before it finished hydrating"). Gating on a post-mount
  // flag sidesteps the entire hydration path.
  const [mounted, setMounted] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const [purchaseMode, setPurchaseMode] = useState('onetime'); // 'onetime' | 'subscription'

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (product?.variants?.nodes?.length) {
      const firstAvail =
        product.variants.nodes.find((v) => v.availableForSale) ??
        product.variants.nodes[0];
      setSelectedVariantId(firstAvail.id);
    } else {
      setSelectedVariantId(null);
    }
    // Reset to one-time whenever the product changes — safest default.
    setPurchaseMode('onetime');
  }, [product?.id]);

  const productHref = `/products/${clip.productHandle}`;

  // DIAGNOSTIC: remove once empty-aside root cause is identified.
  if (typeof console !== 'undefined') {
    // eslint-disable-next-line no-console
    console.log('[QuickAddBlock] render', {
      dark,
      mounted,
      loading,
      error,
      hasProduct: !!product,
      productHandle: product?.handle,
      clipHandle: clip?.productHandle,
      branch: !mounted
        ? 'skeleton'
        : error || (!loading && !product)
        ? 'fallback'
        : 'main',
    });
  }

  // Post-hooks gate: first render returns a skeleton so SSR/hydration
  // never touches CartForm + fetchers. All hooks above run on every
  // render regardless, keeping rules-of-hooks satisfied.
  if (!mounted) {
    return <QuickAddSkeleton dark={dark} />;
  }

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

  const onetimePriceObj =
    selectedVariant?.price ?? product?.priceRange?.minVariantPrice ?? null;
  const onetimePriceText = formatMoney(onetimePriceObj);

  // Subscription price: read from sellingPlan's priceAdjustments when the
  // app is installed; otherwise fall back to the flat 15%-off preview.
  const sellingPlanAllocation =
    selectedVariant?.sellingPlanAllocations?.nodes?.[0] ?? null;
  const sellingPlan = sellingPlanAllocation?.sellingPlan ?? null;

  let subscriptionPriceObj = null;
  if (FEATURES.SUBSCRIPTIONS_ENABLED && sellingPlanAllocation?.priceAdjustments?.length) {
    subscriptionPriceObj = sellingPlanAllocation.priceAdjustments[0].price ?? null;
  } else if (onetimePriceObj?.amount) {
    subscriptionPriceObj = {
      amount: (parseFloat(onetimePriceObj.amount) * (1 - SUBSCRIPTION_DISCOUNT)).toFixed(2),
      currencyCode: onetimePriceObj.currencyCode,
    };
  }
  const subscriptionPriceText = formatMoney(subscriptionPriceObj);

  const isSubscription =
    purchaseMode === 'subscription' && FEATURES.SUBSCRIPTIONS_ENABLED;

  const theme = dark
    ? {
        name: 'text-white',
        pricePlaceholder: 'bg-white/10',
        select:
          'bg-white/10 text-white border-white/25 focus:ring-white/40',
        details: 'text-white/70',
        trust: 'text-white/60',
        optBorder: 'border-white/25',
        optHover: 'hover:border-white/50',
        optSelected: 'border-[#06B6D4] ring-1 ring-[#06B6D4] ring-inset bg-[#06B6D4]/15',
        optLabel: 'text-white',
        optPrice: 'text-white',
        comingSoon: 'text-white/55',
        delivery: 'text-white/70',
      }
    : {
        name: 'text-[var(--text-primary)]',
        pricePlaceholder: 'bg-gray-200',
        select:
          'bg-white text-gray-900 border-gray-300 focus:ring-[#06B6D4]',
        details: 'text-[var(--text-secondary)]',
        trust: 'text-[var(--text-muted)]',
        optBorder: 'border-gray-300',
        optHover: 'hover:border-[#06B6D4]',
        optSelected: 'border-[#06B6D4] ring-1 ring-[#06B6D4] ring-inset bg-[#06B6D4]/5',
        optLabel: 'text-[var(--text-primary)]',
        optPrice: 'text-[var(--text-primary)]',
        comingSoon: 'text-[var(--text-muted)]',
        delivery: 'text-[var(--text-secondary)]',
      };

  const handleSubscriptionClick = () => {
    if (!FEATURES.SUBSCRIPTIONS_ENABLED) return;
    setPurchaseMode('subscription');
  };

  const onetimeSelected = purchaseMode === 'onetime';
  const subscriptionSelected = purchaseMode === 'subscription';
  const optBase = `text-left rounded-lg p-3 transition-colors border focus:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]`;

  return (
    <div className="flex flex-col gap-2.5">
      <p className={`text-[15px] font-medium leading-tight ${theme.name}`}>
        {displayName}
      </p>

      {/* Purchase-mode toggle — one-time vs subscription */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setPurchaseMode('onetime')}
          aria-pressed={onetimeSelected}
          className={`${optBase} ${
            onetimeSelected ? theme.optSelected : `${theme.optBorder} ${theme.optHover}`
          }`}
        >
          <div className={`text-[13px] font-medium ${theme.optLabel}`}>
            One-time purchase
          </div>
          {loading ? (
            <div className={`mt-1 h-4 w-14 rounded ${theme.pricePlaceholder} animate-pulse`} />
          ) : onetimePriceText ? (
            <div className={`mt-1 text-[15px] font-medium ${theme.optPrice}`}>
              {onetimePriceText}
            </div>
          ) : null}
        </button>

        <button
          type="button"
          onClick={handleSubscriptionClick}
          disabled={!FEATURES.SUBSCRIPTIONS_ENABLED}
          aria-pressed={subscriptionSelected}
          title={
            !FEATURES.SUBSCRIPTIONS_ENABLED
              ? 'Subscription delivery launching soon'
              : undefined
          }
          className={`${optBase} ${
            subscriptionSelected
              ? theme.optSelected
              : `${theme.optBorder} ${FEATURES.SUBSCRIPTIONS_ENABLED ? theme.optHover : ''}`
          } ${!FEATURES.SUBSCRIPTIONS_ENABLED ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          <div className={`text-[13px] font-medium ${theme.optLabel}`}>
            Subscribe &amp; save 15%
          </div>
          {loading ? (
            <div className={`mt-1 h-4 w-14 rounded ${theme.pricePlaceholder} animate-pulse`} />
          ) : subscriptionPriceText ? (
            <div className={`mt-1 text-[15px] font-medium ${theme.optPrice}`}>
              {subscriptionPriceText}
            </div>
          ) : null}
          {!FEATURES.SUBSCRIPTIONS_ENABLED && (
            <div
              className={`mt-1 text-[10px] uppercase tracking-[0.5px] ${theme.comingSoon}`}
            >
              Coming soon
            </div>
          )}
        </button>
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

      {isSubscription && (
        <p className={`text-[12px] ${theme.delivery}`}>
          Delivery every 4 weeks — skip or cancel anytime
        </p>
      )}

      {loading ? (
        <div
          className={`h-12 rounded-lg animate-pulse ${theme.pricePlaceholder}`}
        />
      ) : (
        <CartForm
          key={`${clip.slug}-${selectedVariantId ?? 'none'}-${
            isSubscription && sellingPlan ? sellingPlan.id : 'otp'
          }`}
          route="/cart"
          action={CartForm.ACTIONS.LinesAdd}
          inputs={{
            lines: selectedVariantId
              ? [
                  {
                    merchandiseId: selectedVariantId,
                    quantity: 1,
                    ...(isSubscription && sellingPlan
                      ? {sellingPlanId: sellingPlan.id}
                      : {}),
                  },
                ]
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
