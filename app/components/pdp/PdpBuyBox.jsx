import {forwardRef, useEffect, useRef, useState} from 'react';
import {useNavigate} from 'react-router';
import {CartForm, Money} from '@shopify/hydrogen';
import {FEATURES} from '~/lib/featureFlags';

const SUBSCRIPTION_DISCOUNT = 0.15;

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

function AddToCartInner({fetcher, disabled, outOfStock, onAfterAdd, priceLabel}) {
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
    : priceLabel
    ? `Add to cart — ${priceLabel}`
    : 'Add to cart';

  return (
    <button
      type="submit"
      disabled={disabled || outOfStock || submitting}
      className="w-full bg-[#06B6D4] hover:bg-[#0891B2] disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-base font-medium rounded-lg py-4 px-6 transition-colors"
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

  const priceLabel = price ? formatMoney(price) : null;

  return (
    <div className="flex flex-col gap-4">
      {/* Price */}
      <div className="flex items-baseline gap-3">
        {price && (
          <span className="text-2xl font-medium text-gray-900">
            <Money data={price} />
          </span>
        )}
        {hasCompareAt && (
          <>
            <span className="text-gray-400 line-through text-base">
              <Money data={compareAt} />
            </span>
            <span className="bg-red-50 text-red-700 text-xs font-medium px-2 py-1 rounded">
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
          className={`text-left rounded-lg p-3 border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4] ${
            purchaseMode === 'onetime'
              ? 'border-[#06B6D4] ring-1 ring-[#06B6D4] ring-inset bg-[#06B6D4]/5'
              : 'border-gray-300 hover:border-[#06B6D4]'
          }`}
        >
          <div className="text-[13px] font-medium text-gray-900">
            One-time purchase
          </div>
          {price && (
            <div className="mt-1 text-[15px] font-medium text-gray-900">
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
          className={`text-left rounded-lg p-3 border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4] ${
            purchaseMode === 'subscription'
              ? 'border-[#06B6D4] ring-1 ring-[#06B6D4] ring-inset bg-[#06B6D4]/5'
              : 'border-gray-300'
          } ${!FEATURES.SUBSCRIPTIONS_ENABLED ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          <div className="text-[13px] font-medium text-gray-900">
            Subscribe &amp; save 15%
          </div>
          {subscriptionPrice && (
            <div className="mt-1 text-[15px] font-medium text-gray-900">
              {formatMoney(subscriptionPrice)}
            </div>
          )}
          {!FEATURES.SUBSCRIPTIONS_ENABLED && (
            <div className="mt-1 text-[10px] uppercase tracking-[0.5px] text-gray-500">
              Coming soon
            </div>
          )}
        </button>
      </div>

      {/* Variant pickers — visual grid, one per option group */}
      {productOptions?.map((option) => {
        if (option.optionValues.length === 1) return null;
        return (
          <div key={option.name} role="radiogroup" aria-label={option.name}>
            <div className="text-[13px] font-medium text-gray-900 mb-2">
              {option.name}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {option.optionValues.map((value) => {
                const {name, selected, available, exists, variantUriQuery} =
                  value;
                const commonClass = `relative p-3 rounded-lg border-2 transition-colors text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4] ${
                  selected
                    ? 'border-[#06B6D4] bg-[#06B6D4]/5'
                    : 'border-gray-200 hover:border-gray-300'
                } ${!available ? 'opacity-60' : ''}`;

                return (
                  <button
                    key={option.name + name}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    disabled={!exists}
                    onClick={() => {
                      if (!selected && exists) {
                        void navigate(`?${variantUriQuery}`, {
                          replace: true,
                          preventScrollReset: true,
                        });
                      }
                    }}
                    className={commonClass}
                  >
                    <div className="text-sm font-medium text-gray-900">
                      {name}
                    </div>
                    {!available && (
                      <div className="text-[11px] text-red-600 mt-1">
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

      {/* Quantity stepper */}
      <div>
        <div className="text-[13px] font-medium text-gray-900 mb-2">
          Quantity
        </div>
        <div className="inline-flex items-center border border-gray-300 rounded-lg overflow-hidden">
          <button
            type="button"
            aria-label="Decrease quantity"
            onClick={() => onQuantityChange?.(Math.max(1, quantity - 1))}
            disabled={quantity <= 1}
            className="w-10 h-10 flex items-center justify-center text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            −
          </button>
          <span
            aria-live="polite"
            className="w-12 h-10 flex items-center justify-center text-sm font-medium text-gray-900 border-x border-gray-300 tabular-nums"
          >
            {quantity}
          </span>
          <button
            type="button"
            aria-label="Increase quantity"
            onClick={() => onQuantityChange?.(Math.min(10, quantity + 1))}
            disabled={quantity >= 10}
            className="w-10 h-10 flex items-center justify-center text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            +
          </button>
        </div>
      </div>

      {/* Add to cart */}
      <div ref={addToCartRef}>
        <CartForm
          key={`${selectedVariant?.id ?? 'none'}-${isSubscription && sellingPlan ? sellingPlan.id : 'otp'}`}
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
              priceLabel={priceLabel}
            />
          )}
        </CartForm>
      </div>

      {isSubscription && (
        <p className="text-[12px] text-gray-600">
          Delivery every 4 weeks — skip or cancel anytime
        </p>
      )}

      <p className="text-xs text-gray-500 text-center">
        Ships in 1–2 business days
      </p>
    </div>
  );
});

export default PdpBuyBox;
