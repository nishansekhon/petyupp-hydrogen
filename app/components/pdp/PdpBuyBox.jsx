import {forwardRef, useEffect, useRef, useState} from 'react';
import {useNavigate} from 'react-router';
import {CartForm, Money} from '@shopify/hydrogen';
import {FEATURES} from '~/lib/featureFlags';
import {PAIRED_PRODUCTS} from '~/lib/pairedProducts';
import PdpPairedProductCard from './PdpPairedProductCard';

const SUBSCRIPTION_DISCOUNT = 0.15;

// Fallback swatch colors used when a Flavor variant has no image attached
// yet. Names match the option values returned by Shopify (case-sensitive).
// Phase 5.5b shipped real variant images for all 8 flavors, so these only
// surface if a future variant is added without imagery.
const FLAVOR_FALLBACK = {
  Blueberry: {bg: '#93C5FD', label: '#1E3A8A'},
  Honey: {bg: '#FCD34D', label: '#92400E'},
  Mint: {bg: '#86EFAC', label: '#065F46'},
  'Peanut Butter': {bg: '#D4A574', label: '#78350F'},
  Pumpkin: {bg: '#FB923C', label: '#7C2D12'},
  Strawberry: {bg: '#F87171', label: '#991B1B'},
  'Flax Seed': {bg: '#C7B898', label: '#57534E'},
  'Turmeric & Ashwagandha': {bg: '#B45309', label: '#FEF3C7'},
};

const TRUST_PILLS = [
  'Free ship $49+',
  'Vet approved',
  'Ships 1–2 days',
  '30-day guarantee',
];

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

// Extract a unit count from a variant/option name like "Pack of 10", "5-pack",
// "10pk", "12 count". Returns null when the name doesn't encode a count — the
// caller then falls back to total price instead of per-unit.
function parseUnitCount(name) {
  if (!name) return null;
  const patterns = [
    /pack\s*of\s*(\d+)/i,
    /(\d+)\s*[-\s]?\s*pack/i,
    /(\d+)\s*pk\b/i,
    /(\d+)\s*(?:count|ct)\b/i,
    /\bx\s*(\d+)\b/i,
    /^\s*(\d+)\s*$/,
  ];
  for (const p of patterns) {
    const m = name.match(p);
    if (m) {
      const n = parseInt(m[1], 10);
      if (n > 1) return n;
    }
  }
  return null;
}

function AddToCartInner({fetcher, disabled, outOfStock, onAfterAdd}) {
  const [justAdded, setJustAdded] = useState(false);
  const wasSubmitting = useRef(false);

  useEffect(() => {
    if (fetcher.state === 'submitting') wasSubmitting.current = true;
    if (
      fetcher.state === 'idle' &&
      wasSubmitting.current &&
      fetcher.data?.cart
    ) {
      wasSubmitting.current = false;
      setJustAdded(true);
      onAfterAdd?.();
      const t = setTimeout(() => setJustAdded(false), 2000);
      return () => clearTimeout(t);
    }
  }, [fetcher.state, fetcher.data, onAfterAdd]);

  const submitting = fetcher.state !== 'idle';
  const label = outOfStock
    ? 'Sold out'
    : submitting
    ? 'Adding…'
    : justAdded
    ? 'Added ✓'
    : 'Add to cart';

  return (
    <button
      type="submit"
      disabled={disabled || outOfStock || submitting}
      className="w-full bg-[#06B6D4] hover:bg-[#0891B2] disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-[12px] font-medium rounded-lg py-2.5 px-4 transition-colors"
    >
      {label}
    </button>
  );
}

