import React from 'react';
import {Link} from 'react-router';

/**
 * PetYupp ProductCard — 2026 editorial redesign.
 * White background, no border, single soft shadow; editorial brand row
 * above the title; problem-tag overlay on the image; inline Add +.
 */
function formatPrice(price) {
  if (price == null || price === '') return '';
  if (typeof price === 'number') return price.toFixed(2);
  const num = Number(price);
  return Number.isFinite(num) ? num.toFixed(2) : String(price);
}

function Stars({rating = 4.8}) {
  return (
    <span
      aria-label={`${rating} out of 5 stars`}
      className="inline-flex items-center gap-0.5 text-[10px] text-gray-600"
    >
      <span className="text-yellow-400">★</span>
      <span className="font-semibold text-gray-900">{rating}</span>
    </span>
  );
}

function ProductCard({product, index = 0, showBadges = true}) {
  const slug = product.slug || product.id;
  const discountPercent = product.original_price
    ? Math.round(
        ((product.original_price - product.price) / product.original_price) *
          100,
      )
    : 0;

  const rating = product.rating ?? 4.8;
  const reviewCount = product.reviewCount ?? 234;
  const problemTags =
    (Array.isArray(product.problemTags) && product.problemTags) ||
    (Array.isArray(product.displayTags?.problems) &&
      product.displayTags.problems) ||
    [];

  return (
    <article className="bg-white rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,.04)] hover:shadow-md transition-all duration-200 flex flex-col">
      <Link
        to={`/products/${slug}`}
        className="block relative aspect-square bg-gray-50 overflow-hidden"
      >
        <img
          src={product.image_url}
          alt={product.name}
          width={400}
          height={400}
          loading={index === 0 ? 'eager' : 'lazy'}
          decoding="async"
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />

        {/* Badges (top) */}
        {showBadges && (
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {(product.displayTags?.isBestseller || index === 0) && (
              <span className="bg-[#06B6D4] text-white text-[8px] font-bold tracking-wide px-2 py-1 rounded uppercase">
                Bestseller
              </span>
            )}
            {(product.displayTags?.isNewLaunch || index === 1) && (
              <span className="bg-[#10B981] text-white text-[8px] font-bold tracking-wide px-2 py-1 rounded uppercase">
                New
              </span>
            )}
          </div>
        )}
        {discountPercent > 0 && (
          <div className="absolute top-2 right-2">
            <span className="bg-[#10B981] text-white text-[8px] font-bold tracking-wide px-2 py-1 rounded">
              {discountPercent}% OFF
            </span>
          </div>
        )}

        {/* Problem-tag overlay (bottom of image) */}
        {problemTags.length > 0 && (
          <div className="absolute bottom-2 left-2 right-2 flex gap-1 flex-wrap">
            {problemTags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="bg-black/60 backdrop-blur-sm text-white text-[8px] px-2 py-1 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </Link>

      <div className="px-3.5 py-3 flex flex-col flex-1">
        {/* Brand row */}
        <div className="flex justify-between items-center">
          <span className="text-[9px] font-semibold text-[#06B6D4] tracking-wide uppercase">
            PetYupp
          </span>
          <span className="inline-flex items-center gap-1 text-[10px]">
            <Stars rating={rating} />
            <span className="text-gray-400">({reviewCount})</span>
          </span>
        </div>

        <Link
          to={`/products/${slug}`}
          className="text-sm font-semibold text-gray-900 line-clamp-2 mt-1 leading-snug hover:text-[#06B6D4] transition-colors"
        >
          {product.name}
        </Link>

        <div className="flex justify-between items-center mt-2 mb-1">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-extrabold text-gray-900">
              ${formatPrice(product.price)}
            </span>
            {product.original_price &&
            product.original_price > product.price ? (
              <span className="text-xs line-through text-gray-400">
                ${formatPrice(product.original_price)}
              </span>
            ) : (
              <span className="text-[10px] text-green-600">Free ship</span>
            )}
          </div>
          <Link
            to={`/products/${slug}`}
            className="bg-[#06B6D4] hover:bg-[#0891B2] text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors"
            aria-label={`View ${product.name}`}
          >
            Add +
          </Link>
        </div>
      </div>
    </article>
  );
}

export default ProductCard;
