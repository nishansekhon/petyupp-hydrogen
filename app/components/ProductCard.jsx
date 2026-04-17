import React from 'react';
import { API_BASE_URL } from '@/config/api';
import { Link } from 'react-router';

const BACKEND_URL = API_BASE_URL;

/**
 * PetYupp ProductCard - White theme, teal/green accents, $ currency
 */
function ProductCard({ product, index = 0, showBadges = true }) {
  const discountPercent = product.original_price
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : 0;

  const imageUrl = product.image_url?.startsWith('http')
    ? product.image_url
    : product.image || `${BACKEND_URL}${product.image_url}`;

  const formatPrice = (price) => {
    if (typeof price === 'number') return price.toFixed(2);
    return price;
  };

  return (
    <div className="rounded-2xl overflow-hidden shadow-sm transition-all hover:shadow-md bg-white border border-gray-100 flex flex-col">
      <Link
        to={`/product/${product.slug || product.id}`}
        className="block flex-1"
      >
      {/* Product Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        <img
          src={imageUrl}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          loading="lazy"
        />

        {/* Badges - Top Left */}
        {showBadges && (
          <div className="absolute top-1.5 left-1.5 flex flex-col gap-1">
            {(product.displayTags?.isBestseller || index === 0) && (
              <span className="px-2 py-0.5 bg-[#06B6D4] text-white text-[9px] font-bold rounded-full uppercase shadow-sm">
                Bestseller
              </span>
            )}
            {(product.displayTags?.isNewLaunch || index === 1) && (
              <span className="px-2 py-0.5 bg-[#10B981] text-white text-[9px] font-bold rounded-full uppercase shadow-sm">
                New
              </span>
            )}
          </div>
        )}

        {/* Discount Badge */}
        {discountPercent > 0 && (
          <div className="absolute top-1.5 right-1.5">
            <span className="px-2 py-0.5 bg-[#10B981] text-white text-[9px] font-bold rounded-full">
              {discountPercent}% OFF
            </span>
          </div>
        )}

        {/* Rating */}
        {product.rating && (
          <div className="absolute bottom-1.5 right-1.5 flex items-center gap-0.5 px-2 py-0.5 bg-black/60 rounded-full text-white text-[9px] font-semibold backdrop-blur-sm">
            <span className="text-yellow-400">★</span>
            <span>{product.rating}</span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-3">
        <h3 className="text-xs font-semibold leading-tight line-clamp-2 min-h-[32px] mb-1.5 text-gray-900">
          {product.name}
        </h3>
            {/* Star ratings */}
            <div className="flex items-center gap-1 mb-1">
              {[1,2,3,4,5].map((star) => (
                <svg key={star} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="#F59E0B" className="w-3.5 h-3.5">
                  <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
                </svg>
              ))}
              <span className="text-xs font-medium text-gray-700">
                {product.rating || '4.8'}
              </span>
              <span className="text-xs text-gray-400">
                ({product.reviewCount || '234'})
              </span>
            </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-sm font-black text-gray-900">
            ${formatPrice(product.price)}
          </span>
          {product.original_price && product.original_price > product.price && (
            <span className="text-xs line-through text-gray-400">
              ${formatPrice(product.original_price)}
            </span>
          )}
        </div>
      </div>
      </Link>
      <div className="px-3 pb-3 pt-2">
        <button className="bg-[#06B6D4] text-white rounded-lg py-2 px-4 w-full text-sm font-medium hover:bg-[#0891B2] transition-colors">
          Add to Cart
        </button>
      </div>
    </div>
  );
}

export default ProductCard;