function BuyNowInner({fetcher, disabled, outOfStock}) {
  const navigate = useNavigate();
  const wasSubmitting = useRef(false);

  useEffect(() => {
    if (fetcher.state === 'submitting') wasSubmitting.current = true;
    if (
      fetcher.state === 'idle' &&
      wasSubmitting.current &&
      fetcher.data?.cart
    ) {
      wasSubmitting.current = false;
      navigate('/cart');
    }
  }, [fetcher.state, fetcher.data, navigate]);

  const submitting = fetcher.state !== 'idle';
  const label = outOfStock ? 'Sold out' : submitting ? 'Loading…' : 'Buy now';

  return (
    <button
      type="submit"
      disabled={disabled || outOfStock || submitting}
      className="w-full bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed text-[#06B6D4] text-[12px] font-medium rounded-lg py-2 px-4 border-[1.5px] border-[#06B6D4] transition-colors"
    >
      {label}
    </button>
  );
}

const PdpBuyBox = forwardRef(function PdpBuyBox(
  {
    product,
    selectedVariant,
    productOptions,
    quantity,
    onQuantityChange,
    onAfterAdd,
  },
  addToCartRef,
) {
  const navigate = useNavigate();
  const [purchaseMode, setPurchaseMode] = useState('onetime');

  // Pull the selected variant's sellingPlan (for subscriptions preview).
  const allVariants = product?.variants?.nodes ?? [];
  const variantWithSub = allVariants.find((v) => v.id === selectedVariant?.id);

  // Build a Set of valid option-combo keys so we can disable fake
  // combinations like (Size=Extra Large, Flavor=Strawberry) that don't
  // correspond to a real variant. `exists` on optionValue only means "this
  // value appears on some variant", not "this value × current other
  // selection is a real variant" — which is what matters for chip UX.
  const comboKey = (opts) =>
    (opts ?? [])
      .map((o) => `${o.name}=${o.value}`)
      .sort()
      .join('|');
  const validCombos = new Set(
    allVariants.map((v) => comboKey(v.selectedOptions)),
  );
  const currentSelection = Object.fromEntries(
    (selectedVariant?.selectedOptions ?? []).map((o) => [o.name, o.value]),
  );

  // Hydration safety: the chip-validity styling derives from selectedVariant,
  // which Hydrogen's useOptimisticVariant can resolve to a slightly different
  // variant on first client render than the loader resolved on the server
  // (URL search-param parsing, normalization, optimistic in-flight nav state).
  // Different `comboValid` between SSR and CSR → different `aria-disabled` +
  // className → React hydration mismatch (#418/#423). Gate the validity-driven
  // UI on a post-mount flag so SSR HTML + the first client render produce
  // byte-identical markup, then upgrade to the real validity state after mount.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const sellingPlanAllocation =
    variantWithSub?.sellingPlanAllocations?.nodes?.[0] ?? null;
  const sellingPlan = sellingPlanAllocation?.sellingPlan ?? null;

  const price = selectedVariant?.price;
  const compareAt = selectedVariant?.compareAtPrice;
  const hasCompareAt =
    compareAt?.amount &&
    parseFloat(compareAt.amount) > parseFloat(price?.amount ?? 0);
  const savings = hasCompareAt
    ? (parseFloat(compareAt.amount) - parseFloat(price.amount)).toFixed(2)
    : null;

  let subscriptionPrice = null;
  if (FEATURES.SUBSCRIPTIONS_ENABLED && sellingPlanAllocation?.priceAdjustments?.length) {
    subscriptionPrice = sellingPlanAllocation.priceAdjustments[0].price ?? null;
  } else if (price?.amount) {
    subscriptionPrice = {
      amount: (parseFloat(price.amount) * (1 - SUBSCRIPTION_DISCOUNT)).toFixed(2),
      currencyCode: price.currencyCode,
    };
  }

  const outOfStock = !selectedVariant?.availableForSale;
  const isSubscription =
    purchaseMode === 'subscription' && FEATURES.SUBSCRIPTIONS_ENABLED;

  const lines = selectedVariant
    ? [
        {
          merchandiseId: selectedVariant.id,
          quantity,
          selectedVariant,
          ...(isSubscription && sellingPlan
            ? {sellingPlanId: sellingPlan.id}
            : {}),
        },
      ]
    : [];

  return (
    <div className="flex flex-col gap-3.5">
      {/* Price */}
      <div className="flex items-baseline gap-2.5">
        {price && (
          <span className="text-[22px] font-medium text-gray-900 leading-none">
            <Money data={price} />
          </span>
        )}
        {hasCompareAt && (
          <>
            <span className="text-gray-400 line-through text-sm">
              <Money data={compareAt} />
            </span>
            <span className="bg-red-50 text-red-700 text-[10px] font-medium px-1.5 py-0.5 rounded">
              SAVE ${savings}
            </span>
          </>
        )}
      </div>

      {/* Purchase-mode toggle */}
      <div
        role="radiogroup"
        aria-label="Purchase type"
        className="grid grid-cols-2 gap-2"
      >
        <button
          type="button"
          role="radio"
          aria-checked={purchaseMode === 'onetime'}
          onClick={() => setPurchaseMode('onetime')}
          className={`text-left rounded-lg p-2 border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4] ${
            purchaseMode === 'onetime'
              ? 'border-[#06B6D4] ring-1 ring-[#06B6D4] ring-inset bg-[#06B6D4]/5'
              : 'border-gray-300 hover:border-[#06B6D4]'
          }`}
        >
          <div className="text-[10px] font-medium text-gray-900">
            One-time
          </div>
          {price && (
            <div className="mt-0.5 text-[12px] font-medium text-gray-900">
              <Money data={price} />
            </div>
          )}
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={purchaseMode === 'subscription'}
          disabled={!FEATURES.SUBSCRIPTIONS_ENABLED}
          title={
            !FEATURES.SUBSCRIPTIONS_ENABLED
              ? 'Subscription delivery launching soon'
              : undefined
          }
          onClick={() => {
            if (!FEATURES.SUBSCRIPTIONS_ENABLED) return;
            setPurchaseMode('subscription');
          }}
          className={`text-left rounded-lg p-2 border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4] ${
            purchaseMode === 'subscription'
              ? 'border-[#06B6D4] ring-1 ring-[#06B6D4] ring-inset bg-[#06B6D4]/5'
              : 'border-gray-300'
          } ${!FEATURES.SUBSCRIPTIONS_ENABLED ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          <div className="text-[10px] font-medium text-gray-900">
            Subscribe — save 15%
          </div>
          {subscriptionPrice && (
            <div className="mt-0.5 text-[12px] font-medium text-gray-900">
              {formatMoney(subscriptionPrice)}
            </div>
          )}
          {!FEATURES.SUBSCRIPTIONS_ENABLED && (
            <div className="mt-0.5 text-[8px] uppercase tracking-[0.5px] text-gray-500">
              Coming soon
            </div>
          )}
        </button>
      </div>

      {/* Variant pickers — visual grid, one per option group */}
      {productOptions?.map((option) => {
        if (option.optionValues.length === 1) return null;
        // Hide the whole option group when the current selection on the
        // other axes leaves it with no real choice. Concretely on Himalayan
        // Cheese: at Size=Medium, only Plain has a flavor variant, so the
        // Flavor row would render 8 greyed chips + 1 selected — confusing.
        // Mirror the same mounted-gate used for chip styling: pre-mount we
        // render all groups so SSR HTML matches the first CSR pass; post-
        // mount we hide groups with <2 valid combos against current state.
        const validChipCount = option.optionValues.filter((v) =>
          validCombos.has(
            comboKey(
              Object.entries({
                ...currentSelection,
                [option.name]: v.name,
              }).map(([n, val]) => ({name: n, value: val})),
            ),
          ),
        ).length;
        if (mounted && validChipCount < 2) return null;

        // Image swatches replace text chips for Flavor on flavored-variety.
        // Size on Plain and any other option group keep the text-chip layout.
        const isFlavorImageSwatch =
          option.name === 'Flavor' &&
          product?.handle === 'himalayan-flavored-variety';

        return (
          <div key={option.name} role="radiogroup" aria-label={option.name}>
            <div className="text-[12px] font-medium text-gray-900 mb-1.5">
              {option.name}
            </div>
            <div
              className={`grid gap-1.5 ${
                isFlavorImageSwatch ? 'grid-cols-4' : 'grid-cols-3'
              }`}
            >
              {option.optionValues.map((value) => {
                const {name, selected, available, exists, variantUriQuery} =
                  value;
                // Combo-valid: does picking THIS value in THIS option axis,
                // combined with the current selection on the other axes,
                // point at a real variant? If not (e.g. Size=Extra Large +
                // Flavor=Strawberry), the chip is greyed out — but still
                // clickable. Clicking it navigates via variantUriQuery,
                // which Hydrogen pre-computes from firstSelectableVariant
                // and therefore auto-switches the OTHER axis to a valid
                // pairing (e.g. clicking Strawberry from XL+Plain lands on
                // Medium+Strawberry).
                const hypothetical = {
                  ...currentSelection,
                  [option.name]: name,
                };
                const realComboValid = validCombos.has(
                  comboKey(
                    Object.entries(hypothetical).map(([n, v]) => ({
                      name: n,
                      value: v,
                    })),
                  ),
                );
                // Pre-hydration: render every chip as valid so SSR HTML and
                // the first CSR pass match. Post-mount: switch to the real
                // validity state — React applies this as a normal update, not
                // a hydration check, so no #418/#423.
                const comboValid = mounted ? realComboValid : true;
                const valuePrice = value.firstSelectableVariant?.price;
                const valueImage = value.firstSelectableVariant?.image;
                const unitCount = parseUnitCount(name);
                let perUnitLabel = null;
                if (comboValid && valuePrice?.amount) {
                  if (unitCount) {
                    const perUnit =
                      parseFloat(valuePrice.amount) / unitCount;
                    perUnitLabel = `${formatMoney({
                      amount: perUnit.toFixed(2),
                      currencyCode: valuePrice.currencyCode,
                    })} each`;
                  } else {
                    perUnitLabel = formatMoney(valuePrice);
                  }
                }

                const onClick = () => {
                  if (!exists || selected) return;
                  void navigate(`?${variantUriQuery}`, {
                    replace: true,
                    preventScrollReset: true,
                  });
                };

                if (isFlavorImageSwatch) {
                  const fallback = FLAVOR_FALLBACK[name] || {
                    bg: '#E5E7EB',
                    label: '#1F2937',
                  };
                  let swatchBorder;
                  if (!comboValid) {
                    swatchBorder =
                      'border-[0.5px] border-gray-200 opacity-40 cursor-not-allowed';
                  } else if (selected) {
                    swatchBorder = 'border-[2px] border-[#06B6D4]';
                  } else {
                    swatchBorder =
                      'border-[0.5px] border-gray-200 hover:border-gray-400';
                  }
                  return (
                    <button
                      key={option.name + name}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      aria-disabled={!comboValid}
                      aria-label={`${option.name}: ${name}`}
                      disabled={!exists}
                      onClick={onClick}
                      className={`relative aspect-square rounded-md overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4] ${swatchBorder} ${
                        comboValid && !available ? 'opacity-60' : ''
                      }`}
                      style={{backgroundColor: fallback.bg}}
                    >
                      {valueImage?.url && (
                        <img
                          src={valueImage.url}
                          srcSet={[200, 400]
                            .map((w) => {
                              try {
                                const u = new URL(valueImage.url);
                                u.searchParams.set('width', String(w));
                                return `${u.toString()} ${w}w`;
                              } catch {
                                return null;
                              }
                            })
                            .filter(Boolean)
                            .join(', ')}
                          sizes="80px"
                          alt={valueImage.altText || name}
                          className="absolute inset-0 w-full h-full object-cover"
                          loading="lazy"
                        />
                      )}
                      <span
                        className="absolute bottom-0.5 left-0.5 right-0.5 px-1 py-[1px] rounded-[2px] text-[8px] font-medium leading-tight text-center truncate"
                        style={{
                          backgroundColor: 'rgba(255,255,255,0.85)',
                          color: fallback.label,
                        }}
                      >
                        {name}
                      </span>
                    </button>
                  );
                }

                let stateClass;
                if (!comboValid) {
                  stateClass =
                    'border-gray-200 opacity-40 cursor-not-allowed';
                } else if (selected) {
                  stateClass = 'border-[#06B6D4] bg-[#06B6D4]/5';
                } else {
                  stateClass = 'border-gray-200 hover:border-gray-300';
                }
                const commonClass = `relative p-2 rounded-lg border-2 transition-colors text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4] ${stateClass} ${
                  comboValid && !available ? 'opacity-60' : ''
                }`;

                return (
                  <button
                    key={option.name + name}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    aria-disabled={!comboValid}
                    disabled={!exists}
                    onClick={onClick}
                    className={commonClass}
                  >
                    <div className="text-[12px] font-medium text-gray-900">
                      {name}
                    </div>
                    {perUnitLabel && (
                      <div className="text-[10px] text-gray-500 mt-0.5 tabular-nums">
                        {perUnitLabel}
                      </div>
                    )}
                    {comboValid && !available && (
                      <div className="text-[10px] text-red-600 mt-0.5">
                        Out of stock
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Quantity stepper — inline label + compact buttons */}
      <div className="flex items-center gap-2.5">
        <span className="text-[12px] font-medium text-gray-900">Qty</span>
        <div className="inline-flex items-center border border-gray-300 rounded-md overflow-hidden">
          <button
            type="button"
            aria-label="Decrease quantity"
            onClick={() => onQuantityChange?.(Math.max(1, quantity - 1))}
            disabled={quantity <= 1}
            className="w-[22px] h-6 flex items-center justify-center text-gray-700 text-sm hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            −
          </button>
          <span
            aria-live="polite"
            className="w-7 h-6 flex items-center justify-center text-[12px] font-medium text-gray-900 border-x border-gray-300 tabular-nums"
          >
            {quantity}
          </span>
          <button
            type="button"
            aria-label="Increase quantity"
            onClick={() => onQuantityChange?.(Math.min(10, quantity + 1))}
            disabled={quantity >= 10}
            className="w-[22px] h-6 flex items-center justify-center text-gray-700 text-sm hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            +
          </button>
        </div>
      </div>

      {/* Add to cart */}
      <div ref={addToCartRef}>
        <CartForm
          key={`${selectedVariant?.id ?? 'none'}-${isSubscription && sellingPlan ? sellingPlan.id : 'otp'}-add`}
          route="/cart"
          action={CartForm.ACTIONS.LinesAdd}
          inputs={{lines}}
        >
          {(fetcher) => (
            <AddToCartInner
              fetcher={fetcher}
              disabled={!selectedVariant}
              outOfStock={outOfStock}
              onAfterAdd={onAfterAdd}
            />
          )}
        </CartForm>
      </div>

      {/* Buy now — separate CartForm so its own fetcher can navigate to /cart */}
      <CartForm
        key={`${selectedVariant?.id ?? 'none'}-${isSubscription && sellingPlan ? sellingPlan.id : 'otp'}-buynow`}
        route="/cart"
        action={CartForm.ACTIONS.LinesAdd}
        inputs={{lines}}
      >
        {(fetcher) => (
          <BuyNowInner
            fetcher={fetcher}
            disabled={!selectedVariant}
            outOfStock={outOfStock}
          />
        )}
      </CartForm>

      {isSubscription && (
        <p className="text-[11px] text-gray-600">
          Delivery every 4 weeks — skip or cancel anytime
        </p>
      )}

      {/* Trust pills row — 4-col grid, top divider */}
      <ul className="grid grid-cols-4 gap-1 pt-2.5 border-t-[0.5px] border-gray-200">
        {TRUST_PILLS.map((label) => (
          <li
            key={label}
            className="text-[9px] text-gray-500 leading-tight text-center"
          >
            <span aria-hidden className="text-[#06B6D4] mr-0.5">✓</span>
            {label}
          </li>
        ))}
      </ul>

      {PAIRED_PRODUCTS[product?.handle] && (
        <PdpPairedProductCard {...PAIRED_PRODUCTS[product.handle]} />
      )}
    </div>
  );
});

export default PdpBuyBox;
