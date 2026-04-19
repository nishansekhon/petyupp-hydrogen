import {CartForm} from '@shopify/hydrogen';
import {useEffect, useRef, useState} from 'react';

/**
 * @param {{
 *   analytics?: unknown;
 *   children: React.ReactNode;
 *   disabled?: boolean;
 *   lines: Array<OptimisticCartLineInput>;
 *   onClick?: () => void;
 * }}
 */
export function AddToCartButton({
  analytics,
  children,
  disabled,
  lines,
  onClick,
}) {
  return (
    <CartForm route="/cart" inputs={{lines}} action={CartForm.ACTIONS.LinesAdd}>
      {(fetcher) => (
        <AddToCartInner
          fetcher={fetcher}
          analytics={analytics}
          disabled={disabled}
          onClick={onClick}
        >
          {children}
        </AddToCartInner>
      )}
    </CartForm>
  );
}

function AddToCartInner({fetcher, analytics, disabled, onClick, children}) {
  const [justAdded, setJustAdded] = useState(false);
  const [pressing, setPressing] = useState(false);
  const wasSubmittingRef = useRef(false);

  useEffect(() => {
    if (fetcher.state === 'submitting') {
      wasSubmittingRef.current = true;
    }
    if (fetcher.state === 'idle' && wasSubmittingRef.current && fetcher.data) {
      wasSubmittingRef.current = false;
      setJustAdded(true);
      const t = setTimeout(() => setJustAdded(false), 1000);
      return () => clearTimeout(t);
    }
  }, [fetcher.state, fetcher.data]);

  return (
    <>
      <input
        name="analytics"
        type="hidden"
        value={JSON.stringify(analytics)}
      />
      <button
        type="submit"
        onClick={(e) => {
          setPressing(true);
          setTimeout(() => setPressing(false), 150);
          onClick?.(e);
        }}
        disabled={disabled ?? fetcher.state !== 'idle'}
        className={`w-full py-3 px-6 rounded-lg text-white font-semibold transition-all duration-150 disabled:cursor-not-allowed ${
          justAdded
            ? 'bg-[#10B981] hover:bg-[#059669]'
            : 'bg-[#06B6D4] hover:bg-[#0891B2] disabled:opacity-60'
        } ${pressing ? 'scale-95' : 'scale-100'}`}
      >
        {justAdded ? '✓ Added!' : children}
      </button>
    </>
  );
}

/** @typedef {import('react-router').FetcherWithComponents} FetcherWithComponents */
/** @typedef {import('@shopify/hydrogen').OptimisticCartLineInput} OptimisticCartLineInput */
