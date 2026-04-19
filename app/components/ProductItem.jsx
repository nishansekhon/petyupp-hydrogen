import {Link} from 'react-router';
import {Image, Money} from '@shopify/hydrogen';
import {useVariantUrl} from '~/lib/variants';

/**
 * @param {{
 *   product:
 *     | CollectionItemFragment
 *     | ProductItemFragment
 *     | RecommendedProductFragment;
 *   loading?: 'eager' | 'lazy';
 * }}
 */
export function ProductItem({product, loading}) {
  const variantUrl = useVariantUrl(product.handle);
  const image = product.featuredImage;
  return (
    <Link
      className="group block rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
      key={product.id}
      prefetch="intent"
      to={variantUrl}
    >
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        {image ? (
          <Image
            alt={image.altText || product.title}
            aspectRatio="1/1"
            data={image}
            loading={loading}
            sizes="(min-width: 45em) 400px, 100vw"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div
            aria-hidden="true"
            className="w-full h-full flex items-center justify-center text-4xl text-gray-300"
          >
            🐾
          </div>
        )}
        <div
          aria-hidden="true"
          className="hidden md:flex absolute inset-0 bg-[#06B6D4]/75 items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        >
          <span className="text-white font-semibold text-sm">View Details</span>
        </div>
      </div>
      <h4 className="text-sm font-semibold text-gray-900 line-clamp-2 px-3 pt-3">
        {product.title}
      </h4>
      <div className="font-black text-gray-900 px-3 pb-3 pt-1">
        <Money data={product.priceRange.minVariantPrice} />
      </div>
    </Link>
  );
}

/** @typedef {import('storefrontapi.generated').ProductItemFragment} ProductItemFragment */
/** @typedef {import('storefrontapi.generated').CollectionItemFragment} CollectionItemFragment */
/** @typedef {import('storefrontapi.generated').RecommendedProductFragment} RecommendedProductFragment */
