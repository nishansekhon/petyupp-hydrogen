import {Money} from '@shopify/hydrogen';

/**
 * @param {{
 *   price?: MoneyV2;
 *   compareAtPrice?: MoneyV2 | null;
 * }}
 */
export function ProductPrice({price, compareAtPrice, size = 'md'}) {
  const priceClass = size === 'lg' ? 'text-2xl font-bold' : 'font-semibold';
  const compareClass = size === 'lg' ? 'text-lg' : 'text-sm';
  const onSale =
    compareAtPrice &&
    price &&
    Number(compareAtPrice.amount) > Number(price.amount);
  return (
    <div aria-label="Price" className="product-price flex items-baseline gap-2" role="group">
      {price ? (
        <span className={`${priceClass} ${onSale ? 'text-red-600' : 'text-gray-900'}`}>
          <Money data={price} />
        </span>
      ) : (
        <span>&nbsp;</span>
      )}
      {onSale ? (
        <s className={`${compareClass} text-gray-400`}>
          <Money data={compareAtPrice} />
        </s>
      ) : null}
    </div>
  );
}

/** @typedef {import('@shopify/hydrogen/storefront-api-types').MoneyV2} MoneyV2 */
